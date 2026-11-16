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

Connect a wallet on Cronos mainnet (chain 25). The house contract in `contracts/CovenantFloor.sol` is not published until you deploy it and save the address on the House page.
