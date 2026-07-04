import { useAuthStore } from "./store/authStore";
import ChatLayout from "./pages/ChatLayout";
import Login from "./pages/Login";
import { useEffect, useState } from "react";
import { connectSocket } from "./services/socket";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";

function App() {
  const token = useAuthStore((s) => s.token);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();

    // Check query params for password reset token
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setResetToken(tokenParam);
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token);

    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
    };

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect); // ✅ cleanup
    };
  }, [token]);

  const handleResetComplete = () => {
    // Clear URL query token parameter
    const url = new URL(window.location.href);
    url.searchParams.delete("token");
    window.history.replaceState({}, document.title, url.pathname);
    setResetToken(null);
    setMode("login");
  };

  if (resetToken) {
    return <ResetPassword token={resetToken} onComplete={handleResetComplete} />;
  }

  return token ? (
    <ChatLayout />
  ) : mode === "login" ? (
    <Login switchMode={() => setMode("signup")} />
  ) : (
    <Signup switchMode={() => setMode("login")} />
  );
}

export default App;
