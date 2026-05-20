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

interface MagicLinkProps {
  email: string;
  magicLink: string;
}

export function MagicLink({ email, magicLink }: MagicLinkProps) {
  return (
    <Html>
      <Head />
      <Preview>Your AITO sign-in link</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Sign in to AITO</Heading>
          <Text style={text}>
            Click the link below to finish signing in as {email}.
          </Text>
          <Text style={text}>
            <Link href={magicLink} style={ctaLink}>
              Continue to AITO
            </Link>
          </Text>
          <Text style={hint}>
            This link is valid for 10 minutes and can only be used once.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const renderMagicLinkText = ({
  email,
  magicLink,
}: MagicLinkProps): string =>
  [
    `Sign in to AITO`,
    ``,
    `Click the link below to finish signing in as ${email}.`,
    magicLink,
    ``,
    `This link is valid for 10 minutes and can only be used once.`,
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
