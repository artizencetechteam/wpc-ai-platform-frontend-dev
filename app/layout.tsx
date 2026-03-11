import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext"
import { PasswordResetProvider, VerificationProvider } from "@/context/VerificationContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400","600","700"],
});

export const metadata: Metadata = {
  title: "WPC AI Platform",
  description: "WPC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
       <AuthProvider>
         
         <VerificationProvider>
           {children}
         </VerificationProvider>
  
       </AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}