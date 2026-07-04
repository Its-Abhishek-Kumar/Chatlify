import { useState } from "react";
import { signup } from "../services/auth";
import { useAuthStore } from "../store/authStore";
import Logo from "../components/chat/Logo";

const Signup = ({ switchMode }: any) => {
  const setAuth = useAuthStore((s) => s.setAuth);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  
  // Validation feedback states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) {
      nextErrors.name = "Full name is required";
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      nextErrors.username = "Username is required";
    } else {
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(cleanUsername)) {
        nextErrors.username = "Username must be 3-20 alphanumeric characters or underscores";
      }
    }

    const cleanId = identifier.trim();
    if (!cleanId) {
      nextErrors.identifier = "Email or mobile number is required";
    } else {
      const isEmail = cleanId.includes("@");
      if (isEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanId)) {
          nextErrors.identifier = "Please enter a valid email format";
        }
      } else {
        const phoneClean = cleanId.replace(/[^\d+]/g, "");
        if (phoneClean.length < 6) {
          nextErrors.identifier = "Please enter a valid mobile number (min 6 digits)";
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

  const handleSignup = async () => {
    setServerError("");
    if (!validateForm()) return;

    setLoading(true);

    try {
      const deviceId = localStorage.getItem("device_id") || Math.random().toString(36).substring(2, 10);
      localStorage.setItem("device_id", deviceId);

      const res = await signup({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password: password.trim(),
        identifier: identifier.trim(),
        deviceId
      });
      setAuth(res.data.user, res.data.token);
    } catch (err: any) {
      setServerError(err.response?.data?.message || "Registration failed, please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#09090B] relative overflow-hidden">
      {/* Premium Indigo/Violet Glow Backdrops */}
      <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] rounded-full bg-blue-600/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[20%] w-[450px] h-[450px] rounded-full bg-violet-600/5 blur-[160px] pointer-events-none" />

      {/* Signup Card */}
      <div className="glass p-8 rounded-modal w-[400px] max-w-full z-10 flex flex-col text-left shadow-2xl relative border border-white/5">
        
        {/* LOGO */}
        <div className="mb-6">
          <Logo size={36} showText={true} variant="small" tagline="Real-time messaging" />
        </div>

        <h2 className="text-xl font-bold mb-1 text-white tracking-tight">
          Create account
        </h2>
        <p className="text-xs text-[#71717A] mb-5 leading-relaxed">
          Get started with your email address or mobile number.
        </p>

        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#D4D4D8] mb-1 uppercase tracking-wider text-[9px]">
              Full Name
            </label>
            <input
              placeholder="Your Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
              }}
              className={`w-full px-3 py-2 bg-[#111113] border rounded-btn text-white text-xs outline-none transition ${
                errors.name ? "border-red-500/50 focus:border-red-500" : "border-[#2A2A30] focus:border-[#2563EB]"
              }`}
            />
            {errors.name && (
              <p className="text-red-400 text-[10px] mt-1 font-semibold">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#D4D4D8] mb-1 uppercase tracking-wider text-[9px]">
              Username
            </label>
            <input
              placeholder="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errors.username) setErrors(prev => ({ ...prev, username: "" }));
              }}
              className={`w-full px-3 py-2 bg-[#111113] border rounded-btn text-white text-xs outline-none transition ${
                errors.username ? "border-red-500/50 focus:border-red-500" : "border-[#2A2A30] focus:border-[#2563EB]"
              }`}
            />
            {errors.username && (
              <p className="text-red-400 text-[10px] mt-1 font-semibold">{errors.username}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#D4D4D8] mb-1 uppercase tracking-wider text-[9px]">
              Email
            </label>
            <input
              placeholder="email address"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (errors.identifier) setErrors(prev => ({ ...prev, identifier: "" }));
              }}
              className={`w-full px-3 py-2 bg-[#111113] border rounded-btn text-white text-xs outline-none transition ${
                errors.identifier ? "border-red-500/50 focus:border-red-500" : "border-[#2A2A30] focus:border-[#2563EB]"
              }`}
            />
            {errors.identifier && (
              <p className="text-red-400 text-[10px] mt-1 font-semibold">{errors.identifier}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#D4D4D8] mb-1 uppercase tracking-wider text-[9px]">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors(prev => ({ ...prev, password: "" }));
              }}
              className={`w-full px-3 py-2 bg-[#111113] border rounded-btn text-white text-xs outline-none transition ${
                errors.password ? "border-red-500/50 focus:border-red-500" : "border-[#2A2A30] focus:border-[#2563EB]"
              }`}
            />
            {errors.password && (
              <p className="text-red-400 text-[10px] mt-1 font-semibold">{errors.password}</p>
            )}
          </div>

          {serverError && <p className="text-red-400 text-xs mt-1 text-center font-semibold">{serverError}</p>}

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full py-2.5 rounded-btn btn-gradient text-white font-bold text-xs transition duration-200 disabled:opacity-50 mt-2 shadow-lg cursor-pointer"
          >
            {loading ? "Registering..." : "Create Free Account"}
          </button>
        </div>

        <p className="text-xs text-center mt-6 text-[#71717A]">
          Already have an account?{" "}
          <span
            className="text-[#3B82F6] hover:text-[#60A5FA] cursor-pointer hover:underline font-bold"
            onClick={switchMode}
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;
