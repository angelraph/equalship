# Security review

An internal review of the Equalship contract and app. It is not a paid third party audit.

## Scope

* `contracts/src/Equalship.sol` and its two helpers, deployed at [`0x3B5598d1bEBfeDF9a8E19526F728e3184a5F6A92`](https://robinhoodchain.blockscout.com/address/0x3B5598d1bEBfeDF9a8E19526F728e3184a5F6A92) on Robinhood Chain (4663).
* The web app at [equalship.vercel.app](https://equalship.vercel.app).

## Trust model

| Role | Can | Cannot |
| :- | :- | :- |
| Member | Join, save, claim, leave, propose, vote | Touch another member's bond or assets |
| Anyone | Apply a slash once a period has closed unpaid | Slash a period that is still open |
| Keeper | Swap the fee pool for $WIF and burn it, with a minimum output | Send fees anywhere except as $WIF to the burn address |
| Owner | Change the keeper, change the fee within 0% to 2%, hand over ownership | Move bonds, move fees, upgrade the contract |

## Properties

* **No custody of Stock Tokens.** Every swap names the member as recipient. The contract balance of every Stock Token stays at zero, which the mainnet fork test asserts.
* **Exact approvals.** The contract approves the router for the exact swap amount and resets the approval to zero after each swap. The app asks members to approve the exact amount of each action.
* **Bounded slashing.** A slash never takes more than the bond left. The fuzz test checks that bonds, burns and pending rewards always add up, and that the contract holds enough $WIF for every bond and reward it owes.
* **No reentrancy.** Every state changing function is guarded, and the external calls are to USDG, $WIF, Stock Tokens and the Uniswap router.
* **No upgrade path.** No proxy, no self destruct, no delegatecall.
* **Safe burn.** `buyAndBurn` is keeper only, so nobody can force the fee pool through a swap with a zero minimum and sandwich it.

## Known limits

* No paid audit yet. Start small.
* The $WIF pool is thin. Large buybacks move the price, so the keeper burns daily with a slippage limit.
* Burned $WIF is sent to `0x...dEaD`. It is out of circulation, but the token's total supply does not change.
* If the keeper stops, fees wait in the contract until a new keeper is set. They cannot be withdrawn by anyone.
* Prices on the website come from third party APIs and can lag. Swaps always use a live onchain quote.

## Web app

* Strict Content Security Policy, `X-Frame-Options: DENY`, HSTS, `Referrer-Policy` and `Permissions-Policy` headers.
* No accounts, no cookies, no analytics.
* Wallet requests: address only on connect. On action, an exact approval or a call to the contract above.

## Reporting

Open an issue on [GitHub](https://github.com/angelraph/equalship/issues). For anything sensitive, ask for a private contact in the issue and do not post details.
