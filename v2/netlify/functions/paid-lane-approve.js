import { getStore, setStore } from './_helpers.js';

function isAuthorized(event){
  const key = process.env.TKFM_OWNER_KEY || process.env.OWNER_KEY || '';
  const q = event.queryStringParameters || {};
  const headerKey =
    (event.headers && (event.headers['x-tkfm-owner-key'] || event.headers['X-Tkfm-Owner-Key'])) || '';
  const provided = headerKey || (q.key || '');

  return !!(key && provided && String(provided) === String(key));
}

function laneToFeaturedType(lane){
  const s = String(lane||'').toLowerCase();
  if (s.includes('podcast')) return 'podcast';
  if (s.includes('video') || s.includes('tv') || s.includes('visual')) return 'tv';
  if (s.includes('press')) return 'press';
  if (s.includes('social')) return 'social';
  return 'tv';
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ ok:false, error:'method_not_allowed' }) };
    }
    if (!isAuthorized(event)) {
      return { statusCode: 401, body: JSON.stringify({ ok:false, error:'unauthorized' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const id = String(body.id || '').trim();
    const overrideType = String(body.featuredType || '').trim();

    if (!id) return { statusCode: 400, body: JSON.stringify({ ok:false, error:'missing_id' }) };

    const submissionsKey = 'paid_lane_submissions';
    const submissions = (await getStore(submissionsKey)) || [];
    const idx = submissions.findIndex(x => String(x.id) === id);
    if (idx < 0) return { statusCode: 404, body: JSON.stringify({ ok:false, error:'not_found' }) };

    const sub = submissions[idx];
    const featuredType = overrideType || laneToFeaturedType(sub.lane);

    // Featured store key shared by media-feature-get
    const featuredKey = process.env.TKFM_MEDIA_FEATURE_STORE_KEY || 'media_featured';
    const featured = (await getStore(featuredKey)) || [];

    const featuredItem = {
      id: `feat_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      ts: Date.now(),
      type: featuredType,
      lane: sub.lane || '',
      title: sub.title || '',
      url: sub.link || '',
      link: sub.link || '',
      contact: sub.contact || '',
      notes: sub.notes || '',
      sourceSubmissionId: sub.id
    };

    featured.unshift(featuredItem);
    await setStore(featuredKey, featured);

    // mark submission approved (keep it for records)
    submissions[idx] = {
      ...sub,
      status: 'approved',
      approvedAt: Date.now(),
      featuredId: featuredItem.id,
      featuredType
    };
    await setStore(submissionsKey, submissions);

    return { statusCode: 200, body: JSON.stringify({ ok:true, featuredId: featuredItem.id, featuredType }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok:false, error:'server_error' }) };
  }
}
