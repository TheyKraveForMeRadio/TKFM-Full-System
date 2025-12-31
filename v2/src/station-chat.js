import { createClient } from '@supabase/supabase-js'

/**
 * TKFM Station Chat (Supabase Realtime)
 *
 * Requires:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON
 *
 * Storage:
 * - tkfm_chat_name (display name)
 * - tkfm_member_session (optional: member auth object)
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON

const chatBox = document.getElementById('chatBox')
const chatInput = document.getElementById('chatInput')
const sendBtn = document.getElementById('sendBtn')
const warn = document.getElementById('chatWarn')
const meta = document.getElementById('chatMeta')

function safeJSON(v){ try{ return JSON.parse(v) } catch { return null } }
function getLS(k){ try{ return localStorage.getItem(k) || '' } catch { return '' } }
function setLS(k,v){ try{ localStorage.setItem(k,v) } catch {} }

function escapeHtml(s){
  return String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))
}

function timeAgo(iso){
  try{
    const d = new Date(iso)
    const s = Math.floor((Date.now() - d.getTime())/1000)
    if(s < 10) return 'now'
    if(s < 60) return s + 's'
    const m = Math.floor(s/60)
    if(m < 60) return m + 'm'
    const h = Math.floor(m/60)
    if(h < 24) return h + 'h'
    const days = Math.floor(h/24)
    return days + 'd'
  }catch{
    return ''
  }
}

function getDisplayName(){
  // Prefer member session if it exists
  const session = safeJSON(getLS('tkfm_member_session'))
  const fromSession = session?.displayName || session?.name || session?.email || ''
  if(fromSession) return String(fromSession).split('@')[0]

  // Then local display name
  const saved = getLS('tkfm_chat_name').trim()
  if(saved) return saved

  // Auto-generate guest handle
  const guest = 'Guest-' + Math.random().toString(16).slice(2,6).toUpperCase()
  setLS('tkfm_chat_name', guest)
  return guest
}

function renderMessage(msg){
  const name = escapeHtml(msg.display_name || 'Guest')
  const text = escapeHtml(msg.message || '')
  const t = msg.created_at ? timeAgo(msg.created_at) : ''
  const el = document.createElement('div')
  el.className = 'msg'
  el.innerHTML = `
    <div class="msgTop">
      <span class="name">${name}</span>
      <span class="time">• ${t}</span>
    </div>
    <div class="text">${text}</div>
  `
  return el
}

function scrollToBottom(){
  if(!chatBox) return
  chatBox.scrollTop = chatBox.scrollHeight
}

async function main(){
  if(!SUPABASE_URL || !SUPABASE_ANON){
    if(warn) warn.style.display = ''
    if(meta) meta.textContent = 'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON'
    if(sendBtn) sendBtn.disabled = true
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false }
  })

  const room = 'global'
  const displayName = getDisplayName()
  if(meta) meta.textContent = `Connected as: ${displayName} • Room: ${room}`

  // Initial load
  const { data: recent, error } = await supabase
    .from('chat_messages')
    .select('id, room, display_name, message, created_at')
    .eq('room', room)
    .order('created_at', { ascending: true })
    .limit(60)

  if(error){
    if(warn) warn.style.display = ''
    if(meta) meta.textContent = 'Chat configured but table/policies need setup.'
    if(sendBtn) sendBtn.disabled = true
    return
  }

  if(chatBox){
    chatBox.innerHTML = ''
    ;(recent || []).forEach(m => chatBox.appendChild(renderMessage(m)))
    scrollToBottom()
  }

  // Realtime subscribe
  const channel = supabase
    .channel('tkfm-chat-' + room)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `room=eq.${room}`
    }, payload => {
      const m = payload.new
      if(chatBox){
        chatBox.appendChild(renderMessage(m))
        // Only auto-scroll if user is near bottom
        const nearBottom = (chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight) < 120
        if(nearBottom) scrollToBottom()
      }
    })
    .subscribe()

  async function send(){
    const v = (chatInput?.value || '').trim()
    if(!v) return
    chatInput.value = ''
    const msg = v.slice(0, 420)

    const { error: insErr } = await supabase.from('chat_messages').insert([{
      room,
      display_name: displayName,
      message: msg
    }])

    if(insErr){
      if(meta) meta.textContent = 'Send failed — check RLS policies.'
    }
  }

  sendBtn?.addEventListener('click', send)
  chatInput?.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' && !e.shiftKey){
      e.preventDefault()
      send()
    }
  })

  // expose for quick debugging in dev
  window.__TKFM_CHAT__ = { supabase, channel }
}

main()
