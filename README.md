# Covenant Floor · Cronos

The same floor as Covenant Floor, on Cronos. Lottery stays first. FELT is the chip. CRO is only the gas token and the stake lock.

## Tables

Lottery, pay desk, competition, dice, roulette, slots, plinko, keno, baccarat, hi-lo, mines, blackjack, poker, heads-up, shared table, wallet, stakes, tithe, pilgrimage, and the house bank.

## Rules that do not move

- Poker: 5,000 ante plus a 10,000 call returns 30,000 when the player wins with a pair the house qualifies under. Profit is 15,000.
- A net loss splits 15% burned, 5% buyback, 10% to stakers. 70% stays in the house.
- Pay desk: the brief locks first. The other seat submits. 48 hours to pay or return it with a reason. Silence pays the worker.
- House withdrawal is two of three owners, and it takes from the house bank only.

## Play

Two seats share this browser until a Cronos wallet is connected. Switch seats for the pay desk, heads-up, and the shared table. Games take FELT from the vault. Scrolls, packs, and pilgrimage locks take FELT from the wallet.

```bash
npm install
npm run dev
```

Connect an injected wallet on Cronos mainnet (chain 25). That is MetaMask, the Crypto.com Onchain Wallet, or any other wallet that injects `window.ethereum`. It is not StarKey. Gas is CRO.

The chip is a new FELT token (6 decimals) on Cronos. It is not the Supra FELT asset.

Draws are not on chain yet. Supra dVRF 3.0 is the randomness this house is written for (`generateRequest`, then a callback). Cronos is not on Supra's published dVRF network list, so there is no router address to call, and the contract refuses to draw from `prevrandao`. The tables you can click use the same payouts in the browser until that router exists and the house contract is deployed. Save the address on the House page after you publish it.

