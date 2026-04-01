import "./globals.css";

export const metadata = {
  title: "BSCode",
  description: "Worst Code Editor Ever",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full select-none overflow-hidden antialiased">{children}</body>
    </html>
  );
}
