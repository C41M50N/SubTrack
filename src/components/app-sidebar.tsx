import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useRouteContext } from '@tanstack/react-router';
import {
  BellIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  SettingsIcon,
  WalletIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { CollectionSwitcher } from '@/components/collection-switcher';
import { MenuActionItem } from '@/components/menu-action-item';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { authClient } from '@/features/auth/client';
import { notificationDestinationsQueryOptions } from '@/features/notifications/queries';
import { subscriptionsQueryOptions } from '@/features/subscriptions/queries';

export function AppSidebar() {
  const { collectionId } = useParams({ from: '/_protected/c/$collectionId' });
  const { user } = useRouteContext({ from: '/_protected' });

  const { data: subscriptions } = useQuery(
    subscriptionsQueryOptions({ collectionId, status: 'active' }),
  );
  const subscriptionCount = subscriptions?.length ?? 0;
  const { data: destinations } = useQuery(
    notificationDestinationsQueryOptions(),
  );
  const needsAttention = (destinations ?? []).some(
    (destination) =>
      destination.health === 'needs_attention' ||
      destination.health === 'failing',
  );

  const userName = user.name;
  const userAvatarUrl =
    user.image ??
    `https://api.dicebear.com/10.x/initials/svg?seed=${encodeURIComponent(userName)}`;

  const handleSignOut = async () => {
    const { error } = await authClient.signOut();

    if (error) {
      toast.error('Couldn’t log out. Try again.');
      return;
    }

    window.location.assign('/');
  };

  return (
    <Sidebar
      side="left"
      variant="sidebar"
      collapsible="none"
      className="h-screen"
    >
      <SidebarHeader className="pt-3 pb-1 w-full bg-sidebar">
        <div className="flex w-full items-center justify-between pl-3 pr-1.5">
          <Link to="/c/$collectionId/dashboard" params={{ collectionId }}>
            <h1 className="text-lg font-bold">EverySub</h1>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Account"
              render={
                <Button
                  size="icon"
                  variant="ghost"
                  className="p-4 rounded-full"
                />
              }
            >
              <Avatar className="size-8">
                <AvatarImage src={userAvatarUrl} alt={`${userName} avatar`} />
                <AvatarFallback>--</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="truncate">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={handleSignOut}>
                  <MenuActionItem icon={LogOutIcon} label="Log out" />
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
                    <div className="rounded-full bg-muted mr-0.5 px-2 py-0.5 ring-1 ring-inset ring-border group-data-[collapsible=icon]:hidden">
                      <span
                        className="text-sm text-muted-foreground"
                        aria-label={`${subscriptionCount} active subscriptions`}
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
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link to="/settings/notifications">
              <SidebarMenuButton size="lg">
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BellIcon />
                    <span>Notifications</span>
                  </div>
                  {needsAttention ? (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-destructive">
                      Attention
                      <span className="sr-only"> needed</span>
                    </span>
                  ) : null}
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <ThemeSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
