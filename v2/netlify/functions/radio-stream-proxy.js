/**
 * TKFM Radio Stream Proxy
 *
 * This Netlify function simply redirects audio clients (the HTML5 <audio> tag)
 * to your real Icecast / Shoutcast / encoder stream.
 *
 * Configure:
 *   RADIO_STREAM_URL=https://your-stream-domain.com/mount
 *
 * Frontend default endpoint:
 *   /.netlify/functions/radio-stream-proxy
 */

export async function handler() {
  const target = process.env.RADIO_STREAM_URL;

  if (!target) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store'
      },
      body: 'RADIO_STREAM_URL is not configured on this Netlify site.'
    };
  }

  return {
    statusCode: 302,
    headers: {
      Location: target,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0'
    },
    body: ''
  };
}
