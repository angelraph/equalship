import { defineChain, encodePacked, type Address, type Hex } from "viem";

export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.mainnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://robinhoodchain.blockscout.com" },
  },
  contracts: {
    multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" },
  },
});

export const EXPLORER = "https://robinhoodchain.blockscout.com";

export const ADDR = {
  equalship: (process.env.NEXT_PUBLIC_EQUALSHIP_ADDRESS || "") as Address | "",
  usdg: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
  weth: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73",
  wif: "0x5173b8eA6923c2d40267890D45C46a3480954773",
  quoter: "0x33e885eD0Ec9bF04EcfB19341582aADCb4c8A9E7",
  dead: "0x000000000000000000000000000000000000dEaD",
} as const satisfies Record<string, string>;

export const isDeployed = ADDR.equalship.length === 42;

export type Asset = {
  symbol: string;
  name: string;
  address: Address;
  /** Uniswap v3 fee tier of the deepest USDG pool, checked onchain on 7 Nov 2026 */
  fee: number;
  stock: boolean;
};

export const ASSETS: Asset[] = [
  { symbol: "NVDA", name: "NVIDIA", address: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC", fee: 500, stock: true },
  { symbol: "AAPL", name: "Apple", address: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9", fee: 500, stock: true },
  { symbol: "TSLA", name: "Tesla", address: "0x322F0929c4625eD5bAd873c95208D54E1c003b2d", fee: 3000, stock: true },
  { symbol: "MSFT", name: "Microsoft", address: "0xe93237C50D904957Cf27E7B1133b510C669c2e74", fee: 3000, stock: true },
  { symbol: "SPY", name: "S&P 500 ETF", address: "0x117cc2133c37B721F49dE2A7a74833232B3B4C0C", fee: 500, stock: true },
  { symbol: "QQQ", name: "Nasdaq 100 ETF", address: "0xD5f3879160bc7c32ebb4dC785F8a4F505888de68", fee: 500, stock: true },
  { symbol: "WETH", name: "Ether", address: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73", fee: 100, stock: false },
];

export function assetByAddress(addr: string): Asset | undefined {
  return ASSETS.find((a) => a.address.toLowerCase() === addr.toLowerCase());
}

export function pathFor(asset: Asset): Hex {
  return encodePacked(["address", "uint24", "address"], [ADDR.usdg, asset.fee, asset.address]);
}

/** USDG to WETH to WIF, the route the keeper uses to buy and burn $WIF. */
export const BURN_PATH = encodePacked(
  ["address", "uint24", "address", "uint24", "address"],
  [ADDR.usdg, 500, ADDR.weth, 10_000, ADDR.wif],
);

export const PERIODS = [
  { label: "Every hour (demo)", seconds: 3600 },
  { label: "Every day", seconds: 86_400 },
  { label: "Every week", seconds: 604_800 },
  { label: "Every two weeks", seconds: 1_209_600 },
] as const;

export function periodLabel(seconds: number): string {
  if (seconds === 3600) return "hour";
  if (seconds === 86_400) return "day";
  if (seconds === 604_800) return "week";
  if (seconds === 1_209_600) return "two weeks";
  if (seconds % 86_400 === 0) return `${seconds / 86_400} days`;
  return `${Math.round(seconds / 3600)} hours`;
}
