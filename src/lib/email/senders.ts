import { sendTransactionalEmail } from "./sendTransactional";
import { BRAND } from "./branding";

import { authMagicLinkHtml, authMagicLinkText } from "./templates/authMagicLink";
import { passwordResetHtml, passwordResetText } from "./templates/passwordReset";
import { emailChangeVerifyHtml, emailChangeVerifyText } from "./templates/emailChangeVerify";
import {
  newDeviceLoginHtml,
  newDeviceLoginText,
  type DeviceInfo,
} from "./templates/newDeviceLogin";
import { consentReceiptHtml, consentReceiptText } from "./templates/consentReceipt";
import { accountDeletionConfirmHtml, accountDeletionConfirmText } from "./templates/accountDeletion";

export async function sendMagicLink(to: string, url: string): Promise<void> {
  await sendTransactionalEmail({
    to,
    subject: "Your Captioni magic link ✨",
    html: authMagicLinkHtml(url),
    text: authMagicLinkText(url),
    replyTo: BRAND.support,
  });
}

export async function sendPasswordReset(to: string, url: string): Promise<void> {
  await sendTransactionalEmail({
    to,
    subject: "Reset your Captioni password",
    html: passwordResetHtml(url),
    text: passwordResetText(url),
    replyTo: BRAND.support,
  });
}

export async function sendEmailChangeVerify(to: string, url: string, newEmail: string): Promise<void> {
  await sendTransactionalEmail({
    to,
    subject: "Confirm your new email",
    html: emailChangeVerifyHtml(url, newEmail),
    text: emailChangeVerifyText(url, newEmail),
    replyTo: BRAND.support,
  });
}

export async function sendNewDeviceLogin(to: string, info: DeviceInfo): Promise<void> {
  await sendTransactionalEmail({
    to,
    subject: "New sign-in detected",
    html: newDeviceLoginHtml(info),
    text: newDeviceLoginText(info),
    replyTo: BRAND.support,
  });
}

export async function sendConsentReceipt(to: string, marketing: boolean, atISO: string): Promise<void> {
  await sendTransactionalEmail({
    to,
    subject: "Your email preferences were updated",
    html: consentReceiptHtml(marketing, atISO),
    text: consentReceiptText(marketing, atISO),
    replyTo: BRAND.support,
  });
}

export async function sendAccountDeletionConfirm(to: string, atISO: string): Promise<void> {
  await sendTransactionalEmail({
    to,
    subject: "Account deletion scheduled",
    html: accountDeletionConfirmHtml(atISO),
    text: accountDeletionConfirmText(atISO),
    replyTo: BRAND.support,
  });
}
