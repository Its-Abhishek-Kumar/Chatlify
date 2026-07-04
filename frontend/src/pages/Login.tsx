import { useState } from "react";
import { login, forgotPassword } from "../services/auth";
import { useAuthStore } from "../store/authStore";
import Logo from "../components/chat/Logo";

const Login = ({ switchMode }: any) => {
  const setAuth = useAuthStore((s) => s.setAuth);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  
  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState("");

  // Validation feedback states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {};
    const trimmedId = identifier.trim();
    
    if (!trimmedId) {
      nextErrors.identifier = "Email or username is required";
    } else {
      const isEmail = trimmedId.includes("@");
      if (isEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedId)) {
          nextErrors.identifier = "Please enter a valid email format";
        }
      } else {
        if (trimmedId.length < 3) {
          nextErrors.identifier = "Username must be at least 3 characters";
        }
      }
    }

    if (!password) {
      nextErrors.password = "Password is required";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async () => {
    setServerError("");
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Pass a random or consistent device ID for session tracking
      const deviceId = localStorage.getItem("device_id") || Math.random().toString(36).substring(2, 10);
      localStorage.setItem("device_id", deviceId);

      const res = await login({ identifier: identifier.trim(), password: password.trim(), deviceId });
      setAuth(res.data.user, res.data.token);
    } catch (err: any) {
      setServerError(err.response?.data?.message || "Login failed, please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setForgotError("");
    setForgotSuccess("");
    const trimmedEmail = forgotEmail.trim();

    if (!trimmedEmail) {
      setForgotError("Email address is required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setForgotError("Please enter a valid email address");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await forgotPassword({ email: trimmedEmail });
      setForgotSuccess(res.data.message || "A recovery link has been sent to your email.");
    } catch (err: any) {
      setForgotError(err.response?.data?.message || "Failed to process request. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#09090B] relative overflow-hidden">
      {/* Premium Indigo/Violet Glow Backdrops */}
      <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] rounded-full bg-blue-600/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[20%] w-[450px] h-[450px] rounded-full bg-violet-600/5 blur-[160px] pointer-events-none" />

      {/* Login Card */}
      <div className="glass p-8 rounded-modal w-[390px] max-w-full z-10 flex flex-col text-left shadow-2xl relative border border-white/5">
        
        {/* LOGO */}
        <div className="mb-6">
          <Logo size={36} showText={true} variant="small" tagline="Real-time messaging" />
        </div>

        <h2 className="text-xl font-bold mb-1 text-white tracking-tight">
          Welcome back
        </h2>
        <p className="text-xs text-[#71717A] mb-6 leading-relaxed">
          Sign in using your registered email address or username.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#D4D4D8] mb-1.5 uppercase tracking-wider text-[9px]">
              Email or Username
            </label>
            <input
              placeholder="email or username"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (errors.identifier) setErrors(prev => ({ ...prev, identifier: "" }));
              }}
              className={`w-full px-3 py-2.5 bg-[#111113] border rounded-btn text-white text-xs outline-none transition ${
                errors.identifier ? "border-red-500/50 focus:border-red-500" : "border-[#2A2A30] focus:border-[#2563EB]"
              }`}
            />
            {errors.identifier && (
              <p className="text-red-400 text-[10px] mt-1 font-semibold">{errors.identifier}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="block text-xs font-semibold text-[#D4D4D8] uppercase tracking-wider text-[9px]">
                Password
              </label>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors(prev => ({ ...prev, password: "" }));
              }}
              className={`w-full px-3 py-2.5 bg-[#111113] border rounded-btn text-white text-xs outline-none transition ${
                errors.password ? "border-red-500/50 focus:border-red-500" : "border-[#2A2A30] focus:border-[#2563EB]"
              }`}
            />
            {errors.password && (
              <p className="text-red-400 text-[10px] mt-1 font-semibold">{errors.password}</p>
            )}
            
            <div className="mt-2 text-right">
              <span
                onClick={() => setShowForgotModal(true)}
                className="text-[9px] text-[#3B82F6] hover:text-[#60A5FA] hover:underline cursor-pointer font-bold uppercase tracking-wider"
              >
                Forgot Password?
              </span>
            </div>
          </div>

          {serverError && <p className="text-red-400 text-xs mt-1 text-center font-semibold">{serverError}</p>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-2.5 rounded-btn btn-gradient text-white font-bold text-xs transition duration-200 disabled:opacity-50 mt-2 shadow-lg cursor-pointer"
          >
            {loading ? "Signing In..." : "Sign In to Workspace"}
          </button>
        </div>

        <p className="text-xs text-center mt-6 text-[#71717A]">
          New to Chatlify?{" "}
          <span
            className="text-[#3B82F6] hover:text-[#60A5FA] cursor-pointer hover:underline font-bold"
            onClick={switchMode}
          >
            Create an account
          </span>
        </p>
      </div>

      {/* Glassmorphic Forgot Password recovery modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
          <div className="glass p-6 rounded-modal w-full max-w-[360px] border border-white/10 shadow-2xl relative">
            <h3 className="text-base font-bold text-white tracking-tight mb-1">
              Recover Account
            </h3>
            <p className="text-[11px] text-[#A1A1AA] leading-relaxed mb-4">
              Enter your registered email address to receive password recovery instructions.
            </p>

            {forgotSuccess ? (
              <div className="space-y-4">
                <p className="text-xs text-green-400 font-medium bg-green-500/10 border border-green-500/20 p-3 rounded-btn leading-normal">
                  {forgotSuccess}
                </p>
                <button
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotEmail("");
                    setForgotSuccess("");
                    setForgotError("");
                  }}
                  className="w-full py-2 bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] hover:from-[#3B82F6] hover:to-[#A78BFA] text-white text-xs font-bold rounded-btn transition cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold text-[#D4D4D8] uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    placeholder="name@gmail.com"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      if (forgotError) setForgotError("");
                    }}
                    className={`w-full px-3 py-2.5 bg-[#111113] border rounded-btn text-white text-xs outline-none transition ${
                      forgotError ? "border-red-500/50 focus:border-red-500" : "border-[#2A2A30] focus:border-[#2563EB]"
                    }`}
                  />
                  {forgotError && (
                    <p className="text-red-400 text-[10px] mt-1 font-semibold">{forgotError}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotEmail("");
                      setForgotError("");
                      setForgotSuccess("");
                    }}
                    disabled={forgotLoading}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-btn border border-white/5 transition cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleForgotPassword}
                    disabled={forgotLoading}
                    className="flex-1 py-2 bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] hover:from-[#3B82F6] hover:to-[#A78BFA] text-white text-xs font-bold rounded-btn transition cursor-pointer disabled:opacity-50"
                  >
                    {forgotLoading ? "Sending..." : "Recover"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
