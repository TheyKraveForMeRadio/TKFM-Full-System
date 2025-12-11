
import React, {useEffect, useState} from 'react'
export default function Home(){
  const [posts,setPosts]=useState([])
  useEffect(()=>{ fetch('/.netlify/functions/blog-list').then(r=>r.json()).then(setPosts).catch(()=>{}) },[])
  return (<div>
    <section className='live-hero card'>
      <iframe title='live' width='760' height='200' src='https://live365.com/embeds/v1/player/a71526?s=md&m=dark&c=mp3' frameBorder='0'></iframe>
      <h1>They Krave For Me Radio — Omega FX 3.5</h1>
      <p className='lead'>Neon Purple — God Mode</p>
    </section>
    <section className='services card'>
      <h2>Services</h2>
      <div className='service-grid'>
        <div className='card'><h4>Homepage Post</h4><p>$100–$300</p></div>
        <div className='card'><h4>Interviews</h4><p>$50 (15m) — $150 (30m)</p></div>
        <div className='card'><h4>Spotlight</h4><p>$150</p></div>
        <div className='card'><h4>Rotation</h4><p>$50–$200</p></div>
      </div>
    </section>
    <section className='spotlight card'>
      <h2>Artist Spotlight</h2>
      <div id='spotlight-cards'>Lt. Slime • Kargo Ken • Savage Butta</div>
    </section>
  </div>)
}
