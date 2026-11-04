import "./globals.css";
import { SiteProvider } from "../src/components/site-context";
import { Header } from "../src/components/header";
import { Footer } from "../src/components/footer";

export const metadata = {
  title: "Egyptian Discovery — Find your wild",
  description:
    "Find your next Egyptian adventure. Explore the desert, mountains, and coast with Egyptian Discovery.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" data-theme="light" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <SiteProvider>
          <Header />
          {children}
          <Footer />
        </SiteProvider>
      </body>
    </html>
  );
}
