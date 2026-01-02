import { getStore } from './_helpers.js';

export async function handler() {
  const schedule = (await getStore('show_schedule')) || {};
  const slots = Array.isArray(schedule.slots) ? schedule.slots : [];
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slots,
      updatedAt: schedule.updatedAt || null
    })
  };
}
