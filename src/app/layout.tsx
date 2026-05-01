import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const pretendard = localFont({
  src: '../../public/fonts/PretendardVariable.woff2',
  display: 'swap',
  variable: '--font-pretendard',
  weight: '45 920',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'PortLink — 컨테이너 운송 배차 플랫폼',
    template: '%s | PortLink',
  },
  description: '국내 컨테이너 트럭 디지털 배차 콜센터 플랫폼',
  applicationName: 'PortLink',
  authors: [{ name: 'PortLink' }],
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0A2540',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-white font-sans text-slate-900 antialiased">{children}</body>
    </html>
  );
}
