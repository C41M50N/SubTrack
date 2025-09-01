import dayjs from 'dayjs';
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from 'next';
import type { ChangeEvent } from 'react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import MainLayout from '@/layouts/main';
import SettingsLayout from '@/layouts/settings';
import { createCaller } from '@/server/api/root';
import { getServerAuthSession } from '@/server/api/trpc';
import { prisma } from '@/server/db';
import { downloadFile } from '@/utils';
import { api } from '@/utils/api';

export default function DataSettingsPage({
  exportJSON,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [overwrite, setOverwrite] = React.useState<boolean>(false);
  const [file, setFile] = React.useState<File | null>(null);

  const { mutateAsync: importData, isLoading: isImportDataLoading } =
    api.data.importData.useMutation({
      onSuccess() {
        toast({
          variant: 'success',
          title: 'Successfully imported data',
        });
      },
      onError() {
        toast({
          variant: 'error',
          title: 'Failed to import data',
        });
      },
    });

  async function onImportData() {
    if (!file) {
      return;
    }
    const contents = await file.text();
    importData({ json: contents, overwrite });
  }

  function onOverwriteToggleChange(e: ChangeEvent<HTMLInputElement>) {
    if (!(e.target.files && e.target.files[0])) {
      setFile(null);
      return;
    }
    setFile(e.target.files[0]);
  }

  function onExportData() {
    const _file = new File(
      [exportJSON],
      `SubTrack Data - ${dayjs().format()}.json`,
      { type: 'application/json' }
    );
    downloadFile(_file);
  }

  return (
    <MainLayout title="Data Settings | SubTrack">
      <SettingsLayout>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-lg">Own Your Data</h3>
            <p className="text-muted-foreground text-sm">
              SubTrack follows the{' '}
              <a
                className="underline underline-offset-2"
                href="https://stephango.com/file-over-app"
              >
                File over App
              </a>{' '}
              philosophy. All of your subscription data can be imported and
              exported via JSON.
            </p>
          </div>
          <Separator className="my-6" />

          <div className="flex flex-col space-y-3">
            <Label className="font-semibold text-base">Import Data</Label>
            <div className="flex flex-col space-y-4 pt-2">
              <div className="flex flex-row space-x-3">
                <RadioGroup
                  className="flex flex-row space-x-4"
                  defaultValue="append"
                  onValueChange={(v) => setOverwrite(v === 'overwrite')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="append" value="append" />
                    <Label htmlFor="append">Append Data</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="overwrite" value="overwrite" />
                    <Label htmlFor="overwrite">Overwrite Data</Label>
                  </div>
                </RadioGroup>
              </div>

              <Input
                accept=".json"
                className="w-[300px]"
                onChange={onOverwriteToggleChange}
                type="file"
              />

              <Button
                className="w-[120px]"
                disabled={!file}
                isLoading={isImportDataLoading}
                onClick={onImportData}
              >
                Import Data
              </Button>
            </div>

            <div className="pt-3" />

            <Label className="font-semibold text-base">Export Data</Label>
            <Button className="w-[120px]" onClick={onExportData}>
              Export Data
            </Button>
          </div>
        </div>
      </SettingsLayout>
    </MainLayout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerAuthSession(context.req);
  const trpc = createCaller({ session, db: prisma });
  const exportJSON = await trpc.data.createJSONExport();

  return {
    props: {
      exportJSON,
    },
  };
}
