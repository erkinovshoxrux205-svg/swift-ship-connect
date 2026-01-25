import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth";
import { firebaseAuth, setupRecaptcha } from "@/config/firebase";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "client" | "carrier" | "admin";

interface FirebaseAuthContextType {
  user: FirebaseUser | null;
  role: AppRole | null;
  loading: boolean;
  signUp: (email: string, password: string, role: AppRole, fullName: string) => Promise<{ error: Error | null; user?: FirebaseUser | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithPhone: (phoneNumber: string, recaptchaContainerId: string) => Promise<{ error: Error | null; confirmationResult?: ConfirmationResult }>;
  confirmPhoneCode: (confirmationResult: ConfirmationResult, code: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ error: Error | null }>;
  resetPasswordWithPhone: (phoneNumber: string, recaptchaContainerId: string) => Promise<{ error: Error | null; confirmationResult?: ConfirmationResult }>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export const FirebaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = useCallback(async (firebaseUid: string) => {
    const { data, error } = await supabase
      .from("firebase_user_roles")
      .select("role")
      .eq("firebase_uid", firebaseUid)
      .single();

    if (error) {
      // Try legacy user_roles table via profiles
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("firebase_uid", firebaseUid)
        .single();
      
      if (profileData?.user_id) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", profileData.user_id)
          .single();
        return roleData?.role as AppRole || null;
      }
      return null;
    }
    return data?.role as AppRole;
  }, []);

  const syncProfileToSupabase = useCallback(async (
    firebaseUser: FirebaseUser, 
    role: AppRole, 
    fullName: string
  ) => {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("firebase_uid", firebaseUser.uid)
      .single();

    if (!existingProfile) {
      // Create profile
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: firebaseUser.uid,
          firebase_uid: firebaseUser.uid,
          full_name: fullName,
          phone: firebaseUser.phoneNumber?.replace(/\D/g, '') || null,
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }
    }

    // Check if firebase_user_roles exists
    const { data: existingRole } = await supabase
      .from("firebase_user_roles")
      .select("id")
      .eq("firebase_uid", firebaseUser.uid)
      .single();

    if (!existingRole) {
      // Assign role
      const { error: roleError } = await supabase
        .from("firebase_user_roles")
        .insert({
          firebase_uid: firebaseUser.uid,
          role: role,
        });

      if (roleError) {
        console.error("Role assignment error:", roleError);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        setTimeout(() => {
          fetchUserRole(firebaseUser.uid).then(setRole);
        }, 0);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserRole]);

  const signUp = async (email: string, password: string, role: AppRole, fullName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      
      // Sync to Supabase
      await syncProfileToSupabase(result.user, role, fullName);
      setRole(role);
      
      return { error: null, user: result.user };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithPhone = async (phoneNumber: string, recaptchaContainerId: string) => {
    try {
      const recaptchaVerifier = setupRecaptcha(recaptchaContainerId);
      const confirmationResult = await signInWithPhoneNumber(firebaseAuth, phoneNumber, recaptchaVerifier);
      return { error: null, confirmationResult };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const confirmPhoneCode = async (confirmationResult: ConfirmationResult, code: string) => {
    try {
      await confirmationResult.confirm(code);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(firebaseAuth);
    setUser(null);
    setRole(null);
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const resetPasswordWithPhone = async (phoneNumber: string, recaptchaContainerId: string) => {
    try {
      const recaptchaVerifier = setupRecaptcha(recaptchaContainerId);
      const confirmationResult = await signInWithPhoneNumber(firebaseAuth, phoneNumber, recaptchaVerifier);
      return { error: null, confirmationResult };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <FirebaseAuthContext.Provider
      value={{
        user,
        role,
        loading,
        signUp,
        signIn,
        signInWithPhone,
        confirmPhoneCode,
        signOut,
        sendPasswordReset,
        resetPasswordWithPhone,
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
};

export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error("useFirebaseAuth must be used within a FirebaseAuthProvider");
  }
  return context;
};
