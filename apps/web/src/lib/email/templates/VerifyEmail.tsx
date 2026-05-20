import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface VerifyEmailProps {
  code: string;
  magicLink: string;
  email: string;
}

export function VerifyEmail({ code, magicLink, email }: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your AITO verification code: {code}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Welcome to AITO</Heading>
          <Text style={text}>
            We received a sign-up request for {email}. Use the code below to
            verify your address, or click the magic link.
          </Text>
          <Section style={codeBox}>
            <Text style={codeText}>{code}</Text>
          </Section>
          <Text style={text}>
            Or click here to verify:{" "}
            <Link href={magicLink} style={link}>
              Verify my email
            </Link>
          </Text>
          <Text style={hint}>
            This code expires in 10 minutes. If you didn&apos;t sign up, ignore
            this message.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const renderVerifyEmailText = ({
  code,
  magicLink,
  email,
}: VerifyEmailProps): string =>
  [
    `Welcome to AITO`,
    ``,
    `We received a sign-up request for ${email}.`,
    ``,
    `Your verification code: ${code}`,
    ``,
    `Or open this link in a browser to verify:`,
    magicLink,
    ``,
    `This code expires in 10 minutes. If you didn't sign up, ignore this email.`,
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
const codeBox: React.CSSProperties = {
  backgroundColor: "#f1f1ef",
  padding: "20px 0",
  textAlign: "center" as const,
  margin: "24px 0",
  borderRadius: "8px",
};
const codeText: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 600,
  letterSpacing: "0.3em",
  margin: 0,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};
const link: React.CSSProperties = {
  color: "#0a66c2",
  textDecoration: "underline",
};
const hint: React.CSSProperties = {
  fontSize: "13px",
  color: "#666",
  marginTop: "24px",
};
