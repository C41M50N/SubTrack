import { IconDashboard, IconExternalLink } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FeatureCard from '@/components/common/feature-card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSession } from '@/features/auth/auth-client';

export default function LandingPage() {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <>
      {/* Subtle Grid Backdrop */}
      <div className="-z-10 absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] bg-white" />

      <div className="flex min-h-screen flex-col justify-between">
        <header className="mx-auto flex h-24 w-full max-w-[1440px] flex-row items-center gap-2 px-8 pt-1 2xl:px-0">
          <Link className="cursor-pointer" href={'/'}>
            <Image
              alt="SubTrack"
              height={30}
              src={'/subtrack_full.jpg'}
              width={265}
            />
          </Link>

          <div className="flex-1" />

          <div className="hidden flex-row gap-0.5 md:flex">
            <Link href="https://github.com/C41M50N/SubTrack">
              <Button
                className="flex flex-row gap-1"
                size="lg"
                variant="ghost_link"
              >
                <span className="text-xl">GitHub</span>
                <IconExternalLink className="size-5" />
              </Button>
            </Link>
          </div>

          <div className="ml-1" />

          <Separator
            className="hidden h-2/5 bg-gray-400 md:block"
            orientation="vertical"
          />

          <div className="ml-0" />

          {!session && (
            <div className="flex flex-row gap-2">
              <Link href="/auth/login">
                <Button size="lg" variant="ghost">
                  <span className="font-semibold text-lg">Login</span>
                </Button>
              </Link>

              <Link href="/auth/signup">
                <Button size="lg" variant="default">
                  <span className="font-semibold text-lg">Get Started</span>
                </Button>
              </Link>
            </div>
          )}

          {session && (
            <Button
              onClick={() => router.push('/dashboard')}
              size="lg"
              variant="default"
            >
              <IconDashboard className="mr-2" size={20} />
              <span className="font-semibold text-lg">Dashboard</span>
            </Button>
          )}
        </header>

        <section className="mx-auto flex max-w-[720px] flex-col items-center justify-center gap-9 pt-14 md:pt-24">
          <h1 className="text-center font-bold text-4xl md:text-7xl">
            Organize Your Digital Subscriptions
          </h1>
          <h2 className="text-center text-black/50 text-lg md:text-2xl">
            SubTrack is the simplest way to track how much your digital
            subscriptions are costing you.
          </h2>
        </section>

        <section className="mx-auto mb-auto max-w-[1200px] px-8 pt-12 pb-14 md:pt-24 2xl:px-0">
          <div className="rounded-xl border-[5px] border-black/70 px-[1px] pb-1">
            <Image
              alt={'Dashboard Image'}
              className="mt-1"
              height={2000}
              priority
              quality={100}
              src={'/dashboard.png'}
              width={3000}
            />
          </div>
        </section>

        <section className="mx-auto mb-auto max-w-[1200px] px-8 pt-12 pb-12 md:pt-24 md:pb-24 2xl:px-0">
          <div className="flex flex-col items-center">
            <h3 className="font-bold text-3xl md:text-4xl">Features</h3>

            <div className="mt-10 grid gap-x-14 gap-y-14 md:mt-14 md:gap-y-20 lg:w-full lg:grid-cols-2 lg:px-2 xl:w-[1150px] 2xl:w-[1350px]">
              <FeatureCard
                image={
                  <Image
                    alt=""
                    className="rounded-lg"
                    height={350}
                    priority
                    quality={100}
                    src="/assets/table.png"
                    width={500}
                  />
                }
                subtitle="Manage subscriptions via feature-rich dashboard table"
                title="Manage Subscriptions"
              />

              <FeatureCard
                image={
                  <Image
                    alt=""
                    className="rounded-lg"
                    height={200}
                    priority
                    quality={100}
                    src="/assets/metrics.png"
                    width={350}
                  />
                }
                subtitle="Gain insights on your subscriptions via cost metrics"
                title="Gain Insights"
              />

              <FeatureCard
                image={
                  <Image
                    alt=""
                    className="rounded-lg"
                    height={380}
                    priority
                    quality={100}
                    src="/assets/categories.png"
                    width={460}
                  />
                }
                subtitle="Organize subscriptions using custom categories"
                title="Categorize"
              />

              <FeatureCard
                image={
                  <Image
                    alt=""
                    className="rounded-lg"
                    height={200}
                    priority
                    quality={100}
                    src="/assets/collections.png"
                    width={380}
                  />
                }
                subtitle="Separate subscriptions into various collections"
                title="Stay Organized"
              />

              <FeatureCard
                image={
                  <Image
                    alt=""
                    className="rounded-lg"
                    height={200}
                    priority
                    quality={100}
                    src="/assets/export.png"
                    width={380}
                  />
                }
                subtitle="Export your subscriptions to a CSV file"
                title="Export Your Data"
              />

              <FeatureCard
                image={
                  <Image
                    alt=""
                    className="rounded-lg"
                    height={200}
                    priority
                    quality={100}
                    src="/assets/email.png"
                    width={380}
                  />
                }
                subtitle="Stay informed about your subscriptions with a monthly summary email"
                title="Stay Informed"
              />
            </div>
          </div>
        </section>

        <section className="pb-8 md:pb-24" />

        <footer className="flex h-16 bg-gray-50">
          <div className="mx-auto my-auto">
            <span className="font-medium text-xs">
              Made by{' '}
              <Link
                className="font-bold"
                href="https://www.linkedin.com/in/charles-buffington/"
              >
                Charles Buffington
              </Link>
              . All rights reserved.
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}
