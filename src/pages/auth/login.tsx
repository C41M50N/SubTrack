import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { signIn } from "@/features/auth/auth-client";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export default function SignInPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	return (
		<div className="h-screen sm:-mt-10 flex justify-center items-center">
			<div className="w-[450px]">
				<Card className="w-full px-4 sm:px-6 pt-1 pb-4 shadow-none sm:shadow-xl border-none sm:border">
					<CardHeader>
						<div className="mx-auto pb-1">
							<Image
								alt="SubTrack"
								width={225}
								height={34}
								src={"/subtrack_full.jpg"}
							/>
						</div>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4">
							<div className="grid gap-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									required
									onChange={(e) => {
										setEmail(e.target.value);
									}}
									value={email}
								/>
							</div>

							<div className="grid gap-2">
								<div className="flex items-baseline">
									<Label htmlFor="password">Password</Label>
									<Link
										href="/auth/forgot-password"
										className="ml-auto inline-block text-xs underline"
									>
										Forgot your password?
									</Link>
								</div>

								<Input
									id="password"
									type="password"
									autoComplete="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
								/>
							</div>

							<Button
								type="submit"
								className="w-full"
								disabled={loading}
								onClick={async () => {
									await signIn.email({
										email,
										password,
										fetchOptions: {
											onResponse: () => {
												setLoading(false);
											},
											onRequest: () => {
												setLoading(true);
											},
											onError: (ctx) => {
												toast({
													variant: "error",
													title: "Something went wrong",
													description: ctx.error.message,
												});
											},
											onSuccess: async () => {
												router.push("/dashboard");
											},
										},
									});
								}}
							>
								{loading ? (
									<Loader2 size={16} className="animate-spin" />
								) : (
									"Login"
								)}
							</Button>

							<div className="px-3 flex flex-row items-center gap-x-4">
								<div className="flex-1">
									<Separator />
								</div>
								<span className="text-sm text-muted-foreground leading-none">
									or
								</span>
								<div className="flex-1">
									<Separator />
								</div>
							</div>

							<div className="w-full gap-2 flex items-center justify-between flex-col">
								<Button
									variant="outline"
									className="w-full gap-3"
									onClick={async () => {
										await signIn.social({
											provider: "google",
											callbackURL: "/dashboard",
										});
									}}
								>
									<Image
										alt="Google Icon"
										src="/google.svg"
										height={20}
										width={20}
										className="size-4"
									/>
									Sign in with Google
								</Button>
							</div>
						</div>
					</CardContent>
					<CardFooter>
						<div className="flex justify-center w-full pt-4">
							<p className="text-center text-xs text-muted-foreground">
								Secured by{" "}
								<a
									href="https://better-auth.com"
									className="underline"
									target="_blank"
									rel="noreferrer"
								>
									<span className="text-[#40516f] font-medium">
										better-auth
									</span>
								</a>
								.
							</p>
						</div>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
