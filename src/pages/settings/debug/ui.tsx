'use client';
import { Button } from '@/components/ui/button';
import MainLayout from '@/layouts/main';
import SettingsLayout from '@/layouts/settings';

export default function UIDebugPage() {
  return (
    <MainLayout>
      <SettingsLayout>
        <div className="space-y-2">
          <div className="flex flex-row space-x-2">
            <Button className="w-[130px]" variant="default">
              Primary
            </Button>
            <Button className="w-[130px]" variant="secondary">
              Secondary
            </Button>
            <Button className="w-[130px]" variant="outline">
              Outline
            </Button>
          </div>
          <div className="flex flex-row space-x-2">
            <Button className="w-[130px]" variant="primary-2">
              Primary 2
            </Button>
            <Button className="w-[130px]" variant="secondary-2">
              Secondary 2
            </Button>
            <Button className="w-[130px]" variant="outline-2">
              Outline 2
            </Button>
          </div>
        </div>
      </SettingsLayout>
    </MainLayout>
  );
}
