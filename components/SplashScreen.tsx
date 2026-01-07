"use client";

import { motion } from "framer-motion";

export default function SplashScreen() {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
            <div className="relative w-full max-w-2xl h-64 flex items-center justify-center">
                {/* Connecting Sound Wave */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 0.5 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-12 flex items-center justify-center gap-1 overflow-hidden"
                >
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="w-1 bg-green-600 rounded-full"
                            initial={{ height: 2 }}
                            animate={{
                                height: [4, 24, 8, 32, 4],
                                backgroundColor: ["#1B4D3E", "#2A735D", "#1B4D3E"]
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 0.1, // Stagger effect for wave motion
                                repeatType: "mirror"
                            }}
                        />
                    ))}
                </motion.div>

                {/* JSC Logo (Left) */}
                <motion.div
                    layoutId="jsc-logo"
                    initial={{ opacity: 0, x: 0, scale: 0.5 }}
                    animate={{ opacity: 1, x: -140, scale: 1 }}
                    transition={{ duration: 0.8, delay: 1.5, ease: "easeOut" }}
                    className="absolute z-10"
                >
                    <img
                        src="/logo.png"
                        alt="JSC Logo"
                        className="w-36 h-36 object-contain drop-shadow-lg"
                    />
                </motion.div>

                {/* Testimony Logo (Right) */}
                <motion.div
                    layoutId="testimony-logo"
                    initial={{ opacity: 1, scale: 1, rotate: 0 }}
                    animate={{ x: 140 }}
                    transition={{ duration: 0.8, delay: 1.5, ease: "easeInOut" }}
                    className="absolute z-10 flex items-center justify-center"
                >
                    {/* Initial Ring Animation (fades out or moves with it) - Fixed to be circular */}
                    <motion.div
                        animate={{
                            rotate: 360,
                            opacity: [0.5, 0.5, 0] // Fade out at the end
                        }}
                        transition={{
                            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                            opacity: { duration: 0.5, delay: 3, times: [0, 0.8, 1] } // Wait for connection (1.5s delay + ~1s wave) then fade
                        }}
                        className="absolute w-48 h-48 border-t-2 border-r-2 border-green-600 rounded-full opacity-50"
                    />
                    <img
                        src="/testimony.png"
                        alt="Testimony Logo"
                        className="relative w-40 h-auto object-contain drop-shadow-xl z-10"
                    />
                </motion.div>
            </div>
        </div>
    );
}
