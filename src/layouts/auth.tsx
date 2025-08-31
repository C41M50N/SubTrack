import Head from 'next/head';
import { Toaster } from '@/components/ui/toaster';

type AuthLayoutProps = {
  children: React.ReactNode;
  title?: string;
};

export default function AuthLayout({ children, title }: AuthLayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
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
      <div className="sm:-mt-10 flex h-screen items-center justify-center">
        {children}
        <Toaster />
      </div>
    </>
  );
}
