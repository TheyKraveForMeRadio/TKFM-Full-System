import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';

import Home from './pages/Home';
import OnAir from './components/OnAir';
import Shows from './pages/Shows';
import Merch from './pages/Merch';
import Spotlight from './pages/Spotlight';
import News from './pages/News';
import Chat from './pages/Chat';

import Player from './pages/Player';
import Mixtapes from './pages/Mixtapes';
import Store from './pages/Store';
import Artists from './pages/Artists';
import Admin from './pages/Admin';
import Auth from './pages/Auth';

import AudioBars from './components/AudioBars';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <div className='app'>
      <header className='hero-header'>

        {/* Wrap OnAir in an Error Boundary */}
        <ErrorBoundary>
          <OnAir />
        </ErrorBoundary>

        <div className='logo-wrap'>
          <img src='/assets/logo.svg' className='logo-3d' alt='TKFM' />
        </div>

        <nav className='main-nav'>
          <Link to='/'>Home</Link>
          <Link to='/player'>Listen</Link>
          <Link to='/mixtapes'>Mixtapes</Link>
          <Link to='/store'>Shop</Link>
          <Link to='/news'>News</Link>
          <Link to='/artists'>Artists</Link>

          {/* Wrap Admin link as well */}
          <ErrorBoundary>
            <Link to='/admin'>Admin</Link>
          </ErrorBoundary>
        </nav>

        <AudioBars />
      </header>

      <main className='container'>
        <Routes>
          <Route path='/' element={<Home />} />

          <Route path='/player' element={
            <ErrorBoundary>
              <Player />
            </ErrorBoundary>
          }/>

          <Route path='/mixtapes' element={
            <ErrorBoundary>
              <Mixtapes />
            </ErrorBoundary>
          }/>

          <Route path='/store' element={
            <ErrorBoundary>
              <Store />
            </ErrorBoundary>
          }/>

          <Route path='/news' element={
            <ErrorBoundary>
              <News />
            </ErrorBoundary>
          }/>

          <Route path='/artists' element={
            <ErrorBoundary>
              <Artists />
            </ErrorBoundary>
          }/>

          <Route path='/admin' element={
            <ErrorBoundary>
              <Admin />
            </ErrorBoundary>
          }/>

          <Route path='/auth' element={
            <ErrorBoundary>
              <Auth />
            </ErrorBoundary>
          }/>
        </Routes>
      </main>

      <div id='floating-player' className='floating-player'>
        <iframe
          width='300'
          height='120'
          frameBorder='0'
          src='https://live365.com/embeds/v1/player/a71526?s=md&m=dark&c=mp3'>
        </iframe>
      </div>
    </div>
  );
}

