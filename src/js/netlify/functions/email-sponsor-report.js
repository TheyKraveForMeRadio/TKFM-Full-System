import sgMail from '@sendgrid/mail'
import { getStore } from './_helpers.js'

sgMail.setApiKey(process.env.SENDGRID_KEY)

export async function handler() {
  const sponsors = await getStore('sponsors')

  for (const s of sponsors.filter(x=>x.active)) {
    await sgMail.send({
      to: s.email,
      from: 'reports@tkfmradio.com',
      subject: '📊 Your TKFM Sponsor Report',
      html: `
        <h2>${s.name}</h2>
        <p>Impressions: ${s.impressions||0}</p>
        <p>Clicks: ${s.clicks||0}</p>
      `
    })
  }

  return { statusCode: 200, body: 'sent' }
}
