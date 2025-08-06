import { Nunito } from 'next/font/google';
import "../styles/globals.css";

const nunito = Nunito({ subsets: ['latin'], weight: ['400', '700'] });

export const metadata = {
  title: 'Captioni – Create unique captions',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={nunito.className}>{children}</body>
    </html>
  );
}
