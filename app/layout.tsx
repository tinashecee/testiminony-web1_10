import "./globals.css"
import { Inter } from "next/font/google"
import type React from "react" // Import React
import { cn } from "@/lib/utils"
import { Toaster } from "sonner"
import { AuthProvider } from "@/contexts/AuthContext"
import ConsoleSilencer from "@/components/ConsoleSilencer"
import SplashLayout from "@/components/SplashLayout"
import GlobalLayoutWrapper from "@/components/GlobalLayoutWrapper"
import { QueryProvider } from "@/components/providers/QueryProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Court Recording Management System",
  description: "Secure platform for managing and accessing court recordings",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn(
        inter.className,
        "min-h-screen bg-background text-foreground antialiased"
      )}>
        <ConsoleSilencer />
        <SplashLayout>
          <AuthProvider>
            <QueryProvider>
              <GlobalLayoutWrapper>
                {children}
              </GlobalLayoutWrapper>
            </QueryProvider>
          </AuthProvider>
        </SplashLayout>
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  )
}

