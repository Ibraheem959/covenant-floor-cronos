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

FELT: `0xb757DBAbf4cc0c93191471e84bdd95201DBDe0a3`  
House: `0xaFa3ab1FC542cda65b14c57A1A5AE5ca494b88cC`

Supra dVRF is not published for Cronos, and Cronos `prevrandao` is zero, so a same-transaction roll would be predictable. Dice, roulette, slots, and plinko lock the bet, then the next block's hash settles it. Each wallet can claim 10,000 FELT once. The house bank started with 20,000,000 FELT. Poker, keno, blackjack, and the other tables still play in the browser until they are cut the same way.

