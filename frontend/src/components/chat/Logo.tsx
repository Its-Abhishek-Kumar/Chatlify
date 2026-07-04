import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: "large" | "small";
  textClassName?: string;
  tagline?: string;
}

const GradientI: React.FC = () => {
  return (
    <span className="relative inline-block mx-[-0.015em]">
      ı
      <span
        className="absolute top-[0.08em] left-1/2 -translate-x-1/2 w-[0.2em] h-[0.2em] rounded-full bg-gradient-to-tr from-[#00C2FF] to-[#8B5CF6]"
        style={{
          boxShadow: "0 0 10px rgba(139, 92, 246, 0.8), 0 0 4px rgba(0, 194, 255, 0.4)",
        }}
      />
    </span>
  );
};

const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  size = 110, 
  showText = false,
  variant = "large",
  textClassName = "",
  tagline = ""
}) => {
  return (
    <div 
      className={`flex items-center select-none ${
        variant === "large" 
          ? "flex-col md:flex-row gap-5 md:gap-4 text-center md:text-left" 
          : "flex-row gap-2.5 text-left"
      } ${className}`}
    >
      {/* Dynamic Svg Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className={`${
          showText && variant === "large" ? "w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28" : ""
        } shrink-0 filter drop-shadow-[0_8px_24px_rgba(37,99,235,0.22)]`}
      >
        <defs>
          {/* Chatlify Outer C Gradient */}
          <linearGradient id="chatlifyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00C2FF" />
            <stop offset="40%" stopColor="#2563EB" />
            <stop offset="85%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#D946EF" />
          </linearGradient>

          {/* Inner Bubble Gradient */}
          <linearGradient id="innerBubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#18191E" />
            <stop offset="100%" stopColor="#090A0D" />
          </linearGradient>

          {/* Inner Bubble Highlights */}
          <linearGradient id="innerBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.15)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.02)" />
          </linearGradient>
        </defs>

        {/* Outer C Shape (Circular arc from top-right to bottom-right) */}
        <path
          d="M 151 60 A 68 68 0 1 0 151 140"
          fill="none"
          stroke="url(#chatlifyGrad)"
          strokeWidth="28"
          strokeLinecap="round"
        />

        {/* Bubble Tail at bottom-left, overlapping & blending with the outer C stroke */}
        <path
          d="M 64 146 
             L 28 178 
             C 24 182, 19 175, 23 169 
             L 43 124 
             Z"
          fill="url(#chatlifyGrad)"
        />

        {/* Dark Inner Bubble Circle */}
        <circle
          cx="96"
          cy="100"
          r="48"
          fill="url(#innerBubbleGrad)"
          stroke="url(#innerBorderGrad)"
          strokeWidth="1.5"
        />

        {/* Three Ellipsis Dots with Chatlify Gradient */}
        <circle cx="76" cy="100" r="5.5" fill="url(#chatlifyGrad)" />
        <circle cx="96" cy="100" r="5.5" fill="url(#chatlifyGrad)" />
        <circle cx="116" cy="100" r="5.5" fill="url(#chatlifyGrad)" />
      </svg>

      {/* Branding Text block */}
      {showText && (
        <div className={`flex flex-col justify-center text-left ${textClassName}`}>
          <h1 
            className={`${
              variant === "large" 
                ? "text-4xl sm:text-5xl md:text-6xl" 
                : "text-lg md:text-xl font-bold"
            } font-extrabold text-white leading-none whitespace-nowrap`}
            style={{ 
              fontFamily: "'Manrope', 'Geist', 'Inter', sans-serif",
              fontWeight: 800,
              letterSpacing: "-0.004em"
            }}
          >
            Chatl<GradientI />fy
          </h1>
          {(variant === "large" || tagline) && (
            <p 
              className="text-[9px] sm:text-[10px] md:text-[11px] tracking-[0.24em] uppercase font-bold mt-2.5 whitespace-nowrap bg-gradient-to-r from-[#00C2FF] via-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent"
              style={{ fontFamily: "'Manrope', 'Geist', 'Inter', sans-serif" }}
            >
              {tagline || "CONNECT. COMMUNICATE. ELEVATE."}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
