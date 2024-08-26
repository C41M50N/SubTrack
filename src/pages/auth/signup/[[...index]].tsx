import { SignUp } from "@clerk/nextjs";

export default function Page() {
	return (
		<div className="h-screen flex mt-20 md:mt-32 justify-center">
			<SignUp />
		</div>
	);
}
