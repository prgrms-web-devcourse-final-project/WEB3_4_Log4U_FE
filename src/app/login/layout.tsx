'use client';

import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log('login layout');
  return (
    <html lang='en'>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className='bg-neutral h-screen text-text box-border'>{children}</div>
      </body>
    </html>
  );
}
