import MainLayout from "@/layouts/main";
import SettingsLayout from "@/layouts/settings";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChangeEvent } from "react";
import type { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { createCaller } from "@/server/api/root";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/server/db";
import dayjs from "dayjs";
import { downloadFile } from "@/utils";
import { api } from "@/utils/api";
import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast";

export default function DataSettingsPage({
  exportJSON
}: InferGetServerSidePropsType<typeof getServerSideProps>) {

  const [overwrite, setOverwrite] = React.useState<boolean>(false);
  const [file, setFile] = React.useState<File | null>(null);

  const { mutateAsync: importData, isLoading: isImportDataLoading } = api.main.importData.useMutation({
    onSuccess: () => {
      toast({
        variant: 'success',
        title: 'Successfully imported data'
      })
    },
    onError: () => {
      toast({
        variant: 'error',
        title: 'Failed to import data'
      })
    }
  })

  async function onImportData() {
    if (!file) return;
    const contents = await file.text();
    importData({ json: contents, overwrite: overwrite });
  }

  function onOverwriteToggleChange(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files[0]) {
      setFile(null);
      return;
    }
    setFile(e.target.files[0])
  }

  function onExportData() {
    const file = new File([exportJSON], `SubTrack Data - ${dayjs().format()}.json`, { type: "application/json" })
    downloadFile(file);
  }

  return (
    <MainLayout title="Data Settings | SubTrack">
      <SettingsLayout>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Own Your Data</h3>
            <p className="text-sm text-muted-foreground">
              SubTrack follows the <a href="https://stephango.com/file-over-app" className="underline underline-offset-2">File over App</a> philosophy.
              All of your subscription data can be imported and exported via JSON.
            </p>
          </div>
					<Separator className="my-6" />

          <div className="flex flex-col space-y-3">
            <Label className="text-base">
              Import Data
            </Label>
            <div className="pt-2 flex flex-col space-y-4">
              <div className="flex flex-row space-x-3">
                <RadioGroup
                  defaultValue="append"
                  onValueChange={(v) => setOverwrite(v === "overwrite")}
                  className="flex flex-row space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="append" id="append" />
                    <Label htmlFor="append">Append Data</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="overwrite" id="overwrite" />
                    <Label htmlFor="overwrite">Overwrite Data</Label>
                  </div>
                </RadioGroup>
              </div>

              <Input
                type="file"
                accept=".json"
                onChange={onOverwriteToggleChange}
                className="w-[300px]"
              />

              <Button disabled={!file} isLoading={isImportDataLoading} onClick={onImportData} className="w-[120px]">
                Import Data
              </Button>
            </div>

            <div className="pt-3" />

            <Label className="text-base">
              Export Data
            </Label>
            <Button className="w-[120px]" onClick={onExportData}>
              Export Data
            </Button>
          </div>
        </div>
      </SettingsLayout>
    </MainLayout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const trpc = createCaller({ auth: getAuth(context.req), prisma: prisma });
  const exportJSON = await trpc.main.getExportJSON();

  return {
    props: {
      exportJSON
    }
  }
}
