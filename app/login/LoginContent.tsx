"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { recordingsApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { auditLogger } from "@/services/auditService";
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
import { Loader, Eye, EyeOff } from "lucide-react";

export default function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loginResponse = await recordingsApi.loginWebUser(email, password);
      console.log("🔍 Login successful, token received");
      auditLogger.login(email, true, "Successful login from login page");
      await new Promise((resolve) => setTimeout(resolve, 200));
      console.log("🔍 About to refresh user data...");
      await refreshUser();
      console.log("🔍 User details refreshed");
      await new Promise((resolve) => setTimeout(resolve, 100));
      toast.success("Login successful", {
        description: "Redirecting to dashboard...",
      });
      setTimeout(() => {
        router.replace("/");
        router.refresh();
      }, 600);
    } catch (error) {
      console.error("Login error:", error);
      auditLogger.login(
        email,
        false,
        error instanceof Error ? error.message : "Invalid credentials"
      );
      toast.error("Login failed", {
        description:
          error instanceof Error ? error.message : "Invalid credentials",
      });
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
            <CardHeader className="space-y-4 pb-2">
              <div className="space-y-1 text-center">
                <CardTitle className="text-3xl font-light tracking-tight text-white drop-shadow-md">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-gray-300 font-light">
                  Sign in to access the Court Intelligence System
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
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-white font-medium ml-1">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-200 focus:bg-white/20 focus:border-white/40 focus:ring-white/20 transition-all duration-300 h-11 pr-10"
                      autoComplete="current-password"
                      data-lpignore="true"
                      data-1p-ignore
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white transition-colors focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
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
                      <span className="text-[#1B4D3E]/90">Authenticating...</span>
                    </>
                  ) : (
                    <span className="font-medium tracking-wide">Sign In</span>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-gray-300 font-light hover:text-white transition-colors duration-300"
                  onClick={() => router.push("/forgot-password")}
                  disabled={isLoading}>
                  Forgot your password?
                </Button>
              </CardFooter>
            </form>
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
