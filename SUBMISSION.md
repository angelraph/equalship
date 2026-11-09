# Equalship: World is Flat hackathon submission

**Name:** Equalship

**Tagline (one line):** Savings circles on Robinhood Chain: save weekly with friends, own Stock Tokens in your own wallet, and every save burns $WIF.

**Categories:** Stock Tokens, consumer and payments, onboarding, social and creators, hooks and defi

**Live app:** https://equalship.vercel.app

**Repo:** https://github.com/angelraph/equalship

**Contract (Robinhood Chain 4663):** 0x3B5598d1bEBfeDF9a8E19526F728e3184a5F6A92, verified with an exact match on Sourcify

## What it is

Equalship turns a group chat into a savings circle. A group agrees on an amount and a schedule. Every period each member presses save once: the contract takes their USDG, keeps 1%, and swaps the rest on Uniswap into a basket of Stock Tokens such as NVDA, AAPL or SPY, sent straight to the member's own wallet in the same transaction. Equalship never holds anyone's assets.

## Why $WIF

$WIF is the commitment that makes the habit stick:

1. **Bond.** Joining a circle locks a $WIF bond for as long as you save.
2. **Slash.** Miss a period and part of the bond is taken: half burned, half paid to the members who stayed.
3. **Vote.** Members change the basket by burning $WIF, one $WIF per vote.
4. **Buyback and burn.** The 1% fee on every save buys $WIF on Uniswap and burns it.

Demand for $WIF grows with how many people save and how often, not with someone losing a bet.

## The flywheel

Save weekly, own Stock Tokens, burn $WIF with every save, build a public streak, invite friends to new circles. Bonds lock supply, missed weeks burn it and reward the people who stay, and streaks become **Proof of Commitment**: a public onchain record any app can read with `isCommitted(wallet, minPaid, minStreak, maxIdle)` to filter farmed wallets. World is Fair could require it for votes.

## Proof

* Real mainnet transactions: deploy, bond, circle creation, first save buying NVDA and SPY (links in the README).
* Contract source verified, exact match on Sourcify.
* 17 unit and fuzz tests plus a mainnet fork test that buys real Stock Tokens through the live pools.
* Live prices and 24 hour charts for every asset from the pools the app swaps through.
* Demo video with narration and captions.

## Built well

* Non custodial by design, exact amount approvals, fee capped at 2% in code, no proxy.
* Multi wallet support (EIP-6963), dark and light themes, mobile layouts, 17 page types including FAQ, Security, Fees, Developers and legal pages.
* Strict security headers and a security.txt.
