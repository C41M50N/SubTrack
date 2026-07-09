import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useRouteContext } from '@tanstack/react-router';
import {
  FileTextIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  WalletIcon,
} from 'lucide-react';

import { CollectionSwitcher } from '@/components/collection-switcher';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { subscriptionsQueryOptions } from '@/features/subscriptions/queries';

export function AppSidebar() {
  const { collectionId } = useParams({ from: '/_protected/c/$collectionId' });
  const { user } = useRouteContext({ from: '/_protected' });

  const { data: subscriptions } = useQuery(
    subscriptionsQueryOptions({ collectionId }),
  );
  const subscriptionCount = subscriptions?.length ?? 0;

  const userName = user.name;
  const userAvatarUrl =
    user.image ??
    `https://api.dicebear.com/10.x/initials/svg?seed=${encodeURIComponent(userName)}`;

  return (
    <Sidebar
      side="left"
      variant="sidebar"
      collapsible="none"
      className="h-screen"
    >
      <SidebarHeader className="pt-3 pb-1 w-full bg-gray-50">
        <div className="flex w-full items-center justify-between pl-3 pr-1.5">
          <Link to="/c/$collectionId/dashboard" params={{ collectionId }}>
            <h1 className="text-lg font-bold">SubTrack</h1>
          </Link>
          <Button size="icon" variant="ghost" className="p-4 rounded-full">
            <Avatar className="size-8">
              <AvatarImage src={userAvatarUrl} alt={`${userName} avatar`} />
              <AvatarFallback>--</AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </SidebarHeader>
      <SidebarHeader className="w-full mb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <CollectionSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2">
          <SidebarMenuItem>
            <Link to="/c/$collectionId/dashboard" params={{ collectionId }}>
              {({ isActive }) => (
                <SidebarMenuButton
                  size="lg"
                  isActive={isActive}
                  className="flex items-center gap-3"
                >
                  <LayoutDashboardIcon />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              )}
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link to="/c/$collectionId/subscriptions" params={{ collectionId }}>
              {({ isActive }) => (
                <SidebarMenuButton size="lg" isActive={isActive}>
                  <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <WalletIcon />
                      <span>Subscriptions</span>
                    </div>
                    <div className="rounded-full bg-muted mr-0.5 px-2 py-0.5 ring-1 ring-inset ring-neutral-200 group-data-[collapsible=icon]:hidden">
                      <span
                        className="text-sm text-muted-foreground"
                        aria-label={`${subscriptionCount} subscriptions`}
                      >
                        {subscriptionCount}
                      </span>
                    </div>
                  </div>
                </SidebarMenuButton>
              )}
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link to="/c/$collectionId/invoices" params={{ collectionId }}>
              {({ isActive }) => (
                <SidebarMenuButton
                  size="lg"
                  isActive={isActive}
                  className="flex items-center gap-3"
                >
                  <FileTextIcon />
                  <span>Invoices</span>
                </SidebarMenuButton>
              )}
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link to="/c/$collectionId/settings" params={{ collectionId }}>
              {({ isActive }) => (
                <SidebarMenuButton
                  size="lg"
                  isActive={isActive}
                  className="flex items-center gap-3"
                >
                  <SettingsIcon />
                  <span>Settings</span>
                </SidebarMenuButton>
              )}
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
