/**
 * Limit Reached Email Template
 */

import { renderLayout, buttonHtml } from './base';

export interface LimitReachedEmailParams {
  userEmail: string;
  userName?: string;
  limitType: 'text' | 'video';
  currentPlan: string;
  upgradeUrl: string;
}

export function renderLimitReachedEmail({
  userEmail: _userEmail, // eslint-disable-line @typescript-eslint/no-unused-vars
  userName = 'there',
  limitType,
  currentPlan,
  upgradeUrl,
}: LimitReachedEmailParams): { subject: string; html: string; text: string } {
  const isTextLimit = limitType === 'text';
  const limitName = isTextLimit ? 'text generation' : 'video processing';
  const limitEmoji = isTextLimit ? '📝' : '🎥';
  
  const subject = `${limitEmoji} Your ${limitName} limit has been reached`;
  
  const contentHtml = `
    <div style="text-align: center; padding: 20px 0;">
      <div style="font-size: 48px; margin-bottom: 20px;">${limitEmoji}</div>
      <h1 style="color: #1f2937; font-size: 28px; margin-bottom: 16px;">
        ${limitName.charAt(0).toUpperCase() + limitName.slice(1)} Limit Reached
      </h1>
      <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
        Hi ${userName}!<br>
        You've reached your ${limitName} limit for your <strong>${currentPlan}</strong> plan.
      </p>
      
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="color: #92400e; font-size: 14px; margin: 0;">
          <strong>What happens next?</strong><br>
          ${isTextLimit 
            ? 'You can still use the video generator, or upgrade to generate more text content.'
            : 'You can still use the text generator, or upgrade to process more videos.'
          }
        </p>
      </div>
      
      <div style="margin: 32px 0;">
        ${buttonHtml('Upgrade Now', upgradeUrl)}
      </div>
      
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 12px;">
          Why upgrade?
        </h3>
        <ul style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: left; margin: 0;">
          <li>Unlimited ${limitName}</li>
          <li>Priority processing</li>
          <li>Advanced features</li>
          <li>Premium support</li>
        </ul>
      </div>
      
      <p style="color: #9ca3af; font-size: 14px; margin-top: 32px;">
        Questions? Just reply to this email and we'll help you out!
      </p>
    </div>
  `;
  
  const html = renderLayout({
    title: `${limitName.charAt(0).toUpperCase() + limitName.slice(1)} Limit Reached`,
    preheader: `You've reached your ${limitName} limit. Upgrade to continue.`,
    contentHtml,
    footerNote: 'This email was sent because you reached your usage limit.'
  });
  
  const text = `
${limitName.charAt(0).toUpperCase() + limitName.slice(1)} Limit Reached

Hi ${userName}!

You've reached your ${limitName} limit for your ${currentPlan} plan.

What happens next?
${isTextLimit 
  ? 'You can still use the video generator, or upgrade to generate more text content.'
  : 'You can still use the text generator, or upgrade to process more videos.'
}

Upgrade now: ${upgradeUrl}

Why upgrade?
- Unlimited ${limitName}
- Priority processing  
- Advanced features
- Premium support

Questions? Just reply to this email and we'll help you out!

---
This email was sent because you reached your usage limit.
  `.trim();
  
  return { subject, html, text };
}
