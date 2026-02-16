"use client";

import { motion } from "framer-motion";

interface AvatarProps {
  status: "idle" | "thinking" | "talking";
}

export default function Avatar({ status }: AvatarProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Glow effect behind avatar */}
      <div className="relative">
        <motion.div
          className="absolute inset-0 rounded-full bg-purple-500/30 blur-2xl"
          animate={{
            scale: status === "talking" ? [1, 1.3, 1] : status === "thinking" ? [1, 1.15, 1] : [1, 1.05, 1],
            opacity: status === "talking" ? [0.4, 0.7, 0.4] : status === "thinking" ? [0.3, 0.5, 0.3] : [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: status === "talking" ? 0.8 : 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Main avatar circle */}
        <motion.div
          className="relative w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/25"
          animate={{
            y: status === "idle" ? [0, -6, 0] : 0,
            scale: status === "talking" ? [1, 1.05, 1] : 1,
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
                borderRadius: status === "idle" ? "9999px" : "9999px",
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
                  animate={{
                    rotate: 360,
                  }}
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
        <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-950" />
      </div>

      {/* Name & Status */}
      <div className="text-center">
        <h2 className="text-white font-semibold text-lg">Laila</h2>
        <motion.p
          className="text-xs text-gray-400"
          key={status}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {status === "idle" && "Ready to help"}
          {status === "thinking" && "Thinking..."}
          {status === "talking" && "Speaking..."}
        </motion.p>
      </div>
    </div>
  );
}
