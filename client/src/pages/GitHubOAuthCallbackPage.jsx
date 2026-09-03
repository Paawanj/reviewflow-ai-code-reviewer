
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAccessToken, setAccessToken } from "@/lib/authToken";
import { useAuth } from "@/context/AuthContext";
import { getCurrentUser } from "@/services/authApi";

export default function GitHubOAuthCallbackPage() {
  const navigate = useNavigate();
  const { completeAuthentication } = useAuth();
  const [message, setMessage] = useState("Completing GitHub sign-in...");

  useEffect(() => {
    async function finishLogin() {
      const values = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = values.get("accessToken");
      const oauthError = values.get("error");

      if (oauthError) {
        clearAccessToken();
        setMessage(oauthError);
        return;
      }

      if (!accessToken) {
        setMessage(
          "GitHub sign-in did not finish. Please return to login and try again."
        );
        return;
      }

      try {
        setAccessToken(accessToken);

        const user = await getCurrentUser();

        completeAuthentication({ accessToken, user });

        navigate("/dashboard", { replace: true });
      } catch {
        clearAccessToken();
        setMessage(
          "GitHub sign-in could not be verified. Please try again."
        );
      }
    }

    finishLogin();
  }, [completeAuthentication, navigate]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-5 text-sm text-slate-600">
      {message}
    </main>
  );
}

