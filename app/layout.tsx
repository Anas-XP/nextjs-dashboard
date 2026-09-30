import "@/app/ui/global.css";

import { inter, lusitana } from "./ui/fonts";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${lusitana.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
