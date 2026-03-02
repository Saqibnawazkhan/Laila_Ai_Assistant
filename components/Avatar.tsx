"use client";

import { motion } from "framer-motion";

interface AvatarProps {
  status: "idle" | "thinking" | "talking";
}

export default function Avatar({ status }: AvatarProps) {
  const statusColors = {
    idle: "from-orange-500 via-amber-400 to-yellow-400",
    thinking: "from-white via-gray-200 to-orange-300",
    talking: "from-orange-400 via-amber-300 to-white",
  };

  const statusGlow = {
    idle: "bg-orange-400/30",
    thinking: "bg-white/20",
    talking: "bg-amber-300/40",
  };

  const statusShadow = {
    idle: "shadow-orange-400/40",
    thinking: "shadow-white/30",
    talking: "shadow-amber-300/50",
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Glow effect behind avatar */}
      <div className="relative">
        {/* Outer ring pulse */}
        <motion.div
          className={`absolute -inset-3 rounded-full ${statusGlow[status]} blur-2xl`}
          animate={{
            scale: status === "talking" ? [1, 1.4, 1] : status === "thinking" ? [1, 1.2, 1] : [1, 1.08, 1],
            opacity: status === "talking" ? [0.3, 0.6, 0.3] : status === "thinking" ? [0.2, 0.4, 0.2] : [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: status === "talking" ? 0.6 : status === "thinking" ? 1.5 : 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Hexagonal glass ring */}
        <motion.div
          className="absolute -inset-2"
          style={{
            background: "conic-gradient(from 0deg, transparent, rgba(255, 140, 0, 0.6), transparent, rgba(255, 255, 255, 0.4), transparent)",
            clipPath: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: status === "thinking" ? 2 : 6, repeat: Infinity, ease: "linear" }}
        />

        {/* Main avatar circle */}
        <motion.div
          className={`relative w-28 h-28 rounded-full bg-gradient-to-br ${statusColors[status]} flex items-center justify-center shadow-lg ${statusShadow[status]} transition-all duration-500`}
          animate={{
            y: status === "idle" ? [0, -6, 0] : 0,
            scale: status === "talking" ? [1, 1.06, 1] : 1,
          }}
          transition={{
            duration: status === "idle" ? 3 : 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Inner ring */}
          <motion.div
            className="absolute inset-1 rounded-full border-2 border-white/20"
            animate={{
              rotate: status === "thinking" ? 360 : 0,
            }}
            transition={{
              duration: 2,
              repeat: status === "thinking" ? Infinity : 0,
              ease: "linear",
            }}
          />

          {/* Sound wave rings when talking */}
          {status === "talking" && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={`wave-${i}`}
                  className="absolute inset-0 rounded-full border border-white/20"
                  initial={{ scale: 1, opacity: 0.4 }}
                  animate={{ scale: [1, 1.5 + i * 0.2], opacity: [0.3, 0] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: "easeOut",
                  }}
                />
              ))}
            </>
          )}

          {/* Face */}
          <div className="relative flex flex-col items-center">
            {/* Eyes */}
            <div className="flex gap-4 mb-2">
              <motion.div
                className="w-2.5 h-2.5 bg-white rounded-full"
                animate={{
                  scaleY: status === "talking" ? [1, 0.3, 1] : [1, 0.1, 1],
                }}
                transition={{
                  duration: status === "talking" ? 0.4 : 3,
                  repeat: Infinity,
                  repeatDelay: status === "talking" ? 0.2 : 2,
                }}
              />
              <motion.div
                className="w-2.5 h-2.5 bg-white rounded-full"
                animate={{
                  scaleY: status === "talking" ? [1, 0.3, 1] : [1, 0.1, 1],
                }}
                transition={{
                  duration: status === "talking" ? 0.4 : 3,
                  repeat: Infinity,
                  repeatDelay: status === "talking" ? 0.2 : 2,
                }}
              />
            </div>

            {/* Mouth */}
            <motion.div
              className="bg-white/90 rounded-full"
              animate={{
                width: status === "talking" ? ["12px", "16px", "8px", "14px", "12px"] : "12px",
                height: status === "talking" ? ["4px", "8px", "3px", "7px", "4px"] : status === "thinking" ? "2px" : "4px",
              }}
              transition={{
                duration: status === "talking" ? 0.6 : 0.3,
                repeat: status === "talking" ? Infinity : 0,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* Thinking dots orbiting */}
          {status === "thinking" && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white/70 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 0.5,
                  }}
                  style={{
                    top: "50%",
                    left: "50%",
                    marginTop: -4,
                    marginLeft: -4,
                    transformOrigin: `4px ${-20 + i * -8}px`,
                  }}
                />
              ))}
            </>
          )}
        </motion.div>

        {/* Online indicator */}
        <motion.div
          className="absolute bottom-1 right-1 w-4 h-4 bg-orange-400 rounded-full border-2 border-gray-950"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>

      {/* Name & Status */}
      <div className="text-center">
        <h2
          className="font-bold text-lg tracking-widest uppercase animate-glitch"
          data-text="LAILA"
          style={{ color: "#ff8c00", textShadow: "0 0 10px rgba(255,140,0,0.5)" }}
        >LAILA</h2>
        <motion.p
          className="text-xs font-mono tracking-wider uppercase"
          style={{ color: status === "talking" ? "#ff8c00" : status === "thinking" ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.45)" }}
          key={status}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {status === "idle" && "> READY_"}
          {status === "thinking" && "> PROCESSING..."}
          {status === "talking" && "> SPEAKING..."}
        </motion.p>
      </div>
    </div>
  );
}
