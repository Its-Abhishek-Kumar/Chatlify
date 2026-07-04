import { useMemo, memo } from "react";

interface AvatarProps {
  src?: string;
  name: string;
  className?: string;
  online?: boolean;
}

const Avatar = memo(({ src, name, className = "w-12 h-12", online = false }: AvatarProps) => {
  const initials = useMemo(() => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return "";
    if (parts.length === 1) {
      return parts[0].slice(0, 1).toUpperCase();
    }
    const first = parts[0].slice(0, 1);
    const second = parts[1].slice(0, 1);
    return (first + second).toUpperCase();
  }, [name]);

  const style = useMemo(() => {
    if (src) return null;
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      { bg: "rgba(16, 185, 129, 0.15)", text: "#34d399", border: "rgba(16, 185, 129, 0.3)" }, // Emerald
      { bg: "rgba(59, 130, 246, 0.15)", text: "#60a5fa", border: "rgba(59, 130, 246, 0.3)" }, // Blue
      { bg: "rgba(99, 102, 241, 0.15)", text: "#818cf8", border: "rgba(99, 102, 241, 0.3)" }, // Indigo
      { bg: "rgba(139, 92, 246, 0.15)", text: "#a78bfa", border: "rgba(139, 92, 246, 0.3)" }, // Violet
      { bg: "rgba(168, 85, 247, 0.15)", text: "#c084fc", border: "rgba(168, 85, 247, 0.3)" }, // Purple
      { bg: "rgba(217, 70, 239, 0.15)", text: "#e879f9", border: "rgba(217, 70, 239, 0.3)" }, // Fuchsia
      { bg: "rgba(236, 72, 153, 0.15)", text: "#f472b6", border: "rgba(236, 72, 153, 0.3)" }, // Pink
      { bg: "rgba(244, 63, 94, 0.15)", text: "#fb7185", border: "rgba(244, 63, 94, 0.3)" },   // Rose
      { bg: "rgba(249, 115, 22, 0.15)", text: "#ff9048", border: "rgba(249, 115, 22, 0.3)" },   // Orange
      { bg: "rgba(20, 184, 166, 0.15)", text: "#2dd4bf", border: "rgba(20, 184, 166, 0.3)" },   // Teal
      { bg: "rgba(6, 182, 212, 0.15)", text: "#22d3ee", border: "rgba(6, 182, 212, 0.3)" }     // Cyan
    ];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }, [name, src]);

  // Determine if it is a valid non-placeholder custom avatar URL
  const hasCustomAvatar = src && src.trim() !== "" && !src.includes("dicebear.com");

  return (
    <div className={`relative shrink-0 ${className}`}>
      {hasCustomAvatar ? (
        <img
          src={src}
          className="w-full h-full rounded-full object-cover border border-white/10"
          alt={name}
        />
      ) : (
        <div
          className="w-full h-full rounded-full flex items-center justify-center font-bold text-xs uppercase border tracking-wider transition shadow-inner select-none"
          style={{
            backgroundColor: style?.bg,
            color: style?.text,
            borderColor: style?.border
          }}
        >
          {initials}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#111113] rounded-full" />
      )}
    </div>
  );
});

export default Avatar;
