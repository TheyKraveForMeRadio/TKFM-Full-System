import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const handler = async (event) => {
  const { type } = JSON.parse(event.body)

  const prices = {
    homepage: process.env.STRIPE_PRICE_HOMEPAGEPOST,
    interview: process.env.STRIPE_PRICE_INTERVIEW,
    spotlight: process.env.STRIPE_PRICE_SPOTLIGHT
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      price: prices[type],
      quantity: 1
    }],
    success_url: `${process.env.SITE_DOMAIN}/success.html`,
    cancel_url: `${process.env.SITE_DOMAIN}/dj.html`
  })

  return {
    statusCode: 200,
    body: JSON.stringify({ url: session.url })
  }
}
