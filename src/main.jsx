import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Stage from './Stage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Stage />
  </StrictMode>,
)
