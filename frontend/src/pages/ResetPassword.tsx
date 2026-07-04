import { useState } from "react";
import { resetPassword } from "../services/auth";
import Logo from "../components/chat/Logo";

interface ResetPasswordProps {
  token: string;
  onComplete: () => void;
}

const ResetPassword = ({ token, onComplete }: ResetPasswordProps) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [serverError, setServerError] = useState("");

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!newPassword) {
      nextErrors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      nextErrors.newPassword = "Password must be at least 6 characters long";
    }

    if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleReset = async () => {
    setServerError("");
    setSuccess("");
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await resetPassword({ token, newPassword: newPassword.trim() });
      setSuccess(res.data.message || "Your password has been successfully updated!");
    } catch (err: any) {
      setServerError(err.response?.data?.message || "Failed to reset password. The recovery link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#09090B] relative overflow-hidden">
      {/* Premium Indigo/Violet Glow Backdrops */}
      <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] rounded-full bg-blue-600/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[20%] w-[450px] h-[450px] rounded-full bg-violet-600/5 blur-[160px] pointer-events-none" />

      {/* Reset Card */}
      <div className="glass p-8 rounded-modal w-[390px] max-w-full z-10 flex flex-col text-left shadow-2xl relative border border-white/5">
        {/* LOGO */}
        <div className="mb-6">
          <Logo size={36} showText={true} variant="small" tagline="Real-time messaging" />
        </div>

        <h2 className="text-xl font-bold mb-1 text-white tracking-tight">
          Reset Password
        </h2>
        <p className="text-xs text-[#71717A] mb-6 leading-relaxed">
          Create a new secure password for your account.
        </p>

        {success ? (
          <div className="space-y-4">
            <p className="text-xs text-green-400 font-medium bg-green-500/10 border border-green-500/20 p-3 rounded-btn leading-normal">
              {success}
            </p>
            <button
              onClick={onComplete}
              className="w-full py-2.5 bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] hover:from-[#3B82F6] hover:to-[#A78BFA] text-white text-xs font-bold rounded-btn transition cursor-pointer shadow-lg"
            >
              Sign In Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#D4D4D8] mb-1.5 uppercase tracking-wider text-[9px]">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: "" }));
                }}
                className={`w-full px-3 py-2.5 bg-[#111113] border rounded-btn text-white text-xs outline-none transition ${
                  errors.newPassword ? "border-red-500/50 focus:border-red-500" : "border-[#2A2A30] focus:border-[#2563EB]"
                }`}
              />
              {errors.newPassword && (
                <p className="text-red-400 text-[10px] mt-1 font-semibold">{errors.newPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D4D4D8] mb-1.5 uppercase tracking-wider text-[9px]">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }}
                className={`w-full px-3 py-2.5 bg-[#111113] border rounded-btn text-white text-xs outline-none transition ${
                  errors.confirmPassword ? "border-red-500/50 focus:border-red-500" : "border-[#2A2A30] focus:border-[#2563EB]"
                }`}
              />
              {errors.confirmPassword && (
                <p className="text-red-400 text-[10px] mt-1 font-semibold">{errors.confirmPassword}</p>
              )}
            </div>

            {serverError && <p className="text-red-400 text-xs mt-1 text-center font-semibold">{serverError}</p>}

            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full py-2.5 rounded-btn btn-gradient text-white font-bold text-xs transition duration-200 disabled:opacity-50 mt-2 shadow-lg cursor-pointer"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>

            <div className="text-center mt-2">
              <span
                onClick={onComplete}
                className="text-[10px] text-[#71717A] hover:text-white cursor-pointer hover:underline font-bold"
              >
                Back to Login
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
