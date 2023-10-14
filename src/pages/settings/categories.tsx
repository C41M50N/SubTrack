import React from "react";
import { Loader2, X } from "lucide-react";
import {
  useCategories, 
  useSetCategories
} from "@/lib/hooks";
import MainLayout from "@/layouts/main";
import SettingsLayout from "@/layouts/settings";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CategoriesSettingsPage() {

  const { categories, isCategoriesLoading } = useCategories()
  const [currentCategories, setCurrentCategories] = React.useState<string[]>(categories || [])

  const { setCategories, isSetCategoriesLoading } = useSetCategories()

  function addCategory(category: string) {
    if (!currentCategories.includes(category)) {
      setCurrentCategories([...currentCategories, category])
    }
  }

  function removeCategory(category: string) {
    setCurrentCategories(currentCategories.filter((cat) => cat !== category))
  }

  return (
    <MainLayout>
      <SettingsLayout>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Configure Categories</h3>
            <p className="text-sm text-muted-foreground">
              Configure the categories used to organize your subscriptions.
            </p>
          </div>
          <Separator />
          
          {isCategoriesLoading && (
            <div className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            </div>
          )}

          {!isCategoriesLoading && (
            <div className="space-y-4">
              <Label className="text-xl">Current Catgeories</Label>
              <div className="flex flex-wrap gap-x-3 gap-y-2">
                {currentCategories.map((name) => (
                  <Badge key={name} variant={"secondary"} className="flex flex-row gap-1 text-lg font-normal">
                    {name}
                    <X className="hover:cursor-pointer" onClick={() => removeCategory(name)} />
                  </Badge>
                ))}
              </div>

              <div className="py-1" />

              <div className="space-y-1">
                <Label className="text-base">Add Catgeory</Label>
                <Input type="text" onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = e.currentTarget.value.trim()
                    if (value !== "") {
                      addCategory(value)
                      e.currentTarget.value = ""
                    }
                  }
                }} />
                <Label className="text-gray-500 text-xs">Press [ENTER] to add</Label>
              </div>

              <Button isLoading={isSetCategoriesLoading} onClick={() => setCategories(currentCategories)}>Save</Button>
            </div>
          )}
        </div>
      </SettingsLayout>
    </MainLayout>
  )
}