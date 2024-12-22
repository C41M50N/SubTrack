import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Html,
	Img,
	Link,
	Preview,
	Tailwind,
	Text,
} from "@react-email/components";

export type VerificationEmailProps = {
	userName: string;
	verifyURL: string;
};

export function VerificationEmail({
	userName,
	verifyURL,
}: Readonly<VerificationEmailProps>) {
	return (
		<Html>
			<Head />
			<Preview>SubTrack Password Reset</Preview>
			<Tailwind>
				<Body className="bg-white my-auto mx-auto font-sans">
					<Container className="mx-auto px-4 pt-5">
						<Img
							src="https://subtrack.cbuff.dev/subtrack_full.jpg"
							alt="SubTrack"
							height={30}
							width={135}
						/>
						<Text>
							Hi {userName},
							<br />
							<br />
							We're happy you signed up for SubTrack. To start managing those
							pesky subscriptions, please confirm your email address.
						</Text>
						<Button href={verifyURL}>Verify Email</Button>
						<br />
						<Text>
							If you have problems, please paste the below URL into your web
							browser.
						</Text>
						<Link href={verifyURL}>{verifyURL}</Link>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}
