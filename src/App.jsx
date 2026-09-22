import { useEffect, useMemo, useState } from 'react'
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import './App.css'

const COOKIE_RPC = 'https://rpc.cookiescan.io'
const COOKIE_EXPLORER = 'https://cookiescan.io'
const MEMO_PROGRAM = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
const STORAGE_KEY = 'cookieproof-records'
const APP_URL = 'https://cookieproof-nine.vercel.app/'

const connection = new Connection(COOKIE_RPC, 'confirmed')

function getNightly() {
  return window?.nightly?.solana
}

function isMobileBrowser() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function openInNightly() {
  const target = encodeURIComponent(APP_URL)
  const universal = `https://nightly.app/v1?network=solana&cluster=mainnet&url=${target}`
  const custom = `nightly://v1?network=solana&cluster=mainnet&url=${target}`
  window.location.href = universal
  setTimeout(() => {
    window.location.href = custom
  }, 1200)
}

function friendlyError(error) {
  const message = error?.message || String(error)
  if (/reject|denied|declined|cancel/i.test(message)) return 'Transaction was rejected in Nightly.'
  if (/insufficient|fund/i.test(message)) return 'Not enough COOK to pay the network fee.'
  return message
}

export default function App() {
  const [account, setAccount] = useState(null)
  const [message, setMessage] = useState('')
  const [records, setRecords] = useState([])
  const [balance, setBalance] = useState(null)
  const [status, setStatus] = useState('idle')
  const [notice, setNotice] = useState('')
  const [networkReady, setNetworkReady] = useState(false)
  const [mobile, setMobile] = useState(false)

  const walletAddress = account?.address || ''
  const connected = Boolean(walletAddress)

  const shortAddress = useMemo(
    () => walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : '',
    [walletAddress]
  )

  useEffect(() => {
    setMobile(isMobileBrowser())
    try {
      setRecords(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
    } catch {
      setRecords([])
    }
  }, [])

  useEffect(() => {
    if (!walletAddress) {
      setBalance(null)
      return
    }
    refreshBalance(walletAddress)
  }, [walletAddress])

  async function refreshBalance(address = walletAddress) {
    try {
      const lamports = await connection.getBalance(new PublicKey(address), 'confirmed')
      setBalance(lamports / 1_000_000_000)
    } catch {
      setBalance(null)
    }
  }

  async function connectNightly() {
    setNotice('')
    setStatus('connecting')

    try {
      const nightly = getNightly()
      if (!nightly) {
        setStatus('idle')
        if (mobile) {
          setNotice('Nightly is not injected in this mobile browser. Tap “Open in Nightly” to continue safely.')
        } else {
          setNotice('Nightly was not detected. Install Nightly or open this page inside the Nightly browser.')
        }
        return
      }

      const genesisHash = await connection.getGenesisHash()
      if (nightly.changeNetwork) {
        await nightly.changeNetwork({ genesisHash, url: COOKIE_RPC })
      }

      const connect = nightly.features?.['standard:connect']?.connect
      if (!connect) {
        throw new Error('This Nightly version does not expose the required Solana Wallet Standard connection feature.')
      }

      const result = await connect()
      const nextAccount = result?.accounts?.[0]
      if (!nextAccount?.address) {
        throw new Error('Nightly did not return a Solana account.')
      }

      setAccount(nextAccount)
      setNetworkReady(true)
      setStatus('idle')
      setNotice('Nightly connected to Cookie Chain.')
    } catch (error) {
      setStatus('idle')
      setNotice(friendlyError(error))
    }
  }

  async function disconnect() {
    try {
      const nightly = getNightly()
      const disconnectFn = nightly?.features?.['standard:disconnect']?.disconnect
      if (disconnectFn) await disconnectFn()
    } catch {
      // Local state is still cleared below.
    }
    setAccount(null)
    setNetworkReady(false)
    setBalance(null)
    setNotice('')
  }

  async function createProof() {
    const text = message.trim()
    if (!connected) {
      setNotice('Connect Nightly first.')
      return
    }
    if (!text) {
      setNotice('Enter a message to create a proof.')
      return
    }
    if (text.length > 500) {
      setNotice('Proof message must be 500 characters or less.')
      return
    }

    setStatus('signing')
    setNotice('Preparing Cookie Chain transaction...')

    try {
      const publicKey = new PublicKey(walletAddress)
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')

      const instruction = new TransactionInstruction({
        programId: MEMO_PROGRAM,
        keys: [],
        data: new TextEncoder().encode(`CookieProof: ${text}`),
      })

      const transaction = new Transaction({
        feePayer: publicKey,
        recentBlockhash: blockhash,
      }).add(instruction)

      const signTransaction = getNightly()?.features?.['standard:signTransaction']?.signTransaction
      if (!signTransaction) {
        throw new Error('Nightly signing is unavailable. Update Nightly and try again.')
      }

      const unsigned = transaction.serialize({ requireAllSignatures: false, verifySignatures: false })
      const signed = await signTransaction({
        account,
        transaction: unsigned,
      })

      const signedBytes = signed?.[0]?.signedTransaction
      if (!signedBytes) {
        throw new Error('Nightly returned no signed transaction.')
      }

      setStatus('confirming')
      setNotice('Transaction signed. Waiting for Cookie Chain confirmation...')

      const signature = await connection.sendRawTransaction(signedBytes, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        'confirmed'
      )

      const record = {
        id: Date.now(),
        message: text,
        address: walletAddress,
        signature,
        date: new Date().toISOString(),
      }

      const next = [record, ...records]
      setRecords(next)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setMessage('')
      setStatus('idle')
      setNotice('Proof confirmed on Cookie Chain.')
      refreshBalance()
    } catch (error) {
      setStatus('idle')
      setNotice(friendlyError(error))
    }
  }

  return (
    <main className="page">
      <nav className="nav">
        <a className="brand" href="/">
          <span className="cookie">🍪</span>
          CookieProof
        </a>
        <div className="network">
          <i />
          Cookie Chain
        </div>
      </nav>

      <section className="hero">
        <div className="eyebrow">ON-CHAIN PROOF OF EXISTENCE</div>
        <h1>Make a proof.<br /><span>Put it on-chain.</span></h1>
        <p>
          CookieProof turns a short message into a permanent Cookie Chain Memo transaction.
          Connect Nightly, sign once, and verify the proof on Cookiescan.
        </p>
      </section>

      <section className="workspace">
        <div className="card composer">
          <div className="cardHeading">
            <div>
              <span className="step">01</span>
              <h2>Create a proof</h2>
            </div>
            <span className="limit">{message.length}/500</span>
          </div>

          <textarea
            value={message}
            maxLength={500}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="What do you want to prove existed?"
          />

          <div className="privacy">
            <span>●</span>
            <span>Only the message and your public wallet address are written to the blockchain. Never enter a seed phrase or private key.</span>
          </div>

          <button
            className="primary"
            onClick={createProof}
            disabled={!connected || status === 'signing' || status === 'confirming'}
          >
            <span>
              {status === 'signing' ? 'Waiting for Nightly…'
                : status === 'confirming' ? 'Confirming on-chain…'
                : 'Create on Cookie Chain'}
            </span>
            <span>→</span>
          </button>

          {notice && <div className="notice">{notice}</div>}
        </div>

        <aside className="card side">
          <div className="step">WALLET</div>
          <h2>{connected ? 'Connected' : 'Not connected'}</h2>

          {!connected ? (
            <>
              {mobile && (
                <button className="secondary mobileNightly" onClick={openInNightly}>
                  Open in Nightly
                </button>
              )}
              <button className="secondary" onClick={connectNightly}>
                Connect Nightly
              </button>
              {mobile && (
                <p className="mobileHint">On Android, opening the app in Nightly lets the wallet inject securely into the dApp.</p>
              )}
            </>
          ) : (
            <>
              <div className="walletBox">
                <span>Address</span>
                <strong>{shortAddress}</strong>
                <code>{walletAddress}</code>
              </div>
              <div className="balance">
                <span>COOK balance</span>
                <strong>{balance === null ? '—' : `${balance.toFixed(6)} COOK`}</strong>
              </div>
              <button className="secondary" onClick={disconnect}>Disconnect</button>
            </>
          )}

          <div className="chainInfo">
            <div><span>Network</span><strong>Cookie Chain</strong></div>
            <div><span>RPC</span><strong>rpc.cookiescan.io</strong></div>
            <div><span>Memo program</span><strong>Memo v1</strong></div>
            <div><span>Network status</span><strong>{networkReady ? 'Ready' : '—'}</strong></div>
          </div>
        </aside>
      </section>

      <section className="records">
        <div className="sectionTitle">
          <div>
            <span className="step">02</span>
            <h2>Your proofs</h2>
          </div>
          <span>{records.length} local record{records.length === 1 ? '' : 's'}</span>
        </div>

        {records.length === 0 ? (
          <div className="empty">
            <span>◌</span>
            <h3>No proofs yet</h3>
            <p>Connect Nightly, write a message, and create your first on-chain proof.</p>
          </div>
        ) : (
          <div className="recordList">
            {records.map((record) => (
              <article className="record" key={record.id}>
                <div className="recordIcon">✓</div>
                <div className="recordBody">
                  <p>{record.message}</p>
                  <div className="meta">
                    <span className="status">Confirmed</span>
                    <span>{new Date(record.date).toLocaleString()}</span>
                    <span>{record.address.slice(0, 8)}…</span>
                  </div>
                  <code>{record.signature}</code>
                </div>
                <a
                  className="copy"
                  href={`${COOKIE_EXPLORER}/tx/${record.signature}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Cookiescan ↗
                </a>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer>
        <span>CookieProof · Built for Cookie Chain</span>
        <strong>Never share your private key.</strong>
      </footer>
    </main>
  )
}
