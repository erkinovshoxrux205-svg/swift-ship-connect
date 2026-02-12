import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User } from "firebase/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  firebaseCreateUser,
  firebaseSignIn,
  firebaseSignInWithGoogle,
  firebaseSendEmailVerification,
  signOutFromFirebase,
  firebaseOnAuthStateChanged
} from "@/lib/firebase";

export type AppRole = "client" | "carrier" | "admin";

// Unified user interface for both Firebase and Telegram users
export interface UnifiedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  photoURL: string | null;
  provider: 'firebase' | 'telegram';
  // Firebase-specific: allows reload()
  reload?: () => Promise<void>;
}

interface TelegramSession {
  user: {
    id: string;
    fullName: string;
    phone: string;
    role: string;
    email?: string;
    avatarUrl?: string;
    provider: string;
  };
  sessionToken: string;
}

interface AuthContextType {
  user: UnifiedUser | null;
  role: AppRole | null;
  loading: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  accountStatus: string;
  isTelegramUser: boolean;
  signUp: (email: string, password: string, role: AppRole, fullName: string, phone?: string, referralCode?: string) => Promise<{ error: Error | null; success: boolean; requiresEmailVerification?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: (role?: AppRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
  loginWithTelegram: (sessionData: TelegramSession) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TELEGRAM_SESSION_KEY = 'telegram_session';

function firebaseUserToUnified(fbUser: User): UnifiedUser {
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName,
    emailVerified: fbUser.emailVerified,
    phoneNumber: fbUser.phoneNumber,
    photoURL: fbUser.photoURL,
    provider: 'firebase',
    reload: () => fbUser.reload(),
  };
}

function telegramSessionToUnified(session: TelegramSession): UnifiedUser {
  return {
    uid: session.user.id,
    email: session.user.email || null,
    displayName: session.user.fullName,
    emailVerified: true, // Telegram users are phone-verified, skip email check
    phoneNumber: session.user.phone,
    photoURL: session.user.avatarUrl || null,
    provider: 'telegram',
  };
}

export const FirebaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [accountStatus, setAccountStatus] = useState('pending');
  const [isTelegramUser, setIsTelegramUser] = useState(false);
  const { toast } = useToast();

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        console.error("Error fetching role:", error);
        return null;
      }
      return data?.role as AppRole;
    } catch (error) {
      console.error("Database error in fetchUserRole:", error);
      return null;
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("email_verified, phone_verified")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setEmailVerified(false);
          setPhoneVerified(false);
          setAccountStatus('pending');
          return;
        }
        console.error("Error fetching profile:", error);
        setEmailVerified(false);
        setPhoneVerified(false);
        setAccountStatus('pending');
        return;
      }

      setEmailVerified(data?.email_verified || false);
      setPhoneVerified(data?.phone_verified || false);
      setAccountStatus('active');
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      setEmailVerified(false);
      setPhoneVerified(false);
      setAccountStatus('pending');
    }
  };

  const syncUserWithSupabase = async (firebaseUser: User, role: AppRole, fullName: string, phone?: string, referralCode?: string) => {
    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', firebaseUser.uid)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            user_id: firebaseUser.uid,
            full_name: fullName,
            phone: phone?.replace(/\D/g, ''),
            email: firebaseUser.email,
            email_verified: firebaseUser.emailVerified,
            auth_method: 'email',
          })
          .select()
          .single();

        if (profileError) throw profileError;

        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: firebaseUser.uid, role })
          .select()
          .single();

        if (roleError) throw roleError;

        const referralCodeGenerated = `${role === 'client' ? 'C' : 'D'}${firebaseUser.uid.substring(0, 6).toUpperCase()}`;
        await supabase.from('profiles').update({ referral_code: referralCodeGenerated }).eq('user_id', firebaseUser.uid);

        if (referralCode) {
          const { data: referrerProfile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('referral_code', referralCode.toUpperCase())
            .single();

          if (referrerProfile) {
            await supabase.from('referrals').insert({
              referrer_id: referrerProfile.user_id,
              referred_id: firebaseUser.uid,
              referral_code: referralCode.toUpperCase()
            });
          }
        }
      } else {
        await supabase.from('profiles').update({
          email_verified: firebaseUser.emailVerified
        }).eq('user_id', firebaseUser.uid);
      }
    } catch (error) {
      console.error("Error syncing user with Supabase:", error);
    }
  };

  // ─── TELEGRAM SESSION MANAGEMENT ────────────────────────────────────
  const loadTelegramSession = useCallback(async () => {
    try {
      const stored = localStorage.getItem(TELEGRAM_SESSION_KEY);
      if (!stored) return null;

      const session: TelegramSession = JSON.parse(stored);
      if (!session.sessionToken || !session.user?.id) {
        localStorage.removeItem(TELEGRAM_SESSION_KEY);
        return null;
      }

      // Validate session with server
      const { data, error } = await supabase.functions.invoke('telegram-login', {
        body: { action: 'validate_session', phone: session.user.phone, code: session.sessionToken },
      });

      if (error || !data?.success) {
        localStorage.removeItem(TELEGRAM_SESSION_KEY);
        return null;
      }

      // Update session with fresh server data
      session.user = data.user;
      localStorage.setItem(TELEGRAM_SESSION_KEY, JSON.stringify(session));
      return session;
    } catch {
      localStorage.removeItem(TELEGRAM_SESSION_KEY);
      return null;
    }
  }, []);

  const loginWithTelegram = useCallback((sessionData: TelegramSession) => {
    localStorage.setItem(TELEGRAM_SESSION_KEY, JSON.stringify(sessionData));
    // Also keep legacy key for backward compatibility
    localStorage.setItem('telegram_user', JSON.stringify(sessionData.user));

    const unifiedUser = telegramSessionToUnified(sessionData);
    setUser(unifiedUser);
    setRole(sessionData.user.role as AppRole);
    setIsTelegramUser(true);
    setEmailVerified(true); // Telegram users bypass email verification
    setPhoneVerified(true);
    setAccountStatus('active');
    setLoading(false);
  }, []);

  const refreshUserData = async () => {
    if (!user) return;

    if (user.provider === 'telegram') {
      const session = await loadTelegramSession();
      if (session) {
        const r = await fetchUserRole(session.user.id);
        setRole(r);
      }
    } else {
      await fetchUserRole(user.uid).then(setRole);
      await fetchUserProfile(user.uid);
    }
  };

  const checkEmailVerification = async (): Promise<boolean> => {
    if (!user) return false;
    if (user.provider === 'telegram') return true; // Telegram users are always "verified"

    if (user.reload) await user.reload();

    // Re-read from Firebase
    // This is a simplified approach
    return emailVerified;
  };

  // ─── INITIALIZATION ─────────────────────────────────────────────────
  useEffect(() => {
    let firebaseUnsub: (() => void) | null = null;

    const init = async () => {
      // 1) Check Telegram session first
      const tgSession = await loadTelegramSession();
      if (tgSession) {
        const unifiedUser = telegramSessionToUnified(tgSession);
        setUser(unifiedUser);
        setIsTelegramUser(true);
        setEmailVerified(true);
        setPhoneVerified(true);
        setAccountStatus('active');

        const r = await fetchUserRole(tgSession.user.id);
        setRole(r || (tgSession.user.role as AppRole));
        setLoading(false);
        // Still set up Firebase listener in case user switches to Firebase auth
      }

      // 2) Firebase auth listener
      firebaseUnsub = firebaseOnAuthStateChanged(async (firebaseUser) => {
        // If we have a Telegram session active, Firebase state doesn't override
        const currentTgSession = localStorage.getItem(TELEGRAM_SESSION_KEY);
        if (currentTgSession) return;

        if (firebaseUser) {
          const unifiedUser = firebaseUserToUnified(firebaseUser);
          setUser(unifiedUser);
          setIsTelegramUser(false);

          const [r] = await Promise.all([
            fetchUserRole(firebaseUser.uid),
            fetchUserProfile(firebaseUser.uid),
          ]);
          setRole(r);

          if (!firebaseUser.emailVerified) {
            setEmailVerified(false);
          } else {
            setEmailVerified(true);
          }
        } else {
          // Only clear if no Telegram session
          if (!localStorage.getItem(TELEGRAM_SESSION_KEY)) {
            setUser(null);
            setRole(null);
            setEmailVerified(false);
            setPhoneVerified(false);
            setAccountStatus('pending');
            setIsTelegramUser(false);
          }
        }

        setLoading(false);
      });
    };

    init();

    return () => {
      if (firebaseUnsub) firebaseUnsub();
    };
  }, [loadTelegramSession]);

  // ─── EMAIL AUTH METHODS ─────────────────────────────────────────────
  const signUp = async (email: string, password: string, role: AppRole, fullName: string, phone?: string, referralCode?: string) => {
    try {
      const userCredential = await firebaseCreateUser(email, password);
      await firebaseSendEmailVerification(userCredential.user);
      await syncUserWithSupabase(userCredential.user, role, fullName, phone, referralCode);
      return { error: null, success: true, requiresEmailVerification: true };
    } catch (error) {
      return { error: error as Error, success: false };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await firebaseSignIn(email, password);
      if (!userCredential.user.emailVerified) {
        return { error: new Error('Пожалуйста, подтвердите ваш email перед входом') };
      }
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const handleGoogleSignIn = async (role: AppRole = 'client') => {
    try {
      const userCredential = await firebaseSignInWithGoogle();
      await syncUserWithSupabase(userCredential.user, role, userCredential.user.displayName || '');
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const handleSignOut = async () => {
    // Logout from Telegram if applicable
    const tgSession = localStorage.getItem(TELEGRAM_SESSION_KEY);
    if (tgSession) {
      try {
        const session: TelegramSession = JSON.parse(tgSession);
        await supabase.functions.invoke('telegram-login', {
          body: { action: 'logout', phone: session.user.phone, code: session.sessionToken },
        });
      } catch { }
      localStorage.removeItem(TELEGRAM_SESSION_KEY);
      localStorage.removeItem('telegram_user');
    }

    // Logout from Firebase
    await signOutFromFirebase();

    setUser(null);
    setRole(null);
    setEmailVerified(false);
    setPhoneVerified(false);
    setAccountStatus('pending');
    setIsTelegramUser(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        emailVerified,
        phoneVerified,
        accountStatus,
        isTelegramUser,
        signUp,
        signIn,
        signInWithGoogle: handleGoogleSignIn,
        signOut: handleSignOut,
        refreshUserData,
        checkEmailVerification,
        loginWithTelegram,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useFirebaseAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useFirebaseAuth must be used within a FirebaseAuthProvider");
  }
  return context;
};
