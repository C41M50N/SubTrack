import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/utils';

type NavItem = {
  title: string;
  href: string;
};

const SettingsNavItems: Array<NavItem> = [
  {
    title: 'Account',
    href: '/settings/account',
  },
  {
    title: 'Categories',
    href: '/settings/categories',
  },
  {
    title: 'Todoist Integration',
    href: '/settings/todoist',
  },
  {
    title: 'Own Your Data',
    href: '/settings/data',
  },
  // {
  //   title: "Todoist Debug",
  //   href: "/settings/debug/todoist"
  // },
  // {
  //   title: "Toast Debug",
  //   href: "/settings/debug/toast"
  // },
  // {
  //   title: "UI Debug",
  //   href: "/settings/debug/ui"
  // }
  // {
  //   title: "Notifications",
  //   href: "/settings/notifications"
  // }
];

type SettingsLayoutProps = {
  children: React.ReactNode;
};

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  return (
    <div>
      <h1 className="pt-4 pb-1 text-2xl">Settings</h1>
      <p className="text-muted-foreground">
        Manage your account settings and set notification preferences.
      </p>
      <Separator className="mt-4 mb-6" />
      <div className="flex flex-row space-x-12 space-y-2">
        <aside className="w-1/5">
          <nav className="flex flex-col space-y-1">
            {SettingsNavItems.map((item) => (
              <Link
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  pathname === item.href
                    ? 'bg-muted hover:bg-muted'
                    : 'hover:bg-transparent hover:underline',
                  'justify-start rounded-sm border border-gray-500 border-opacity-30 text-md'
                )}
                href={item.href}
                key={item.href}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
