import type { Metadata } from "next"
import { SessionProvider } from "@/components/providers/session-provider"
import { TRPCProvider } from "@/lib/trpc/react"
import { Toaster } from "sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "StudyHub - Connect with Expert Freelancers",
  description: "The modern platform connecting students with expert freelancers for assignment help and academic success",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <SessionProvider>
          <TRPCProvider>
            {children}
            <Toaster 
              position="top-right" 
              toastOptions={{
                style: {
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                },
              }}
            />
          </TRPCProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
