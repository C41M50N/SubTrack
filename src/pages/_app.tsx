import { Analytics } from '@vercel/analytics/react';
import type { AppType } from 'next/app';
import { Geist, Geist_Mono } from 'next/font/google';
import { useEffect } from 'react';

import { api } from '@/utils/api';

import '@/styles/globals.css';
import Head from 'next/head';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const fontVariableClassNames = [geistSans.variable, geistMono.variable];

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? '';
const ogImage = `${baseUrl}/dashboard.png`;

const MyApp: AppType = ({ Component, pageProps: { ...pageProps } }) => {
  // Radix portals mount under body, so expose the Next font variables there too.
  useEffect(() => {
    document.body.classList.add(...fontVariableClassNames);

    return () => {
      document.body.classList.remove(...fontVariableClassNames);
    };
  }, []);

  const keywords = [
    'manage subscriptions',
    'subscription manager',
    'track digital subscriptions',
    'subscription management software',
    'subscription budgeting app',
    'subscription expense tracker',
    'subscription reminder app',
    'subscription billing tracker',
    'music streaming subscription manager',
    'entertainment subscription tracking',
    'software subscription management',
  ];

  return (
    <>
      <Head>
        <title>SubTrack | A Subscriptions Tracking Dashboard</title>
        <meta
          content="Track recurring costs, renewal dates, and total subscription spend in one clean dashboard — no bank linking required."
          name="description"
        />
        <meta content={keywords.join(', ')} key="keywords" name="keywords" />
        <meta content="#ffffff" name="theme-color" />
        <meta content="light" name="color-scheme" />

        {/* Open Graph */}
        <meta content="website" property="og:type" />
        <meta content="SubTrack" property="og:site_name" />
        <meta
          content="SubTrack — subscription tracking, without bank linking"
          property="og:title"
        />
        <meta
          content="A clean dashboard for recurring costs, renewal dates, categories, and exports. Open source and manually controlled."
          property="og:description"
        />
        <meta content={ogImage} property="og:image" />
        <meta
          content="SubTrack dashboard showing a subscription table and spending insights"
          property="og:image:alt"
        />

        {/* Twitter */}
        <meta content="summary_large_image" name="twitter:card" />
        <meta
          content="SubTrack — subscription tracking, without bank linking"
          name="twitter:title"
        />
        <meta
          content="A clean dashboard for recurring costs, renewal dates, categories, and exports. Open source and manually controlled."
          name="twitter:description"
        />
        <meta content={ogImage} name="twitter:image" />

        <link
          href="/apple-touch-icon.png"
          rel="apple-touch-icon"
          sizes="180x180"
        />
        <link
          href="/favicon-32x32.png"
          rel="icon"
          sizes="32x32"
          type="image/png"
        />
        <link
          href="/favicon-16x16.png"
          rel="icon"
          sizes="16x16"
          type="image/png"
        />
        <link href="/site.webmanifest" rel="manifest" />
      </Head>
      <div className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <Component {...pageProps} />
      </div>
      <Analytics />
    </>
  );
};

export default api.withTRPC(MyApp);
