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
} from '@react-email/components';

export type PasswordResetEmailProps = {
  userName: string;
  resetURL: string;
};

export function PasswordResetEmail({
  userName,
  resetURL,
}: Readonly<PasswordResetEmailProps>) {
  return (
    <Html>
      <Head />
      <Preview>SubTrack Password Reset</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto px-4 pt-5">
            <Img
              alt="SubTrack"
              height={30}
              src="https://subtrack.cbuff.dev/subtrack_full.jpg"
              width={135}
            />
            <Text>
              Hi {userName},
              <br />
              <br />
              We received a request to reset the password for your account.
              <br />
              To reset your password, click on the button below:
            </Text>
            <Button href={resetURL}>Reset Password</Button>
            <br />
            <Text>
              Or copy and paste the URL into your browser:
              <br />
              <Link href={resetURL}>{resetURL}</Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default PasswordResetEmail;
