"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, MessageSquare, Mic, Terminal, ListTodo } from "lucide-react";

interface OnboardingScreenProps {
  onComplete: () => void;
}

const features = [
  { icon: MessageSquare, title: "Smart Chat", desc: "Have natural conversations with your AI assistant" },
  { icon: Mic, title: "Voice Control", desc: "Talk to Laila and hear her respond" },
  { icon: Terminal, title: "System Commands", desc: "Control your laptop with natural language" },
  { icon: ListTodo, title: "Task Manager", desc: "Manage your tasks and reminders" },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex items-center justify-center overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[100px]" />
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
            {/* Avatar */}
            <motion.div
              className="mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-purple-500/30 mb-8"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex flex-col items-center">
                <div className="flex gap-4 mb-2">
                  <div className="w-3 h-3 bg-white rounded-full" />
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>
                <div className="w-4 h-2 bg-white/90 rounded-full" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="text-purple-400" size={20} />
                <h1 className="text-3xl font-bold text-white">Meet Laila</h1>
              </div>
              <p className="text-gray-400 text-lg mb-2">Your Personal AI Assistant</p>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mb-10">
                Smart, friendly, and ready to help you with anything — from managing tasks to controlling your laptop.
              </p>
            </motion.div>

            <motion.button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-2xl transition-colors shadow-lg shadow-purple-500/25"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Get Started <ArrowRight size={18} />
            </motion.button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-white text-center mb-2">What Laila Can Do</h2>
            <p className="text-gray-500 text-sm text-center mb-8">Here&apos;s what your assistant is capable of</p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Icon className="text-purple-400 mb-2" size={24} />
                    <h3 className="text-white font-medium text-sm mb-1">{feature.title}</h3>
                    <p className="text-gray-500 text-xs">{feature.desc}</p>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex justify-center">
              <motion.button
                onClick={() => {
                  localStorage.setItem("laila_onboarded", "true");
                  onComplete();
                }}
                className="inline-flex items-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-2xl transition-colors shadow-lg shadow-purple-500/25"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Chatting <ArrowRight size={18} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
