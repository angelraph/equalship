export type Faq = { q: string; a: string };

export const FAQ_GROUPS: { title: string; items: Faq[] }[] = [
  {
    title: "The basics",
    items: [
      {
        q: "What is Equalship?",
        a: "A savings circle that lives onchain. A group agrees on an amount and a schedule, everyone puts in that amount every period, and each payment buys a basket of Stock Tokens straight into each member's own wallet. $WIF keeps the group honest: you bond it to join, you lose part of it if you skip, and you burn it to vote.",
      },
      {
        q: "What is a savings circle?",
        a: "People have saved this way for generations under many names: tontine, susu, ajo, esusu, chit fund, tanda, jamiya. You save because the group expects you to. Equalship keeps that habit and swaps the cash box for a public smart contract.",
      },
      {
        q: "Do I need to be a crypto expert?",
        a: "No. You need a browser wallet on Robinhood Chain and some ETH. You can join and save with ETH alone: it buys the $WIF bond and the USDG for each save on Uniswap in the same transaction. A friend can also pay your bond for you.",
      },
      {
        q: "How much do I need to start?",
        a: "Circles can be as small as 1 USDG per period. The circle creator sets the amount, the schedule and the bond.",
      },
    ],
  },
  {
    title: "Money and custody",
    items: [
      {
        q: "Who holds my Stock Tokens?",
        a: "You do. The swap sends the Stock Tokens to your wallet in the same transaction as your payment. Equalship never holds them, so there is nothing to withdraw and nothing for us to lose.",
      },
      {
        q: "Who holds my $WIF bond?",
        a: "The Equalship contract holds it while you are a member, and you can leave and take it back any day. In a circle with no slashing it always comes back in full. In a circle with slashing, it comes back minus the slash for any period you missed past the grace window. Nobody, including us, can move it anywhere else.",
      },
      {
        q: "What happens if I miss a period?",
        a: "You get a grace window of a quarter period after it closes to save late, with no penalty. After that your streak resets. If the circle has slashing turned on, anyone can apply a slash: the slash percentage of your bond, half burned forever and half shared by the members who paid. Circles with no slashing never touch your bond. Turn on auto-save and you will not miss at all.",
      },
      {
        q: "Can I leave whenever I want?",
        a: "Yes. Leaving settles any missed periods, pays out your share of other members' slashes, and returns the rest of your bond in one transaction.",
      },
    ],
  },
  {
    title: "$WIF",
    items: [
      {
        q: "Why does Equalship use $WIF?",
        a: "Because a savings habit needs a cost for quitting and a reward for staying. $WIF is that cost and reward. It is locked in every bond, burned on every missed period and every basket vote, and bought back and burned with the 1% fee on every contribution.",
      },
      {
        q: "How does the buyback and burn work?",
        a: "Every contribution keeps 1% in USDG. A daily job swaps that pool for $WIF on Uniswap and burns it with $WIF's own burn function, so the total supply really goes down. Every burn is a public transaction you can check on Blockscout.",
      },
      {
        q: "How does basket voting work?",
        a: "Any member can propose a new basket. Members vote by burning $WIF, one $WIF per vote. A proposal passes if more $WIF is burned for it than against it and at least half of the members vote yes.",
      },
    ],
  },
  {
    title: "Stock Tokens and regions",
    items: [
      {
        q: "What are Stock Tokens?",
        a: "Tokens on Robinhood Chain that track listed shares and ETFs such as NVDA, AAPL and SPY. They are issued by Robinhood Assets (Jersey) Limited and priced by Chainlink feeds.",
      },
      {
        q: "Can everyone hold Stock Tokens?",
        a: "No. Stock Tokens are not available to US persons and are restricted in some countries. Equalship asks every buyer to confirm before a basket with Stock Tokens buys anything. Anyone can run a WETH basket instead.",
      },
      {
        q: "Where do the prices come from?",
        a: "Live quotes come from the Robinhood Chain pricing API and charts come from trades in the Uniswap pools that Equalship swaps through. Swaps use a live onchain quote with a slippage limit.",
      },
    ],
  },
  {
    title: "Safety",
    items: [
      {
        q: "My wallet warned me about this site. Why?",
        a: "New sites on shared hosting domains are often flagged by wallet security scanners until they are reviewed. Equalship asks for your address and, when you act, for exact amount approvals and transactions you can read before signing. The contract is open source and the full code is on GitHub. If in doubt, check the contract address on the Security page before signing anything.",
      },
      {
        q: "Has the contract been tested?",
        a: "Yes. It has unit tests, fuzz tests, and a test that runs against real Robinhood Chain mainnet state and buys real Stock Tokens through the live pools. It has not had a paid third party audit yet.",
      },
    ],
  },
];

export const FAQ_TEASER = [FAQ_GROUPS[0].items[0], FAQ_GROUPS[1].items[0], FAQ_GROUPS[1].items[2], FAQ_GROUPS[2].items[0]];
