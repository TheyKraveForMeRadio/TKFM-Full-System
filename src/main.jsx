import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import './styles.css'
import initUltraFX from './fx/ultra-engine'
import App from './App.jsx'

// Initialize effects engine (only if needed)
initUltraFX()

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
