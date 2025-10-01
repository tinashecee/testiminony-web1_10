"use client";
import dynamic from "next/dynamic";

const LoginContent = dynamic(() => import("./LoginContent"), {
  ssr: false,
  loading: () => <div className="min-h-screen" />,
});

export default function LoginPage() {
  return <LoginContent />;
}