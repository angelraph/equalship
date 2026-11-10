# Equalship

**Save together. Own together.**

Equalship is a savings circle that lives on Robinhood Chain. A group of friends agrees on an amount and a schedule. Every period each member saves once, by hand or automatically, and the save is swapped on Uniswap into a basket of Stock Tokens that lands straight in their own wallet. You can join and save with nothing but ETH. $WIF holds the group together: every new member buys a $WIF bond from the market, you burn $WIF to vote, and 1% of every save buys $WIF back and destroys it with the token's own `burn()`, so total supply goes down.

**[Live app: equalship.vercel.app](https://equalship.vercel.app)** · **[Try it in 3 minutes](#try-it-in-3-minutes)** · [Contract on Blockscout](https://robinhoodchain.blockscout.com/address/0x9598099B23e55Ad319002f6A1Ba54EF481FCeB3F) · [Verified source](https://repo.sourcify.dev/4663/0x9598099B23e55Ad319002f6A1Ba54EF481FCeB3F) · [Submission](SUBMISSION.md) · [Security review](SECURITY.md) · [How the video was made](video/README.md)

[![Equalship: save together, own together](media/demo-thumbnail.jpg)](https://equalship.vercel.app)

*The demo film (2:54, narrated, captioned) is generated from this repository by the pipeline in [video/](video/README.md).*

Built for the **World is Flat** hackathon on Robinhood Chain.

## At a glance

| | |
| :- | :- |
| Network | Robinhood Chain mainnet, chain id 4663 |
| Contract | [`0x9598099B23e55Ad319002f6A1Ba54EF481FCeB3F`](https://robinhoodchain.blockscout.com/address/0x9598099B23e55Ad319002f6A1Ba54EF481FCeB3F), source verified (exact match) |
| What it buys | NVDA, AAPL, TSLA, MSFT, SPY, QQQ Stock Tokens and WETH, through Uniswap v3 |
| $WIF used for | Bond bought from the market on join, vote burn, buyback and burn, optional slash burn. Every burn calls `WIF.burn()` and lowers total supply |
| Pay with | ETH only, or USDG and $WIF directly |
| Custody | None. Stock Tokens go to the member's wallet in the same transaction. Bonds come back in full on leave in no slash circles |
| App | 18 page types, live prices and charts, multi wallet, auto-save, calendar reminders, dark and light, mobile |
| Tests | 21 unit and fuzz tests, plus a mainnet fork test of the full v2 loop |

## Contents

* [The idea in one minute](#the-idea-in-one-minute)
* [Live on Robinhood Chain mainnet](#live-on-robinhood-chain-mainnet)
* [Why Equalship](#why-equalship)
* [Try it in 3 minutes](#try-it-in-3-minutes)
* [Product tour](#product-tour)
* [How it works](#how-it-works)
* [The $WIF flywheel](#the-wif-flywheel)
* [Proof of Commitment](#proof-of-commitment)
* [Architecture](#architecture)
* [Design and user experience](#design-and-user-experience)
* [Verification and security](#verification-and-security)
* [Build log](#build-log)
* [Quickstart for developers](#quickstart-for-developers)
* [Repository layout](#repository-layout)
* [Documentation](#documentation)
* [Risks](#risks)
* [License](#license)

## The idea in one minute

* Most people never start investing. The first step is lonely and easy to put off.
* Savings circles fixed that for generations, under many names: tontine, susu, ajo, chit fund, tanda. You save because your group expects you to.
* Robinhood Chain now has Stock Tokens that anyone in an eligible region can hold in a wallet.
* Equalship puts the two together, and gives $WIF a job that repeats every week for as long as people keep saving.

| Savings circle habit | In Equalship |
| :- | :- |
| Everyone puts in the same amount | `contribute` takes the circle amount in USDG once per period |
| The pot buys something together | Each save buys the circle's basket of Stock Tokens into the saver's own wallet |
| Skipping lets the group down | A missed period resets your streak. Circles that opt in also slash the bond: half burned, half to the members who paid |
| The group decides together | Members change the basket by burning $WIF as votes |
| Everyone knows who is reliable | Every save builds a public Proof of Commitment record |

## Live on Robinhood Chain mainnet

**Contracts**

| Contract | Address |
| :- | :- |
| Equalship | [`0x9598099B23e55Ad319002f6A1Ba54EF481FCeB3F`](https://robinhoodchain.blockscout.com/address/0x9598099B23e55Ad319002f6A1Ba54EF481FCeB3F) |
| USDG | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` |
| $WIF | `0x5173b8eA6923c2d40267890D45C46a3480954773` |
| Uniswap SwapRouter02 | `0xCaf681a66D020601342297493863E78C959E5cb2` |
| Uniswap QuoterV2 | `0x33e885eD0Ec9bF04EcfB19341582aADCb4c8A9E7` |
| Multicall3 | `0xcA11bde05977b3631167028862bE2a173976CA11` |

**Key transactions**

| Event | Transaction |
| :- | :- |
| Deploy Equalship v2 | [`0x9f23df69...`](https://robinhoodchain.blockscout.com/tx/0x9f23df69e481a22a4c8252832e85bb769620244cdea9e391a774aaa39872f64a) |
| Approve 5 $WIF for the bond | [`0x3ed32ed6...`](https://robinhoodchain.blockscout.com/tx/0x3ed32ed69902c11f0fd025f7e1bc0a98155a414095b52658527a5f0ebd4a0b29) |
| Create circle #0, "WIF Holders Savings Circle", daily, never slashes | [`0x95a36d5f...`](https://robinhoodchain.blockscout.com/tx/0x95a36d5f295014c0d9bed2d325386d089130be7cfa8a65a3c3f088ae839d0c5a) |
| First save paid with ETH only: ETH becomes 1 USDG, which buys Stock Tokens into the member's wallet | [`0xd26a4162...`](https://robinhoodchain.blockscout.com/tx/0xd26a4162f550fedaf84984ebf80c1dac018d6a150421b5aa618395d36fb69b11) |

Equalship v1 ([`0x3B5598d1...`](https://robinhoodchain.blockscout.com/address/0x3B5598d1bEBfeDF9a8E19526F728e3184a5F6A92)) stays onchain as history. Its first save is [`0xe95d12f9...`](https://robinhoodchain.blockscout.com/tx/0xe95d12f9a850b27e80700a42045af21b669f14fa5b77e4f7fe137021e967ea2a). v2 replaced it with real supply burns, ETH payments, auto-save, a grace window and no slash circles.

## Why Equalship

| | |
| :- | :- |
| **A real reason to use $WIF** | $WIF is the cost of quitting and the reward for staying, not a stake in a bet. Every part of a circle locks it or burns it. |
| **A flywheel that holds up** | Saving is a weekly habit, so the burn is weekly too. Demand grows with the number of savers, not with someone losing. |
| **Puts Stock Tokens to work** | Small, regular buys of NVDA, AAPL or the S&P 500, the way most people should build a position. |
| **Brings new people in** | One token is enough: join and save with ETH. Start from 1 USDG a day. A friend can pay your bond. |
| **Runs itself** | Turn on auto-save and the keeper saves for you each period, from an allowance you set and can remove any time. |
| **Never holds your money** | Swaps send output to the member in the same transaction. In a no slash circle your bond comes back in full whenever you leave. |
| **Useful beyond itself** | Proof of Commitment gives every app on Robinhood Chain a cheap filter for real people. |
| **Built in the open** | Source verified onchain, tested on real mainnet state, every line on GitHub. |

## Try it in 3 minutes

You need a browser wallet on Robinhood Chain (chain id 4663) with a little ETH. That is all: the app can buy the $WIF bond and the USDG save for you.

1. **Look around, no wallet needed (1 minute).** Open [equalship.vercel.app](https://equalship.vercel.app). The numbers under the ticker are read live from the contract. Open [Markets](https://equalship.vercel.app/markets) and click any asset for its live chart.
2. **See the live circle.** Open [Circle #0](https://equalship.vercel.app/circle/0), the WIF Holders Savings Circle. You will see its members, streaks, what it buys and when the period closes. It never slashes, so the bond is always refundable.
3. **Check a wallet's record.** Open [Proof of Commitment](https://equalship.vercel.app/proof) or [World is Fair](https://equalship.vercel.app/fair) and paste addresses.
4. **Join and save with ETH (2 minutes).** Click Connect wallet. On the circle page keep Pay with on ETH, press Join, then Save. The app quotes first. Extra $WIF or USDG from the swap comes back to you, and the Stock Tokens arrive in your wallet in the same transaction.
5. **Let it run.** Turn on Auto-save, and add the reminders to your calendar.
6. **Or start your own.** On [Circles](https://equalship.vercel.app/circles), pick a name, an amount, a daily or weekly schedule, a bond and a basket, and press Create.

Prefer the terminal? Read the live state from any machine:

```bash
RPC=https://rpc.mainnet.chain.robinhood.com
SHIP=0x9598099B23e55Ad319002f6A1Ba54EF481FCeB3F
cast call $SHIP "circleCount()(uint256)" --rpc-url $RPC
cast call $SHIP "totalSaved()(uint256)" --rpc-url $RPC          # USDG, 6 decimals
cast call $SHIP "totalBonded()(uint256)" --rpc-url $RPC         # $WIF, 18 decimals
cast call $SHIP "profileOf(address)((uint32,uint32,uint32,uint32,uint64,uint64,uint128))" 0xe1a19fbc9608be13b92da24dd4919589900db567 --rpc-url $RPC
```

## Product tour

The app has a landing page, the circle pages, live markets, the $WIF page, Proof of Commitment, and Learn and legal pages. Every page works in dark and light themes and on phones.

**Landing page.** A live price ticker, numbers read from the contract, three steps, a product carousel, live market cards, the security grid and an FAQ preview.

[![Landing page](media/home.jpg)](media/home.jpg)

**Markets.** Every asset a circle can buy, with live price, 24 hour change and range, pool volume and a trend line.

[![Markets](media/markets.jpg)](media/markets.jpg)

**Asset page.** An interactive chart with a hover crosshair, bid and ask, the token contract, and a button to save into it.

[![Asset page](media/asset.jpg)](media/asset.jpg)

**Circles.** Every circle onchain, how full it is, and the form to start one with a basket picker.

[![Circles](media/circles.jpg)](media/circles.jpg)

**Circle page.** Members, streaks and bonds, the period countdown, save, claim, leave, slash, invite and sponsor a friend, and the basket vote.

[![Circle page](media/circle.jpg)](media/circle.jpg)

**$WIF.** The live $WIF price, what Equalship has burned and from where, how much is bonded, and the loop.

[![$WIF page](media/wif.jpg)](media/wif.jpg)

**Proof of Commitment.** Any wallet's savings record and the default committed saver check.

[![Proof of Commitment](media/proof.jpg)](media/proof.jpg)

**Security and FAQ.** What the contract can and cannot do, what your wallet will ask you to sign, and straight answers.

[![Security](media/security.jpg)](media/security.jpg)

## How it works

```mermaid
flowchart LR
  A[Member] -->|ETH buys $WIF bond| B[Join circle]
  B -->|each period, by hand or auto-save| C[contribute]
  C -->|1% USDG| F[Fee pool]
  C -->|99% USDG| U[Uniswap v3]
  U -->|Stock Tokens| A
  F -->|daily keeper| W[Buy $WIF]
  W --> D[WIF.burn: supply falls]
  B -->|period missed, slash circles only| S[slash]
  S -->|half| D
  S -->|half| R[Members who paid]
```

### 1. A circle

`createCircle(name, contribution, bond, period, maxMembers, slashBps, legs)` sets the amount in USDG, the period, the $WIF bond, the slash rate (0 means the circle never slashes) and a basket of up to five legs. A leg is a token, a weight in basis points and a Uniswap v3 path from USDG to the token. The creator joins as the first member. `joinWithETH(circleId, minWifOut)` buys the bond on the WETH and $WIF pool and refunds anything above it.

### 2. A save

`contribute(circleId, minOuts)` takes the contribution, keeps 1% in the fee pool, and swaps the rest leg by leg with the member as recipient. `contributeWithETH` first swaps ETH to USDG and refunds any extra. `minOuts` comes from a live QuoterV2 quote with a slippage limit, so a save fails instead of filling at a bad price. A member who calls `setAutoSave(circleId, true)` lets the keeper call `contributeFor` for them each period, from their own USDG allowance, with the output still going to them.

### 3. A miss

A period counts as missed only after a grace window of a quarter period. In a no slash circle a miss resets the streak and nothing else. In a circle with a slash rate, anyone can call `slash(circleId, member)`: half of the penalty is burned and half is shared with the other members through an accumulator.

### 4. A vote

`proposeBasket` opens a vote for two periods (at least one day). `vote` burns the $WIF a member puts behind yes or no. `executeBasket` applies the basket if more $WIF was burned for it than against it and at least half of the members voted yes.

### 5. The burn

`buyAndBurn(path, amountIn, minWifOut)` swaps the fee pool along USDG, WETH, $WIF and calls `WIF.burn()` on the output, so total supply drops. Only the keeper can call it, so nobody can force a burn with a zero minimum and sandwich it. A daily Vercel cron runs auto-saves and then the burn.

## The $WIF flywheel

```mermaid
flowchart LR
  S[Save weekly] --> O[Own Stock Tokens]
  O --> B[1% fee buys and burns $WIF]
  B --> P[Public streaks]
  P --> I[Invite friends]
  I --> S
  I --> J[New member buys a $WIF bond]
  J --> S
```

| Path | What happens to $WIF |
| :- | :- |
| Join | Every new member's ETH buys the bond from the market |
| Bond | Locked for as long as a member saves |
| Fee buyback | 1% of every save buys $WIF and burns it |
| Missed period (slash circles) | Half of the penalty is burned, half rewards the members who paid |
| Basket vote | Every vote is burned, 1 $WIF per vote |

## Proof of Commitment

Every save updates a public profile per wallet: periods paid, best streak, missed periods, total saved, circles joined, first and last payment. Any contract can ask:

```solidity
function isCommitted(address account, uint32 minPaid, uint32 minStreak, uint64 maxIdle) external view returns (bool);

// only count wallets that saved 4 periods in a row and paid within 8 days
require(IEqualship(EQUALSHIP).isCommitted(voter, 4, 4, 8 days), "not a committed saver");
```

World is Fair checks for farmed votes offchain after voting closes. With this check, a vote can require a committed saver at the moment it is cast, because a month of real payments is expensive to fake. The [/fair](https://equalship.vercel.app/fair) page checks a whole voter list at once, and `GET /api/commitment/<address>` returns the same record as public JSON.

## Architecture

```mermaid
flowchart LR
  subgraph Browser
    UI[Next.js app] --> WL[Wallet layer, EIP-6963]
    UI --> RQ[React Query reads]
  end
  subgraph Vercel
    API[/api/market/] --> RH[Robinhood Chain pricing API]
    API --> DP[DexPaprika pool candles]
    CRON[/api/keeper daily/] --> K[Keeper wallet]
    CA[/api/commitment/]
  end
  subgraph Robinhood Chain
    EQ[Equalship] --> UNI[Uniswap v3 SwapRouter02]
    MC[Multicall3]
  end
  WL --> EQ
  RQ --> MC --> EQ
  UI --> API
  K --> EQ
```

| Component | What it does |
| :- | :- |
| [`contracts/src/Equalship.sol`](contracts/src/Equalship.sol) | Circles, ETH join and save, auto-save, slashing, rewards, basket votes, buyback and burn, Proof of Commitment |
| [`src/lib/wallet.tsx`](src/lib/wallet.tsx) | Wallet discovery (EIP-6963), connect, switch chain, disconnect, typed reads and writes on viem |
| [`src/lib/market.ts`](src/lib/market.ts) | Live quotes and 24 hour candles for every asset |
| [`src/app/api/keeper/route.ts`](src/app/api/keeper/route.ts) | The daily auto-saves and the buyback and burn |
| [`src/app/api/commitment/[address]/route.ts`](src/app/api/commitment/%5Baddress%5D/route.ts) | Public Proof of Commitment JSON |
| [`video/`](video/README.md) | The demo film pipeline |

## Design and user experience

* **One look across the app.** Space Grotesk headlines with a serif accent, Plus Jakarta Sans for reading, JetBrains Mono for numbers, the brand purple, rounded panels and pill buttons.
* **Dark and light.** Dark by default, one click to light, saved per browser with no flash on load.
* **Every wallet.** Every installed wallet is detected and listed. The account menu copies the address, opens it on Blockscout, switches wallet or disconnects for real.
* **Live everywhere.** Prices, charts and contract numbers refresh on their own, with a live dot so you know.
* **Phones first.** Every page is checked at phone width with no sideways scrolling.
* **Honest by default.** Region notice before any Stock Token buy, exact approvals, and a plain words risk page.

## Verification and security

| Check | Result |
| :- | :- |
| Source verification | Exact match for creation and runtime bytecode on [Sourcify](https://repo.sourcify.dev/4663/0x9598099B23e55Ad319002f6A1Ba54EF481FCeB3F) |
| Unit and fuzz tests | 21 passing (`forge test`) |
| Mainnet fork test | ETH join buys real $WIF, ETH save and keeper auto-save buy real Stock Tokens, `buyAndBurn` lowers `WIF.totalSupply()`, both members get full bonds back |
| Dry run | Deploy and flagship circle rehearsed on a copy of mainnet as the real deployer wallet |
| Web security | Strict Content Security Policy, no framing, HSTS, `security.txt` |

Security properties of the contract:

* Never holds a member's Stock Tokens.
* Approvals are for the exact amount of each action.
* The fee is capped at 2% in code. No proxy, no upgrade path.
* A bond can only go back to its member, be burned, or go to the members of the same circle. In a no slash circle it can only go back to its member.
* Fees can only leave the contract as $WIF that is burned.
* The keeper can save for a member only after that member turns on auto-save, only from that member's own allowance, and only into that member's wallet.

The full review, including known limits, is in [SECURITY.md](SECURITY.md).

## Build log

| Date | Milestone |
| :- | :- |
| 7 Nov 2026 | Research of all entries, product chosen, contract written, 17 tests and the mainnet fork test passing |
| 8 Nov 2026 | First app, repository renamed, live on Vercel |
| 9 Nov 2026 | Deployed to mainnet, first circle and first save, source verified |
| 9 Nov 2026 | Full redesign, live markets, multi wallet, security headers, demo film |
| 10 Nov 2026 | v2 live: real `WIF.burn()`, join and save with ETH, auto-save keeper, grace window, no slash circles, /fair page, flagship daily circle |

## Quickstart for developers

Requirements: [Foundry](https://book.getfoundry.sh) and Node 20 or newer.

```bash
git clone https://github.com/angelraph/equalship.git
cd equalship
```

```bash
# contracts: unit and fuzz tests
cd contracts && forge test && cd ..
```

```bash
# app against mainnet
cp .env.example .env.local
npm install
npm run dev
```

Rehearse on a local copy of Robinhood Chain mainnet, with nothing broadcast:

```bash
anvil --fork-url https://rpc.mainnet.chain.robinhood.com --chain-id 4663 --port 8545 &
cd contracts
ROBINHOOD_RPC_URL=http://127.0.0.1:8545 forge test --match-contract Fork -vv
```

Deploy, create a circle and run the flywheel (forge asks for the key at a hidden prompt):

```bash
cd contracts
RPC=https://rpc.mainnet.chain.robinhood.com
forge script script/Deploy.s.sol --rpc-url $RPC --broadcast --interactive
forge script script/DemoCircle.s.sol --sig "run(address)" <EQUALSHIP> --rpc-url $RPC --broadcast --interactive
forge script script/DemoActions.s.sol --sig "run(address,uint256)" <EQUALSHIP> 0 --rpc-url $RPC --broadcast --interactive
```

## Repository layout

```
contracts/
  src/Equalship.sol          the contract
  test/                      unit, fuzz and mainnet fork tests
  script/                    Deploy, DemoCircle, DemoActions, addresses
  verification/              standard JSON input used for source verification
src/
  app/                       every page, /api/market, /api/commitment and the /api/keeper cron
  components/                UI, charts, wallet picker
  lib/                       chain config, ABI, wallet layer, market data, FAQ
media/                       screenshots and the film thumbnail
video/                       narration, screenshots and frame renderer for the demo film
public/.well-known/          security.txt
```

## Documentation

| Document | Contents |
| :- | :- |
| [SUBMISSION.md](SUBMISSION.md) | The hackathon submission |
| [SECURITY.md](SECURITY.md) | Security review, trust model and known limits |
| [video/README.md](video/README.md) | How the demo film is made |
| [equalship.vercel.app/how](https://equalship.vercel.app/how) | How it works, step by step |
| [equalship.vercel.app/faq](https://equalship.vercel.app/faq) | Frequently asked questions |
| [equalship.vercel.app/fees](https://equalship.vercel.app/fees) | Every cost and where it goes |
| [equalship.vercel.app/developers](https://equalship.vercel.app/developers) | Functions, events and the registry |
| [equalship.vercel.app/risk](https://equalship.vercel.app/risk) | Risk disclosure |

## Risks

Stock Tokens, Ether and $WIF can lose value. Stock Tokens are not available to US persons and are restricted in some countries. In circles with a slash rate, missing periods costs part of your bond. The contract is tested and source verified but has not had a paid third party audit. Equalship is independent and is not affiliated with, endorsed by, or sponsored by Robinhood Markets, Inc. Nothing here is investment advice.

## License

[MIT](LICENSE) · Built for the World is Flat hackathon on Robinhood Chain
