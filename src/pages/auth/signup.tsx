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
import { useState } from "react";
import Image from "next/image";
import { Loader2, X } from "lucide-react";
import { signIn, signUp } from "@/features/auth/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";

export default function SignUpPage() {
	const router = useRouter();
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [passwordConfirmation, setPasswordConfirmation] = useState("");
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
							<div className="grid grid-cols-2 gap-4">
								<div className="grid gap-2">
									<Label htmlFor="first-name">First name</Label>
									<Input
										variant="sm"
										id="first-name"
										required
										onChange={(e) => {
											setFirstName(e.target.value);
										}}
										value={firstName}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="last-name">Last name</Label>
									<Input
										variant="sm"
										id="last-name"
										required
										onChange={(e) => {
											setLastName(e.target.value);
										}}
										value={lastName}
									/>
								</div>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="email">Email</Label>
								<Input
									variant="sm"
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
								<Label htmlFor="password">Password</Label>
								<Input
									variant="sm"
									id="password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									autoComplete="new-password"
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="password">Confirm Password</Label>
								<Input
									variant="sm"
									id="password_confirmation"
									type="password"
									value={passwordConfirmation}
									onChange={(e) => setPasswordConfirmation(e.target.value)}
									autoComplete="new-password"
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="image">Profile Image{" "}
									<span className="leading-none text-xs text-muted-foreground">(optional)</span>
								</Label>
								<div className="flex items-end gap-4">
									{imagePreview && (
										<div className="relative w-16 h-16 rounded-sm overflow-hidden">
											<Image
												src={imagePreview}
												alt="Profile preview"
												layout="fill"
												objectFit="cover"
											/>
										</div>
									)}
									<div className="flex items-center gap-2 w-full">
										<Input
											id="image"
											type="file"
											accept="image/*"
											onChange={handleImageChange}
											className="w-full"
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
								type="submit"
								className="w-full"
								disabled={loading}
								onClick={async () => {
									await signUp.email({
										email,
										password,
										name: `${firstName} ${lastName}`,
										image: image ? await convertImageToBase64(image) : "",
										callbackURL: "/dashboard",
										fetchOptions: {
											onRequest: () => setLoading(true),
											onResponse: () => setLoading(false),
											onError(ctx) {
												toast({
													variant: "error",
													title: "Something went wrong",
													description: ctx.error.message,
												})
											},
											onSuccess() {
												router.push("/dashboard");
											},
										},
									});
								}}
							>
								{loading ? (
									<Loader2 size={16} className="animate-spin" />
								) : (
									"Create an account"
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
									<span className="text-[#40516f] font-medium">better-auth</span>
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

async function convertImageToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}
