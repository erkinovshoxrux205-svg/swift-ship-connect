import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { EmailVerificationTimer } from "./EmailVerificationTimer";

interface EmailVerificationWrapperProps {
  children: React.ReactNode;
}

export const EmailVerificationWrapper: React.FC<EmailVerificationWrapperProps> = ({ children }) => {
  const { user, emailVerified, loading, isTelegramUser } = useFirebaseAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && !emailVerified && !isTelegramUser) {
      return;
    }
  }, [user, emailVerified, loading, navigate, isTelegramUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Telegram users skip email verification
  if (isTelegramUser) {
    return <>{children}</>;
  }

  // If user is logged in but email is not verified, show verification screen
  if (user && !emailVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <EmailVerificationTimer
          email={user.email || ""}
          onVerified={() => {
            window.location.reload();
          }}
          onError={(error) => {
            console.error("Email verification error:", error);
          }}
        />
      </div>
    );
  }

  return <>{children}</>;
};
