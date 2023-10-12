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
              <div className="flex flex-wrap gap-x-3 gap-y-2">
                {currentCategories.map((name) => (
                  <Badge key={name} variant={"secondary"} className="flex flex-row gap-1 text-lg">
                    {name}
                    <X className="hover:cursor-pointer" onClick={() => removeCategory(name)} />
                  </Badge>
                ))}
              </div>

              <Input type="text" onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = e.currentTarget.value.trim()
                  if (value !== "") {
                    addCategory(value)
                    e.currentTarget.value = ""
                  }
                }
              }} />

              <Button isLoading={isSetCategoriesLoading} onClick={() => setCategories(currentCategories)}>Save</Button>
            </div>
          )}
        </div>
      </SettingsLayout>
    </MainLayout>
  )
}