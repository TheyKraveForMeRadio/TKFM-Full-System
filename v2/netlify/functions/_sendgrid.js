export async function sendEmail({ to, from, subject, html, text }) {
  const apiKey = String(process.env.SENDGRID_API_KEY || '').trim();
  const fromEmail = String(from || process.env.SENDGRID_FROM_EMAIL || '').trim();

  if (!apiKey) throw new Error('missing_SENDGRID_API_KEY');
  if (!fromEmail) throw new Error('missing_SENDGRID_FROM_EMAIL');
  if (!to) throw new Error('missing_to');

  const payload = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: fromEmail },
    subject: subject || 'TKFM Notification',
    content: [
      { type: 'text/plain', value: text || '' },
      { type: 'text/html', value: html || '<div></div>' }
    ]
  };

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`sendgrid_failed:${res.status}:${msg}`);
  }

  return true;
}
