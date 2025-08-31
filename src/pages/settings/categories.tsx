import { CircleXIcon } from 'lucide-react';
import React from 'react';

import { LoadingSpinner } from '@/components/common/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import MainLayout from '@/layouts/main';
import SettingsLayout from '@/layouts/settings';
import { useCategories, useSetCategories } from '@/lib/hooks';

export default function CategoriesSettingsPage() {
  const { categories, isCategoriesLoading } = useCategories();
  const [currentCategories, setCurrentCategories] = React.useState<string[]>(
    categories || []
  );

  const { setCategories, isSetCategoriesLoading } = useSetCategories();

  function addCategory(category: string) {
    if (!currentCategories.includes(category)) {
      setCurrentCategories([...currentCategories, category]);
    }
  }

  function removeCategory(category: string) {
    setCurrentCategories(currentCategories.filter((cat) => cat !== category));
  }

  function onSubmit() {
    setCategories(currentCategories);
  }

  React.useEffect(() => {
    if (categories) {
      setCurrentCategories(categories);
    }
  }, [categories]);

  return (
    <MainLayout title="Category Settings | SubTrack">
      <SettingsLayout>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-lg">Configure Categories</h3>
            <p className="text-muted-foreground text-sm">
              Configure the categories used to organize your subscriptions.
            </p>
          </div>
          <Separator />

          {isCategoriesLoading && <LoadingSpinner />}

          {categories && !isCategoriesLoading && (
            <div className="space-y-3">
              <Label className="text-base">Current Catgeories</Label>
              <div className="flex flex-wrap gap-x-3 gap-y-2">
                {currentCategories.map((name) => (
                  <Badge
                    className="flex flex-row gap-1 font-medium text-lg"
                    key={name}
                    variant={'secondary'}
                  >
                    {name}
                    <CircleXIcon
                      className="ml-1 size-5 hover:cursor-pointer"
                      onClick={() => removeCategory(name)}
                      strokeWidth={2.5}
                    />
                  </Badge>
                ))}
              </div>

              <div className="py-1" />

              <div className="space-y-1">
                <Label className="text-base">Add Catgeory</Label>
                <Input
                  className="max-w-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const value = e.currentTarget.value.trim();
                      if (value !== '') {
                        addCategory(value);
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                  type="text"
                />
                <Label className="text-gray-500 text-xs">
                  Press [ENTER] to add
                </Label>
              </div>

              <Button isLoading={isSetCategoriesLoading} onClick={onSubmit}>
                Save
              </Button>
            </div>
          )}
        </div>
      </SettingsLayout>
    </MainLayout>
  );
}
