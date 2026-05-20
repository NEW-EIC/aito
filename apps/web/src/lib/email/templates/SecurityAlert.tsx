import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

interface SecurityAlertProps {
  email: string;
  ip: string | null;
  userAgent: string | null;
  whenIso: string;
}

export function SecurityAlert({
  email,
  ip,
  userAgent,
  whenIso,
}: SecurityAlertProps) {
  return (
    <Html>
      <Head />
      <Preview>New sign-in to your AITO account</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>New sign-in to your account</Heading>
          <Text style={text}>
            We noticed a new sign-in to {email} at {whenIso}.
          </Text>
          <Text style={detail}>IP: {ip ?? "unknown"}</Text>
          <Text style={detail}>Device: {userAgent ?? "unknown"}</Text>
          <Text style={hint}>
            If this was you, you can ignore this email. If you don&apos;t
            recognize this activity, change your password immediately from
            the account settings page.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const renderSecurityAlertText = ({
  email,
  ip,
  userAgent,
  whenIso,
}: SecurityAlertProps): string =>
  [
    `New sign-in to your AITO account`,
    ``,
    `We noticed a new sign-in to ${email} at ${whenIso}.`,
    `IP: ${ip ?? "unknown"}`,
    `Device: ${userAgent ?? "unknown"}`,
    ``,
    `If this was you, ignore this message. Otherwise, change your password`,
    `immediately from your account settings.`,
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
const detail: React.CSSProperties = {
  fontSize: "14px",
  color: "#555",
  margin: "0 0 6px 0",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};
const hint: React.CSSProperties = {
  fontSize: "13px",
  color: "#666",
  marginTop: "24px",
};
