import { Resend } from "resend";
import { render } from "@react-email/components";
import { VerifyEmail, renderVerifyEmailText } from "./templates/VerifyEmail";
import { PasswordReset, renderPasswordResetText } from "./templates/PasswordReset";
import { MagicLink, renderMagicLinkText } from "./templates/MagicLink";
import { SecurityAlert, renderSecurityAlertText } from "./templates/SecurityAlert";

const apiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.RESEND_FROM_EMAIL ?? "no-reply@aito-alto.com";
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const resend = apiKey ? new Resend(apiKey) : null;

type SendArgs = {
  to: string;
  subject: string;
  react: React.ReactElement;
  text: string;
};

async function send({ to, subject, react, text }: SendArgs): Promise<void> {
  if (!resend) {
    const html = await render(react, { pretty: false });
    // Dev shortcut: print to stdout so devs without Resend can still see
    // verification codes / reset links.
    console.info(
      [
        "──────────  ✉  email (dev console)  ──────────",
        `To: ${to}`,
        `Subject: ${subject}`,
        ``,
        text,
        `──────────────────────────────────────────────`,
      ].join("\n"),
    );
    // Keep `html` around so production-ish dev tools could inspect it.
    void html;
    return;
  }

  await resend.emails.send({
    from: fromAddress,
    to,
    subject,
    react,
    text,
  });
}

export function appUrlBase(): string {
  return appUrl;
}

export async function sendVerifyEmail(opts: {
  to: string;
  code: string;
  magicLinkToken: string;
  locale: string;
}): Promise<void> {
  const magicLink = `${appUrl}/${opts.locale}/verify-email?token=${encodeURIComponent(
    opts.magicLinkToken,
  )}`;
  await send({
    to: opts.to,
    subject: `Your AITO verification code: ${opts.code}`,
    react: VerifyEmail({
      code: opts.code,
      magicLink,
      email: opts.to,
    }),
    text: renderVerifyEmailText({
      code: opts.code,
      magicLink,
      email: opts.to,
    }),
  });
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  resetToken: string;
  locale: string;
}): Promise<void> {
  const resetLink = `${appUrl}/${opts.locale}/reset-password?token=${encodeURIComponent(
    opts.resetToken,
  )}`;
  await send({
    to: opts.to,
    subject: "Reset your AITO password",
    react: PasswordReset({ email: opts.to, resetLink }),
    text: renderPasswordResetText({ email: opts.to, resetLink }),
  });
}

export async function sendMagicLinkEmail(opts: {
  to: string;
  magicLinkToken: string;
  locale: string;
}): Promise<void> {
  const magicLink = `${appUrl}/${opts.locale}/verify-email?token=${encodeURIComponent(
    opts.magicLinkToken,
  )}`;
  await send({
    to: opts.to,
    subject: "Your AITO sign-in link",
    react: MagicLink({ email: opts.to, magicLink }),
    text: renderMagicLinkText({ email: opts.to, magicLink }),
  });
}

export async function sendSecurityAlertEmail(opts: {
  to: string;
  ip: string | null;
  userAgent: string | null;
  whenIso: string;
}): Promise<void> {
  await send({
    to: opts.to,
    subject: "New sign-in to your AITO account",
    react: SecurityAlert({
      email: opts.to,
      ip: opts.ip,
      userAgent: opts.userAgent,
      whenIso: opts.whenIso,
    }),
    text: renderSecurityAlertText({
      email: opts.to,
      ip: opts.ip,
      userAgent: opts.userAgent,
      whenIso: opts.whenIso,
    }),
  });
}
