/**
 * Send Limit Reached Email
 */

import { sendTransactionalEmail } from './sendTransactional';
import { renderLimitReachedEmail, type LimitReachedEmailParams } from './templates/limitReached';

export async function sendLimitReachedEmail(params: LimitReachedEmailParams): Promise<void> {
  const { subject, html, text } = renderLimitReachedEmail(params);
  
  await sendTransactionalEmail({
    to: params.userEmail,
    subject,
    html,
    text,
  });
  
  console.log(`Limit reached email sent to ${params.userEmail} for ${params.limitType} limit`);
}

