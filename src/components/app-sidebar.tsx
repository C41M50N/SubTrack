import { Link } from '@tanstack/react-router';
import {
  FileTextIcon,
  LayoutDashboardIcon,
  PanelLeftCloseIcon,
  SettingsIcon,
  WalletIcon,
} from 'lucide-react';

import { CollectionSwitcher } from '@/components/collection-switcher';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const collectionId = 'default';
  return (
    <Sidebar
      side="left"
      variant="sidebar"
      collapsible="none"
      className="h-screen"
    >
      <SidebarHeader className="pt-3 pb-1 w-full bg-gray-50">
        <div className="flex w-full items-center justify-between pl-3 pr-1">
          <Link to="/dashboard">
            <h1 className="text-lg font-bold">SubTrack</h1>
          </Link>
          <Button size="icon" variant="ghost" aria-label="Close sidebar">
            <PanelLeftCloseIcon className="size-4" />
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
            <Link
              to="/c/$collectionId/dashboard"
              params={{ collectionId: collectionId }}
            >
              <SidebarMenuButton size="lg">
                <div className="flex items-center gap-3">
                  <LayoutDashboardIcon />
                  <span>Dashboard</span>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link
              to="/c/$collectionId/subscriptions"
              params={{ collectionId: collectionId }}
            >
              <SidebarMenuButton size="lg">
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <WalletIcon />
                    <span>Subscriptions</span>
                  </div>
                  <div className="rounded-full bg-muted mr-0.5 px-2 py-0.5 ring-1 ring-inset ring-neutral-200 group-data-[collapsible=icon]:hidden">
                    <span
                      className="text-sm text-muted-foreground"
                      aria-label="23 subscriptions"
                    >
                      23
                    </span>
                  </div>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link
              to="/c/$collectionId/invoices"
              params={{ collectionId: collectionId }}
            >
              <SidebarMenuButton size="lg">
                <div className="flex items-center gap-3">
                  <FileTextIcon />
                  <span>Invoices</span>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link
              to="/c/$collectionId/settings"
              params={{ collectionId: collectionId }}
            >
              <SidebarMenuButton size="lg">
                <div className="flex items-center gap-3">
                  <SettingsIcon />
                  <span>Settings</span>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
