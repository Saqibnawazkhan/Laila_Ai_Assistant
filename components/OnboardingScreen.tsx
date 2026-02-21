"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, MessageSquare, Mic, Terminal, ListTodo } from "lucide-react";

interface OnboardingScreenProps {
  onComplete: () => void;
}

const features = [
  { icon: MessageSquare, title: "Smart Chat", desc: "Natural conversations powered by AI" },
  { icon: Mic, title: "Voice Control", desc: "Talk to Laila hands-free" },
  { icon: Terminal, title: "System Control", desc: "Control your Mac with words" },
  { icon: ListTodo, title: "Task Manager", desc: "Track tasks and reminders" },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[150px] animate-pulse" style={{ background: "rgba(139, 92, 246, 0.12)" }} />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full blur-[100px]" style={{ background: "rgba(139, 92, 246, 0.06)" }} />
        {/* Floating particles */}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: "var(--accent)",
              opacity: 0.3,
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div
        className="relative z-10 w-full max-w-lg mx-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {step === 0 && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Logo */}
            <motion.div
              className="mx-auto relative mb-8"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 w-24 h-24 mx-auto rounded-3xl blur-2xl opacity-40" style={{ background: "var(--accent)" }} />
              <div
                className="relative w-24 h-24 mx-auto rounded-3xl flex items-center justify-center"
                style={{ background: "var(--accent)", boxShadow: "var(--shadow-glow)" }}
              >
                <Sparkles size={36} style={{ color: "var(--logo-icon)" }} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Meet Laila</h1>
              <p className="text-lg mb-1" style={{ color: "var(--text-secondary)" }}>Your Personal AI Assistant</p>
              <p className="text-[13px] max-w-sm mx-auto mb-10" style={{ color: "var(--text-muted)" }}>
                Smart, friendly, and ready to help you with anything.
              </p>
            </motion.div>

            <motion.button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-8 py-3 text-white text-[14px] font-medium rounded-2xl transition-all hover:opacity-90 active:scale-[0.97]"
              style={{ background: "var(--accent)", boxShadow: "var(--shadow-glow)" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Get Started <ArrowRight size={16} />
            </motion.button>

            <div className="flex justify-center gap-2 mt-6">
              <div className="w-5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--surface-hover)" }} />
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-center mb-1" style={{ color: "var(--text-primary)" }}>What Laila Can Do</h2>
            <p className="text-[13px] text-center mb-8" style={{ color: "var(--text-muted)" }}>Your assistant is capable of all this</p>

            <div className="grid grid-cols-2 gap-2.5 mb-8">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    className="rounded-2xl p-4 transition-all hover:bg-[var(--surface-hover)]"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ background: "var(--accent-soft)" }}>
                      <Icon size={18} style={{ color: "var(--accent)" }} />
                    </div>
                    <h3 className="text-[13px] font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>{feature.title}</h3>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{feature.desc}</p>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="rounded-xl px-4 py-3 mb-6 text-center"
              style={{ background: "var(--accent-soft)", border: "1px solid rgba(139, 92, 246, 0.15)" }}
            >
              <p className="text-[11px]" style={{ color: "var(--accent)" }}>
                Say <strong>&quot;Laila&quot;</strong> anytime for voice, or press <strong>Ctrl+P</strong> for commands
              </p>
            </motion.div>

            <div className="flex justify-center">
              <motion.button
                onClick={() => {
                  localStorage.setItem("laila_onboarded", "true");
                  onComplete();
                }}
                className="inline-flex items-center gap-2 px-8 py-3 text-white text-[14px] font-medium rounded-2xl transition-all hover:opacity-90 active:scale-[0.97]"
                style={{ background: "var(--accent)", boxShadow: "var(--shadow-glow)" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Chatting <ArrowRight size={16} />
              </motion.button>
            </div>

            <div className="flex justify-center gap-2 mt-6">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--surface-hover)" }} />
              <div className="w-5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
