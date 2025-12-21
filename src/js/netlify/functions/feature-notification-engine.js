import sgMail from '@sendgrid/mail'
import { getStore } from './_helpers.js'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export async function handler() {
  const mixes = await getStore('mixtapes')

  for (const m of mixes) {
    if (m.featured && m.djEmail && !m.notified) {
      await sgMail.send({
        to: m.djEmail,
        from: 'alerts@tkfmradio.com',
        subject: '🔥 Your Mixtape Is Featured',
        text: `Your mixtape "${m.title}" is now featured on TKFM.`
      })
      m.notified = true
    }
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) }
}
