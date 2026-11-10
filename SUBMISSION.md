# Equalship: World is Flat hackathon submission

**Name:** Equalship

**Tagline (one line):** Savings circles on Robinhood Chain: join with ETH, save on autopilot with friends, own Stock Tokens in your own wallet, and every save burns $WIF supply.

**Categories:** Stock Tokens, consumer and payments, onboarding, social and creators, hooks and defi

**Live app:** https://equalship.vercel.app

**Repo:** https://github.com/angelraph/equalship

**Contract (Robinhood Chain 4663):** 0x9598099B23e55Ad319002f6A1Ba54EF481FCeB3F, verified with an exact match on Sourcify

## What it is

Equalship turns a group chat into a savings circle. A group agrees on an amount and a schedule. Every period each member saves once, by hand or with auto-save: the contract takes the save, keeps 1%, and swaps the rest on Uniswap into a basket of Stock Tokens such as NVDA, AAPL or SPY, sent straight to the member's own wallet in the same transaction. ETH is the only token you need. Equalship never holds anyone's Stock Tokens, and in a no slash circle your bond comes back in full whenever you leave.

## Why $WIF

$WIF is the commitment that makes the habit stick:

1. **Market buy on join.** Every new member's ETH buys their $WIF bond on Uniswap.
2. **Bond.** The bond stays locked for as long as you save.
3. **Vote.** Members change the basket by burning $WIF, one $WIF per vote.
4. **Buyback and burn.** The 1% fee on every save buys $WIF and calls the token's own `burn()`, so total supply goes down.
5. **Optional slash.** Circles that choose a slash rate burn half of a missed member's penalty and pay half to the members who stayed.

Demand for $WIF grows with how many people save and how often, not with someone losing a bet.

## The flywheel

Join with ETH (a $WIF buy), save on autopilot, own Stock Tokens, burn $WIF supply with every save, build a public streak, invite friends. Bonds lock supply, burns shrink it, and streaks become **Proof of Commitment**: a public onchain record any app can read with `isCommitted(wallet, minPaid, minStreak, maxIdle)` to filter farmed wallets. The /fair page shows how World is Fair could check a whole voter list with it.

## Proof

* Real mainnet transactions on v2: deploy, bond, the daily "WIF Holders Savings Circle", and a first save paid with ETH only (links in the README).
* Contract source verified, exact match on Sourcify.
* 21 unit and fuzz tests plus a mainnet fork test of the full loop: ETH join, ETH save, keeper auto-save, real `WIF.burn()` lowering total supply, full bonds back.
* Live prices and 24 hour charts for every asset from the pools the app swaps through.
* Demo video with narration and captions.

## Built well

* Non custodial by design, exact amount approvals, fee capped at 2% in code, no proxy.
* Multi wallet support (EIP-6963), dark and light themes, mobile layouts, auto-save, calendar reminders, share images, 18 page types including World is Fair, FAQ, Security, Fees, Developers and legal pages.
* Strict security headers and a security.txt.
