import { Loader2, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { GetServerSidePropsContext } from 'next/types';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { signIn, signUp } from '@/features/auth/auth-client';
import AuthLayout from '@/layouts/auth';
import { getServerAuthSession } from '@/server/api/trpc';

export default function SignUpPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AuthLayout>
      <div className="w-[450px]">
        <Card className="w-full border-none px-4 pt-1 pb-4 shadow-none sm:border sm:px-6 sm:shadow-xl">
          <CardHeader>
            <div className="mx-auto pb-1">
              <Image
                alt="SubTrack"
                height={34}
                src={'/subtrack_full.jpg'}
                width={225}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Input
                    id="first-name"
                    onChange={(e) => {
                      setFirstName(e.target.value);
                    }}
                    required
                    value={firstName}
                    variant="sm"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input
                    id="last-name"
                    onChange={(e) => {
                      setLastName(e.target.value);
                    }}
                    required
                    value={lastName}
                    variant="sm"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  required
                  type="email"
                  value={email}
                  variant="sm"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  autoComplete="new-password"
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  value={password}
                  variant="sm"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Confirm Password</Label>
                <Input
                  autoComplete="new-password"
                  id="password_confirmation"
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  type="password"
                  value={passwordConfirmation}
                  variant="sm"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image">
                  Profile Image{' '}
                  <span className="text-muted-foreground text-xs leading-none">
                    (optional)
                  </span>
                </Label>
                <div className="flex items-end gap-4">
                  {imagePreview && (
                    <div className="relative h-16 w-16 overflow-hidden rounded-sm">
                      <Image
                        alt="Profile preview"
                        layout="fill"
                        objectFit="cover"
                        src={imagePreview}
                      />
                    </div>
                  )}
                  <div className="flex w-full items-center gap-2">
                    <Input
                      accept="image/*"
                      className="w-full"
                      id="image"
                      onChange={handleImageChange}
                      type="file"
                    />
                    {imagePreview && (
                      <X
                        className="cursor-pointer"
                        onClick={() => {
                          setImage(null);
                          setImagePreview(null);
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
              <Button
                className="w-full"
                disabled={loading}
                onClick={async () => {
                  await signUp.email({
                    email,
                    password,
                    name: `${firstName} ${lastName}`,
                    image: image ? await convertImageToBase64(image) : '',
                    callbackURL: '/dashboard',
                    fetchOptions: {
                      onRequest: () => setLoading(true),
                      onResponse: () => setLoading(false),
                      onError(ctx) {
                        toast({
                          variant: 'error',
                          title: 'Something went wrong',
                          description: ctx.error.message,
                        });
                      },
                      onSuccess() {
                        router.push('/dashboard');
                      },
                    },
                  });
                }}
                type="submit"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  'Create an account'
                )}
              </Button>

              <div className="flex flex-row items-center gap-x-4 px-3">
                <div className="flex-1">
                  <Separator />
                </div>
                <span className="text-muted-foreground text-sm leading-none">
                  or
                </span>
                <div className="flex-1">
                  <Separator />
                </div>
              </div>

              <div className="flex w-full flex-col items-center justify-between gap-2">
                <Button
                  className="w-full gap-3"
                  onClick={async () => {
                    await signIn.social({
                      provider: 'google',
                      callbackURL: '/dashboard',
                    });
                  }}
                  variant="outline"
                >
                  <Image
                    alt="Google Icon"
                    className="size-4"
                    height={20}
                    src="/google.svg"
                    width={20}
                  />
                  Sign in with Google
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex w-full justify-center pt-4">
              <p className="text-center text-muted-foreground text-xs">
                Secured by{' '}
                <a
                  className="underline"
                  href="https://better-auth.com"
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="font-medium text-[#40516f]">
                    better-auth
                  </span>
                </a>
                .
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </AuthLayout>
  );
}

async function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerAuthSession(context.req);
  if (session) {
    return {
      redirect: {
        destination: '/dashboard',
      },
    };
  }

  return { props: {} };
}
