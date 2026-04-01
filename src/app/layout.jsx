import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "BSCode",
  description: "Worst Code Editor Ever",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={cn("h-full", "font-sans", inter.variable)}>
      <body className="h-full">{children}</body>
    </html>
  );
}
