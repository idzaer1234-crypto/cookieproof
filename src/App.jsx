import { useState, useEffect } from 'react'
import './App.css'

export default function App() {
  const [address, setAddress] = useState('')
  const [message, setMessage] = useState('')
  const [proofs, setProofs] = useState([])

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('cookieproof-records') || '[]')
    setProofs(saved)
  }, [])

  function createProof() {
    if (!address || !message) return alert('กรุณาระบุ Address และข้อความ')
    const record = { id: Date.now(), address, message, date: new Date().toLocaleString() }
    const next = [record, ...proofs]
    setProofs(next)
    localStorage.setItem('cookieproof-records', JSON.stringify(next))
    setMessage('')
  }

  return (
    <main className="page">
      <h1>CookieProof (On-Chain Ready)</h1>
      <input placeholder="วาง Wallet Address ของคุณที่นี่" onChange={(e) => setAddress(e.target.value)} />
      <textarea placeholder="ข้อความที่ต้องการรับรอง" onChange={(e) => setMessage(e.target.value)} />
      <button onClick={createProof}>สร้าง Proof</button>
      
      <h2>หลักฐานของคุณ</h2>
      {proofs.map(p => <div key={p.id} className="card">{p.message} <small>{p.address.slice(0,6)}...</small></div>)}
    </main>
  )
}
