import { IconDashboard, IconSettings } from '@tabler/icons-react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type React from 'react';
import NewSubscriptionModal from '@/components/subscriptions/new-subscription-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/toaster';
import { signOut, useSession } from '@/features/auth/auth-client';
import { useCategories, useCollections } from '@/lib/hooks';

type MainLayoutProps = {
  children: React.ReactNode;
  title?: string;
};

export default function MainLayout({ children, title }: MainLayoutProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const { categories } = useCategories();
  const { collections } = useCollections();

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div className="border-b">
        <section className="mr-auto ml-auto max-w-[1400px]">
          <div className="flex h-16 items-center px-4">
            <Link className="cursor-pointer" href={'/'}>
              <Image
                alt="SubTrack"
                height={30}
                src={'/subtrack_full.jpg'}
                width={200}
              />
            </Link>
            <nav className="mx-6 flex items-center space-x-4 pl-4 lg:space-x-6">
              <Link
                className="flex flex-row gap-1 rounded-md p-2 px-2 font-medium text-md text-muted-foreground transition-colors hover:text-primary"
                href={'/dashboard'}
              >
                <IconDashboard />
                Dashboard
              </Link>
              <Link
                className="flex flex-row gap-1 rounded-md p-2 px-2 font-medium text-md text-muted-foreground transition-colors hover:text-primary"
                href={'/settings/categories'}
              >
                <IconSettings />
                Settings
              </Link>
            </nav>

            <div className="ml-auto" />

            {session && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="relative h-8 w-8 rounded-full"
                    variant="ghost"
                  >
                    <Avatar>
                      <AvatarImage
                        alt={session.user.name}
                        src={
                          session.user.image ||
                          'https://img.icons8.com/cotton/64/gender-neutral-user--v1.png'
                        }
                      />
                      <AvatarFallback>||</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56"
                  forceMount
                  sideOffset={10}
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="font-medium text-sm leading-none">
                        {session.user.name}
                      </p>
                      <p className="text-muted-foreground text-xs leading-none">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href={'/settings/account'}>
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-700"
                    onClick={async () => {
                      await signOut({
                        fetchOptions: {
                          onSuccess: () => {
                            router.push('/');
                          },
                        },
                      });
                    }}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </section>
      </div>
      <main className="mr-auto ml-auto max-w-[1400px] px-6 pb-8">
        {children}
        <Toaster />
        <NewSubscriptionModal
          categories={categories || []}
          collections={collections || []}
        />
      </main>
    </>
  );
}
