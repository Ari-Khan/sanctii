import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthProvider from './auth/AuthProvider'
import App from './App.jsx'
import Doctor from './pages/Doctor.jsx'
import Patient from './pages/Patient.jsx'
import './index.css'
import './App.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/doctor" element={<Doctor />} />
          <Route path="/patient" element={<Patient />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
