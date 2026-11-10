# Security review

An internal review of the Equalship contract and app. It is not a paid third party audit.

## Scope

* `contracts/src/Equalship.sol` and its two helpers, deployed at [`0x9598099B23e55Ad319002f6A1Ba54EF481FCeB3F`](https://robinhoodchain.blockscout.com/address/0x9598099B23e55Ad319002f6A1Ba54EF481FCeB3F) on Robinhood Chain (4663).
* The web app at [equalship.vercel.app](https://equalship.vercel.app).

## Trust model

| Role | Can | Cannot |
| :- | :- | :- |
| Member | Join, save, claim, leave, propose, vote | Touch another member's bond or assets |
| Anyone | Settle a missed period once its grace window has passed | Settle a period that is still open or in grace, or take any bond in a no slash circle |
| Keeper | Swap the fee pool for $WIF and burn it, with a minimum output. Save for a member who turned on auto-save | Send fees anywhere except into `WIF.burn()`. Save for a member who did not opt in, spend more than that member's allowance, or send the Stock Tokens anywhere but that member |
| Owner | Change the keeper, change the fee within 0% to 2%, hand over ownership | Move bonds, move fees, upgrade the contract |

## Properties

* **No custody of Stock Tokens.** Every swap names the member as recipient. The contract balance of every Stock Token stays at zero, which the mainnet fork test asserts.
* **Exact approvals.** The contract approves the router for the exact swap amount and resets the approval to zero after each swap. The app asks members to approve the exact amount of each action.
* **Refundable bonds.** In a circle created with a slash rate of 0, a missed period only resets the streak, and `leave` always returns the full bond. A unit test asserts the full refund.
* **ETH paths refund the extra.** `joinWithETH` and `contributeWithETH` require a minimum output of at least the bond or the contribution and send any surplus $WIF or USDG back to the caller.
* **Bounded slashing.** A slash never takes more than the bond left, and only after a grace window of a quarter period. The fuzz test checks that bonds, burns and pending rewards always add up, and that the contract holds enough $WIF for every bond and reward it owes.
* **No reentrancy.** Every state changing function is guarded, and the external calls are to USDG, $WIF, Stock Tokens and the Uniswap router.
* **No upgrade path.** No proxy, no self destruct, no delegatecall.
* **Safe burn.** `buyAndBurn` is keeper only, so nobody can force the fee pool through a swap with a zero minimum and sandwich it.

## Known limits

* No paid audit yet. Start small.
* The $WIF pool is thin. Large buybacks move the price, so the keeper burns daily with a slippage limit.
* Burns call the token's own `burn()`, so total supply falls. Equalship v1 sent burns to `0x...dEaD` instead; v2 replaced it.
* If the keeper stops, fees wait in the contract until a new keeper is set and auto-saves pause. Fees cannot be withdrawn by anyone, and members can still save by hand.
* Auto-save needs a USDG allowance to the contract. Members can remove it at any time from the circle page or their wallet.
* Prices on the website come from third party APIs and can lag. Swaps always use a live onchain quote.

## Web app

* Strict Content Security Policy, `X-Frame-Options: DENY`, HSTS, `Referrer-Policy` and `Permissions-Policy` headers.
* No accounts, no cookies, no analytics.
* Wallet requests: address only on connect. On action, an exact approval or a call to the contract above.

## Reporting

Open an issue on [GitHub](https://github.com/angelraph/equalship/issues). For anything sensitive, ask for a private contact in the issue and do not post details.
