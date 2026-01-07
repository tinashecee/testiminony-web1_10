"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Call API to send reset link. 
      // Ensure the backend sends a link pointing to https://testimony.co.zw/reset-password/...
      console.log("Sending reset link to:", email);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Show success state
      setIsSuccess(true);

      toast.success("Reset link sent successfully");

    } catch (error) {
      toast.error("Failed to send reset instructions");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-[#1B4D3E] to-[#2A735D]">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 -left-1/4 w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 -right-1/4 w-full h-full bg-gradient-to-tl from-white/10 to-transparent rounded-full blur-3xl opacity-30" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay" />
      </div>

      {/* Header / Navigation */}
      <header className="relative z-20 w-full px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-between bg-white/5 backdrop-blur-md border-b border-white/10 animate-[fadeInDown_0.6s_ease-out]">
        <div className="flex items-center space-x-3">
          <motion.div
            layoutId="jsc-logo"
            className="bg-white rounded-full shadow-lg flex items-center justify-center p-1 w-10 h-10 sm:w-12 sm:h-12"
          >
            <Image
              src="/logo.png"
              alt="JSC Logo"
              width={48}
              height={48}
              className="w-full h-full object-contain"
              unoptimized
            />
          </motion.div>
        </div>
        <div>
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white transition-colors duration-200 text-sm"
            onClick={() => window.open('mailto:support@soxfort.com')}
          >
            Contact Support
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10 py-8 sm:py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center animate-[fadeInDown_0.8s_ease-out]">
            <motion.div layoutId="testimony-logo">
              <Image
                src="/testimony.png"
                alt="Testimony Logo"
                width={200}
                height={80}
                className="mb-4 drop-shadow-2xl transition-transform duration-500 hover:scale-105"
                unoptimized
              />
            </motion.div>
          </div>

          <Card className="border border-white/10 shadow-2xl bg-white/10 backdrop-blur-md animate-[fadeInUp_0.8s_ease-out] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500">
            {isSuccess ? (
              <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-[scaleIn_0.5s_ease-out]">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-light text-white">Email Sent Successfully</h3>
                  <p className="text-gray-300 font-light">
                    We've sent a password reset link to <strong>{email}</strong>.
                    <br />
                    Please check your inbox and follow the instructions.
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full bg-white text-[#1B4D3E] hover:bg-gray-100 border-none h-11 shadow-lg transition-all duration-300 font-semibold mt-4"
                >
                  Return to Login
                </Button>
              </div>
            ) : (
              <>
                <CardHeader className="space-y-4 pb-2">
                  <div className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-light tracking-tight text-white drop-shadow-md">
                      Reset Password
                    </CardTitle>
                    <CardDescription className="text-gray-300 font-light">
                      Enter your email address and we'll send you instructions to reset your password.
                    </CardDescription>
                  </div>
                </CardHeader>
                <form onSubmit={handleSubmit} autoComplete="off">
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-white font-medium ml-1">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        inputMode="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-200 focus:bg-white/20 focus:border-white/40 focus:ring-white/20 transition-all duration-300 h-11"
                        autoComplete="username"
                        data-lpignore="true"
                        data-1p-ignore
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-5 pt-2">
                    <Button
                      type="submit"
                      className="w-full bg-white text-[#1B4D3E] hover:bg-gray-100 border-none h-11 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group font-semibold"
                      disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin text-[#1B4D3E]/80" />
                          <span className="text-[#1B4D3E]/90">Sending...</span>
                        </>
                      ) : (
                        <span className="font-medium tracking-wide">Send Reset Instructions</span>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm text-gray-300 font-light hover:text-white transition-colors duration-300"
                      onClick={() => router.push("/login")}
                      disabled={isLoading}>
                      Back to Login
                    </Button>
                  </CardFooter>
                </form>
              </>
            )}
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full py-6 bg-white/5 backdrop-blur-md border-t border-white/10 text-center animate-[fadeInUp_1s_ease-out]">
        <p className="text-sm text-gray-300 font-light">
          Testimony Court Intelligence | Powered by <span className="text-white font-normal hover:underline cursor-pointer">Soxfort Solutions</span>
        </p>
        <p className="text-xs text-gray-400 mt-2 tracking-wider">
          INTUITIVE INNOVATION {currentYear || new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}