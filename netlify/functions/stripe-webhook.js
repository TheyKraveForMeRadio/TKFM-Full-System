
import stripe from 'stripe';(process.env.STRIPE_SECRET_KEY);
import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export const handler = async function(event) {
  const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
  let evt;
  try { evt = stripe.webhooks.constructEvent(event.body, sig, process.env.STRIPE_WEBHOOK_SECRET); } catch (e) { console.error('Webhook signature error', e.message); return { statusCode:400, body: `Webhook Error: ${e.message}` }; }

  if (evt.type === 'checkout.session.completed') {
    const session = evt.data.object;
    try {
      await supabase.from('purchases').update({ status: 'paid' }).eq('session_id', session.id);
      const mixtapeId = session.metadata && session.metadata.mixtape_id;
      if(mixtapeId){
        const { data: mixtapes } = await supabase.from('mixtapes').select('*').eq('id', mixtapeId).limit(1);
        if(mixtapes && mixtapes.length){
          const mixtape = mixtapes[0];
          const { data: urlData, error: urlErr } = await supabase.storage.from('mixtape-audio').createSignedUrl(mixtape.audio_path, 3600);
          if(!urlErr && urlData && urlData.signedURL){
            const signedURL = urlData.signedURL;
            await supabase.from('mixtape_purchases').insert([{
              mixtape_id: mixtapeId,
              user_email: session.customer_details && session.customer_details.email,
              stripe_session: session.id,
              status: 'paid',
              download_url: signedURL,
              purchased_at: new Date().toISOString()
            }]);
            const msg = {
              to: session.customer_details && session.customer_details.email,
              from: process.env.SENDGRID_FROM || 'no-reply@tkfmradio.com',
              subject: `Your TKFM mixtape: ${mixtape.title}`,
              text: `Thanks for your purchase! Download here (link expires in 1 hour): ${signedURL}`,
              html: `<p>Thanks for your purchase!</p><p><a href="${signedURL}">Download your mixtape (expires in 1 hour)</a></p>`
            };
            try{ await sgMail.send(msg); }catch(e){ console.error('SendGrid error', e.message); }
          }
        }
      }
    } catch(e){ console.error('Supabase error', e.message); }
  }
  return { statusCode:200, body: 'ok' };
};
