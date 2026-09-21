import { useEffect, useState } from 'react'
import './App.css'

const shorten = (value) =>
  value ? `${value.slice(0, 10)}...${value.slice(-8)}` : ''

async function sha256(value) {
  const data = new TextEncoder().encode(value)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export default function App() {
  const [message, setMessage] = useState('')
  const [proofs, setProofs] = useState([])
  const [working, setWorking] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('cookieproof-records') || '[]')
      setProofs(saved)
    } catch {
      setProofs([])
    }
  }, [])

  async function createProof() {
    const cleanMessage = message.trim()

    if (!cleanMessage) {
      setNotice('กรุณาใส่ข้อความที่ต้องการรับรอง')
      return
    }

    setWorking(true)
    setNotice('กำลังสร้างหลักฐาน...')

    try {
      const createdAt = new Date().toISOString()
      const hash = await sha256(`${cleanMessage}|${createdAt}`)
      const record = {
        id: crypto.randomUUID(),
        message: cleanMessage,
        hash,
        createdAt,
        status: 'Local proof',
      }

      const nextProofs = [record, ...proofs]
      setProofs(nextProofs)
      localStorage.setItem('cookieproof-records', JSON.stringify(nextProofs))
      setMessage('')
      setNotice('สร้างหลักฐานสำเร็จแล้ว')
    } catch {
      setNotice('สร้างหลักฐานไม่สำเร็จ กรุณาลองอีกครั้ง')
    } finally {
      setWorking(false)
    }
  }

  async function copyHash(hash) {
    await navigator.clipboard.writeText(hash)
    setNotice('คัดลอก Proof Hash แล้ว')
  }

  return (
    <main className="page">
      <nav className="nav">
        <a className="brand" href="#">
          <span className="cookie">🍪</span>
          <span>CookieProof</span>
        </a>
        <span className="network">
          <i />
          Demo mode
        </span>
      </nav>

      <section className="hero">
        <div className="eyebrow">PROOF-OF-EXISTENCE</div>
        <h1>
          Make your proof
          <span> impossible to forget.</span>
        </h1>
        <p>
          สร้างลายนิ้วมือดิจิทัลสำหรับข้อความหรือหลักฐาน
          พร้อมเวลาที่ตรวจสอบย้อนหลังได้
        </p>
      </section>

      <section className="workspace">
        <div className="composer card">
          <div className="cardHeading">
            <div>
              <span className="step">01</span>
              <h2>สร้างหลักฐาน</h2>
            </div>
            <span className="limit">{message.length}/280</span>
          </div>

          <textarea
            maxLength="280"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="พิมพ์ข้อความที่ต้องการรับรอง เช่น ฉันสร้างผลงานนี้เมื่อ..."
          />

          <div className="privacy">
            <span>🔒</span>
            เวอร์ชันนี้สร้าง Proof Hash และไม่เผยแพร่ข้อความออกจากเครื่อง
          </div>

          <button
            className="primary"
            disabled={working}
            onClick={createProof}
          >
            {working ? 'กำลังสร้าง...' : 'สร้าง Proof'}
            <span>→</span>
          </button>

          {notice && <div className="notice">{notice}</div>}
        </div>

        <aside className="side card">
          <span className="step">02</span>
          <h2>สถิติของคุณ</h2>

          <div className="stat">
            <strong>{proofs.length}</strong>
            <span>หลักฐานทั้งหมด</span>
          </div>

          <div className="chainInfo">
            <div>
              <span>Network</span>
              <strong>Cookie Chain</strong>
            </div>
            <div>
              <span>Hash</span>
              <strong>SHA-256</strong>
            </div>
            <div>
              <span>Storage</span>
              <strong>Local demo</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="records">
        <div className="sectionTitle">
          <div>
            <span className="step">03</span>
            <h2>หลักฐานล่าสุด</h2>
          </div>
          <span>{proofs.length} records</span>
        </div>

        {proofs.length === 0 ? (
          <div className="empty">
            <span>◎</span>
            <h3>ยังไม่มีหลักฐาน</h3>
            <p>สร้าง Proof แรกของคุณจากช่องด้านบน</p>
          </div>
        ) : (
          <div className="recordList">
            {proofs.map((proof) => (
              <article className="record" key={proof.id}>
                <div className="recordIcon">✓</div>
                <div className="recordBody">
                  <p>{proof.message}</p>
                  <div className="meta">
                    <span>{new Date(proof.createdAt).toLocaleString('th-TH')}</span>
                    <span className="status">{proof.status}</span>
                  </div>
                  <code>{shorten(proof.hash)}</code>
                </div>
                <button
                  className="copy"
                  onClick={() => copyHash(proof.hash)}
                  aria-label="Copy proof hash"
                >
                  คัดลอก
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer>
        <strong>CookieProof</strong>
        <span>Built for Cookie Chain</span>
      </footer>
    </main>
  )
}
