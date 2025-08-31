import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface VercelInviteUserEmailProps {
  username?: string;
  userImage?: string;
  invitedByUsername?: string;
  invitedByEmail?: string;
  teamName?: string;
  teamImage?: string;
  inviteLink?: string;
  inviteFromIp?: string;
  inviteFromLocation?: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : '';

export const VercelInviteUserEmail = ({
  username = 'zenorocha',
  userImage = `${baseUrl}/static/vercel-user.png`,
  invitedByUsername = 'bukinoshita',
  invitedByEmail = 'bukinoshita@example.com',
  teamName = 'My Project',
  teamImage = `${baseUrl}/static/vercel-team.png`,
  inviteLink = 'https://vercel.com/teams/invite/foo',
  inviteFromIp = '204.13.186.218',
  inviteFromLocation = 'São Paulo, Brazil',
}: VercelInviteUserEmailProps) => {
  const previewText = `Join ${invitedByUsername} on Vercel`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-[40px] w-[465px] rounded border border-[#eaeaea] border-solid p-[20px]">
            <Section className="mt-[32px]">
              <Img
                alt="Vercel"
                className="mx-auto my-0"
                height="37"
                src={`${baseUrl}/static/vercel-logo.png`}
                width="40"
              />
            </Section>
            <Heading className="mx-0 my-[30px] p-0 text-center font-normal text-[24px] text-black">
              Join <strong>{teamName}</strong> on <strong>Vercel</strong>
            </Heading>
            <Text className="text-[14px] text-black leading-[24px]">
              Hello {username},
            </Text>
            <Text className="text-[14px] text-black leading-[24px]">
              <strong>bukinoshita</strong> (
              <Link
                className="text-blue-600 no-underline"
                href={`mailto:${invitedByEmail}`}
              >
                {invitedByEmail}
              </Link>
              ) has invited you to the <strong>{teamName}</strong> team on{' '}
              <strong>Vercel</strong>.
            </Text>
            <Section>
              <Row>
                <Column align="right">
                  <Img
                    className="rounded-full"
                    height="64"
                    src={userImage}
                    width="64"
                  />
                </Column>
                <Column align="center">
                  <Img
                    alt="invited you to"
                    height="9"
                    src={`${baseUrl}/static/vercel-arrow.png`}
                    width="12"
                  />
                </Column>
                <Column align="left">
                  <Img
                    className="rounded-full"
                    height="64"
                    src={teamImage}
                    width="64"
                  />
                </Column>
              </Row>
            </Section>
            <Section className="mt-[32px] mb-[32px] text-center">
              <Button
                className="rounded bg-[#000000] text-center font-semibold text-[12px] text-white no-underline"
                href={inviteLink}
                pX={20}
                pY={12}
              >
                Join the team
              </Button>
            </Section>
            <Text className="text-[14px] text-black leading-[24px]">
              or copy and paste this URL into your browser:{' '}
              <Link className="text-blue-600 no-underline" href={inviteLink}>
                {inviteLink}
              </Link>
            </Text>
            <Hr className="mx-0 my-[26px] w-full border border-[#eaeaea] border-solid" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This invitation was intended for{' '}
              <span className="text-black">{username} </span>.This invite was
              sent from <span className="text-black">{inviteFromIp}</span>{' '}
              located in{' '}
              <span className="text-black">{inviteFromLocation}</span>. If you
              were not expecting this invitation, you can ignore this email. If
              you are concerned about your account's safety, please reply to
              this email to get in touch with us.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default VercelInviteUserEmail;
