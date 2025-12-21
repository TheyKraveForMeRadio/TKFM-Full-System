import sgMail from '@sendgrid/mail'
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export async function handler(event) {
  const { email, message } = JSON.parse(event.body)

  await sgMail.send({
    to: email,
    from: 'partners@tkfmradio.com',
    subject: 'TKFM Sponsor Update',
    text: message
  })

  return { statusCode: 200, body: JSON.stringify({ ok: true }) }
}
