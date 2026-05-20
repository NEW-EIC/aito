import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";

interface PasswordResetProps {
  email: string;
  resetLink: string;
}

export function PasswordReset({ email, resetLink }: PasswordResetProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your AITO password</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Reset your password</Heading>
          <Text style={text}>
            We received a request to reset the password for {email}.
          </Text>
          <Text style={text}>
            <Link href={resetLink} style={ctaLink}>
              Set a new password
            </Link>
          </Text>
          <Text style={hint}>
            This link is valid for 1 hour and can only be used once. If you
            didn&apos;t request a reset, ignore this email — your password is
            unchanged.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const renderPasswordResetText = ({
  email,
  resetLink,
}: PasswordResetProps): string =>
  [
    `Reset your AITO password`,
    ``,
    `We received a request to reset the password for ${email}.`,
    ``,
    `Open this link in a browser to set a new password:`,
    resetLink,
    ``,
    `This link is valid for 1 hour and can only be used once.`,
    `If you didn't request a reset, ignore this email — your password is unchanged.`,
  ].join("\n");

const body: React.CSSProperties = {
  backgroundColor: "#f6f6f5",
  fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
  margin: 0,
  padding: 0,
};
const container: React.CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "32px 24px",
  backgroundColor: "#fff",
};
const h1: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 600,
  color: "#111",
  margin: "0 0 16px 0",
};
const text: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: 1.6,
  color: "#333",
  margin: "0 0 16px 0",
};
const ctaLink: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 18px",
  borderRadius: "6px",
  backgroundColor: "#111",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 600,
};
const hint: React.CSSProperties = {
  fontSize: "13px",
  color: "#666",
  marginTop: "24px",
};
