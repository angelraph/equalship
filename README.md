# Equalship

Save together, own together.

Equalship is a savings circle on Robinhood Chain. A group of friends agree on an amount, put that much USDG in every week, and each payment buys a basket of Stock Tokens straight into each member's own wallet. $WIF holds the group together: you bond it to join, you lose part of it when you skip a week, you burn it to vote on the basket, and a fee on every payment buys it back and burns it.

Built for the World is Flat hackathon.

## The problem

Most people never start investing because the first step is lonely and easy to put off. Savings circles (tontines, susu, chit funds, ajo) have solved that for generations in places where banks did not: you save because the group expects you to. Robinhood Chain now has Stock Tokens that anyone in an eligible region can hold in a wallet. Equalship puts the two together.

For $WIF, the problem is the opposite. Its one proven use is voting on World is Fair. Most other hackathon projects use it as a stake in a bet. Equalship gives it a job that repeats every week for as long as people keep saving.

## How it works

1. **Start or join a circle.** The circle sets the amount (from 1 USDG), the period (hourly for demos, daily, weekly, every two weeks), the $WIF bond, the slash rate, and a basket of up to five assets.
2. **Bond $WIF.** Joining locks the bond. A friend can pay it for you with `joinFor`, so someone with no $WIF can still start.
3. **Save every period.** `contribute` takes your USDG, keeps a 1% fee, and swaps the rest on Uniswap v3 into each basket asset with your wallet as the recipient. The contract never holds your Stock Tokens.
4. **Keep the streak.** Each paid period adds to your streak. When a period closes unpaid, anyone can call `slash`. Part of the bond is taken: half is burned, half is shared by the members who stayed.
5. **Vote on the basket.** Members propose a new basket and vote by burning $WIF, 1 $WIF per vote. A proposal passes if more $WIF is burned for it than against it and at least half the members vote yes.
6. **Burn.** A daily job swaps the collected fees for $WIF along USDG, WETH, $WIF and sends it to `0x...dEaD`.

## The flywheel

```
save weekly  >  Stock Tokens in your wallet  >  1% fee buys and burns $WIF
     ^                                                   |
     |                                                   v
invite friends  <  public streaks  <  missed weeks burn bonds and reward stayers
```

Every part of the loop that touches $WIF either locks it (bonds) or removes it (fees, slashes, votes). None of it depends on someone losing a bet.

## Proof of Commitment

Every payment updates a public profile per wallet: periods paid, best streak, missed periods, total saved, last payment. Any contract can call:

```solidity
function isCommitted(address account, uint32 minPaid, uint32 minStreak, uint64 maxIdle) external view returns (bool);
```

World is Fair currently checks for farmed votes offchain after voting closes. A vote that requires `isCommitted(voter, 4, 4, 8 days)` filters farmed wallets at the moment the vote is cast, because a month of real weekly payments is expensive to fake.

## Contracts

| | |
| :- | :- |
| Chain | Robinhood Chain mainnet, chain id 4663 |
| Equalship | [`0x3B5598d1bEBfeDF9a8E19526F728e3184a5F6A92`](https://robinhoodchain.blockscout.com/address/0x3B5598d1bEBfeDF9a8E19526F728e3184a5F6A92) |
| USDG | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` |
| $WIF | `0x5173b8eA6923c2d40267890D45C46a3480954773` |
| Uniswap SwapRouter02 | `0xCaf681a66D020601342297493863E78C959E5cb2` |
| Uniswap QuoterV2 | `0x33e885eD0Ec9bF04EcfB19341582aADCb4c8A9E7` |
| Multicall3 | `0xcA11bde05977b3631167028862bE2a173976CA11` |

Live app: [equalship.vercel.app](https://equalship.vercel.app)

### Mainnet transactions

| What | Transaction |
| :- | :- |
| Deploy Equalship | [`0xd07ee961...`](https://robinhoodchain.blockscout.com/tx/0xd07ee96119a275617de1081b1e0814c4a5e8f4091f9113cd0a76a6e886db4177) |
| Approve $WIF for the bond | [`0x856935fb...`](https://robinhoodchain.blockscout.com/tx/0x856935fb0ae8b11f6159f02f2610662ceae1fbb5b64b9c4e092b97b6b5f7e7b3) |
| Approve USDG | [`0x2152eb8b...`](https://robinhoodchain.blockscout.com/tx/0x2152eb8be9b2c3b65927c6cf64d5ce56c8053eb5cf0b96262dcd5c237930a2d4) |
| Create circle #0 and lock 1,000 $WIF | [`0x027a66c8...`](https://robinhoodchain.blockscout.com/tx/0x027a66c86c2ea7db6dc4be3ce848ff0e6afffec7ed80043271e4e6f83b6cf129) |
| First save: 1 USDG buys NVDA and SPY into the member's wallet | [`0xe95d12f9...`](https://robinhoodchain.blockscout.com/tx/0xe95d12f9a850b27e80700a42045af21b669f14fa5b77e4f7fe137021e967ea2a) |

Stock Token addresses come from `api.robinhood.com/rhj/assets`. Pool fee tiers were picked from the deepest USDG pool for each token on 7 Nov 2026.

Design choices:

* One contract holds every circle, so a new circle costs one transaction.
* Basket swaps send output directly to the member. No pooled custody, no shares, no withdrawal step.
* Slash rewards use an accumulator, so slashing is O(1) no matter how many members a circle has.
* `buyAndBurn` is limited to the keeper so nobody can force a burn with a minimum output of zero and sandwich it.
* The fee is capped at 2% in code.

## Repository

```
contracts/    Foundry project: Equalship.sol, tests, deploy script
src/app/      Next.js app: circles, circle page, Proof of Commitment, burn cron
src/lib/      chain config, ABI, hooks
scripts/      ABI export
```

## Run it

Contracts:

```bash
cd contracts
forge test
ROBINHOOD_RPC_URL=https://rpc.mainnet.chain.robinhood.com forge test --match-contract Fork -vv
```

The fork test buys real NVDA and SPY Stock Tokens from mainnet pools and burns real $WIF from the fee pool.

Deploy:

```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url https://rpc.mainnet.chain.robinhood.com --broadcast --interactive
```

`--interactive` makes forge ask for the key at a hidden prompt, so it never sits in an environment variable or shell history. The deployer becomes the keeper for the daily burn.

Create a demo circle and make the first save (needs 1 USDG and 1000 $WIF in the wallet):

```bash
forge script script/DemoCircle.s.sol --sig "run(address)" 0xEQUALSHIP --rpc-url https://rpc.mainnet.chain.robinhood.com --broadcast --interactive
```

App:

```bash
cp .env.example .env.local   # set NEXT_PUBLIC_EQUALSHIP_ADDRESS
npm install
npm run dev
```

## Regions

Stock Tokens are not offered to US persons and are restricted in some countries. The app asks every buyer to confirm their eligibility before a basket with Stock Tokens buys anything, and any circle can use a WETH basket instead.

## Disclaimer

Equalship is an independent project. It is not affiliated with, endorsed by, or sponsored by Robinhood Markets, Inc. Nothing here is investment advice. $WIF comes with no promise of value or return.

## License

MIT
