import sgMail from '@sendgrid/mail';
import { getStore, setStore } from './_helpers.js';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function handler() {
  const mixtapes = await getStore('mixtapes');
  const now = Date.now();
  const ONE_DAY = 86400000;

  for (const m of mixtapes) {
    if (!m.featured || !m.djEmail || m.expireWarned) continue;

    if (m.featureExpiresAt - now <= ONE_DAY) {
      await sgMail.send({
        to: m.djEmail,
        from: 'noreply@tkfmradio.com',
        subject: '⏱️ Feature Expiring Soon — Renew Now',
        html: `
          <h2>Your TKFM Feature Is Ending ⏱️</h2>
          <p><strong>${m.title}</strong> expires in less than 24 hours.</p>
          <p>Renew now to keep your spotlight and ranking.</p>
          <a href="https://www.tkfmradio.com/dj">Renew Feature</a>
        `
      });

      m.expireWarned = true;
    }
  }

  await setStore('mixtapes', mixtapes);

  return { statusCode: 200, body: 'Expiration warnings sent' };
}
