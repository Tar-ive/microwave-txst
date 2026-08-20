import "./globals.css";

export const metadata = {
  title: "Microwave @ TXST",
  description:
    "Find every microwave on the Texas State campus and check if it's clean — powered by student reports.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#501214",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
