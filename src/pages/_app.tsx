import { Analytics } from '@vercel/analytics/react';
import type { AppType } from 'next/app';

import { api } from '@/utils/api';

import '@/styles/globals.css';
import Head from 'next/head';

const MyApp: AppType = ({ Component, pageProps: { ...pageProps } }) => {
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
        <meta content="A Subscriptions Tracking Dashboard" name="description" />
        <meta content={keywords.join(', ')} key="keywords" name="keywords" />
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
      <Component {...pageProps} />
      <Analytics />
    </>
  );
};

export default api.withTRPC(MyApp);
