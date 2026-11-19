# Developer notes

Players do not see this file. The site copy is the rules of the floor. This file is how the Cronos deployment actually works.

## What is live

Chain 25, Cronos mainnet.

- FELT `0x03b9d039e4a9de5c89c43b5917a39daacedea391` — the launched token. Name `Covenant Floor(FELT)`, symbol `FELT`, 18 decimals. No drip and no burn function.
- Floor `0x828D84Ec3Ca9B307be03aD1658a6D98Bf2C4c269`. The earlier floor and the earlier token are not used. The house bank starts at 0.

On the contract, and wired to the wallet:

- Deposit and withdraw. The vault is credited with the amount the contract actually receives.
- Dice, roulette, slots, plinko
- Lottery: pay a scroll, burn a scroll, draw
- Pay desk: post, submit, pay, return with a reason, silence after 48 hours, cancel
- House bank withdrawal, two of three owners, bank only

The client still plays keno, baccarat, hi-lo, mines, blackjack, poker, heads-up, the shared table, stakes, tithe, pilgrimage, and the competition with the same numbers as the Supra floor. Those tables are not in this contract. A connected wallet is stopped before it can treat a browser result as a Cronos balance. Poker on the contract reverts on purpose (`that table is not on this cut`) so a half-dealt hand cannot take a wager.

## Randomness

Supra's published dVRF network list, checked 17 November 2026, does not include Cronos. There is no router address to call. `block.prevrandao` on Cronos is zero, so a roll inside the betting transaction would be predictable.

A bet is locked in block N. Settlement reads `blockhash(N)` from a later transaction, within 256 blocks. The player cannot change the wager after that hash exists. That is the Cronos mechanism. It is not dVRF, and the site does not say that it is.

## Owners

The three owner addresses are public. Private keys are not in the repository.

1. `0xD4cEE444652CB3948FDc788c7Be4282ec6D3A258` — deployer, holds the gas CRO
2. `0x3272C8EAFdf90eE8fFa24f270cE23C6De92146F1`
3. `0x9aED174209c7a16D113682519aB8078610189568`

`proposeWithdraw`, then a second `approveWithdraw`, then `executeWithdraw`. One signature cannot send. `rejectWithdraw` clears the proposal. The House page shows those buttons only to a connected owner.

## Checks

`npx hardhat run /tmp/hh/run.cjs` deploys the exact creation bytecode that is on mainnet and checks:

- Runtime code matches mainnet once embedded addresses are ignored
- Dice, roulette, slots, and plinko conserve vault + bank + burn + buyback + stakers
- A net loss skims 15% / 5% / 10%
- A winning payout does not skim
- Scroll draw pays 90% and carries 10%
- Pay desk pay, return, cancel, and 48-hour silence
- House withdrawal requires two owners

The browser bank, vault, burned, buyback, and staker figures are `eth_call` reads. They are not the practice chips.
