# CookieProof

CookieProof is a mobile-first proof-of-existence cApp built for the **Cookie Chain** SVM.

It lets a user connect **Nightly**, write a short proof message, sign a real transaction, and publish the proof through Cookie Chain's genesis-deployed Solana Memo program. Each confirmed transaction can be opened directly in Cookiescan.

## Live app

https://cookieproof-nine.vercel.app/

## What it demonstrates

- Nightly wallet connection
- Cookie Chain network switching through Nightly
- Cookie Chain RPC reads
- Native COOK balance display
- Real on-chain transaction execution
- Memo-based proof creation
- Transaction confirmation and error feedback
- Cookiescan transaction links
- Mobile-first UI

## Cookie Chain configuration

| Item | Value |
| --- | --- |
| RPC | https://rpc.cookiescan.io |
| WebSocket | wss://wss.cookiescan.io |
| Explorer | https://cookiescan.io |
| Native token | COOK |
| Memo program | MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr |
| Bridge | https://bridge.cookiescan.io |

Cookie Chain is an independent SVM network compatible with standard Solana tooling.

## How the proof transaction works

1. Open the live app in a browser with Nightly installed.
2. Click **Connect Nightly**.
3. Nightly is pointed to Cookie Chain using its SVM network configuration.
4. Enter a proof message.
5. Click **Create on Cookie Chain**.
6. Nightly asks the user to sign the transaction.
7. CookieProof sends the signed transaction to the Cookie Chain RPC.
8. The app waits for confirmed finality and displays a Cookiescan link.

The transaction contains a Memo instruction with the prefix:

`CookieProof: <message>`

The application never asks for or handles a seed phrase or private key.

## Local development

Requirements:

- Node.js 20+
- Nightly browser extension for wallet testing

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

No private environment variables are required.

## Wallet safety

Only sign transactions you understand. CookieProof does not request seed phrases or private keys. A small COOK balance is required for the network fee when creating a proof.

## Why Memo?

The Cookie Chain documentation lists the Solana Memo v1 program as a genesis-deployed ecosystem program. Using the existing Memo program keeps CookieProof simple while creating a real, explorer-verifiable on-chain record without deploying a custom contract.

## Built with

- React
- Vite
- @solana/web3.js
- Cookie Chain RPC
- Nightly Wallet Standard API
- Solana Memo program

## License

MIT
