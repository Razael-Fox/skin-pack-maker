import type { Metadata } from "next"
import { Roboto, Geist_Mono, Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Minecraft Bedrock Skin Pack Maker",
  description:
    "Create, customize, and export custom skin packs for Minecraft Bedrock edition (.mcpack) client-side.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        roboto.variable,
        geistMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
