"use client";

/**
 * Wallet layer on top of viem and React Query.
 * Finds every installed browser wallet through EIP-6963 (with a window.ethereum fallback),
 * lets the user pick one, remembers the choice, and disconnects for real.
 * Hook names follow wagmi so the pages read the same.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  numberToHex,
  type Abi,
  type Address,
  type ContractFunctionArgs,
  type ContractFunctionName,
  type ContractFunctionReturnType,
  type EIP1193Provider,
  type Hash,
  type PublicClient,
} from "viem";
import { robinhoodChain } from "./chain";

declare global {
  interface Window {
    ethereum?: EIP1193Provider & Record<string, unknown>;
  }
}

export const publicClient: PublicClient = createPublicClient({
  chain: robinhoodChain,
  transport: http(),
  batch: { multicall: true },
  pollingInterval: 1_000,
});

// Discovery

export type WalletInfo = { rdns: string; name: string; icon: string; provider: EIP1193Provider };

type AnnounceEvent = CustomEvent<{
  info: { uuid: string; name: string; icon: string; rdns: string };
  provider: EIP1193Provider;
}>;

let discovered: WalletInfo[] = [];
const EMPTY: WalletInfo[] = [];
const listeners = new Set<() => void>();
let started = false;

function legacyName(eth: Record<string, unknown>): string {
  if (eth.isRabby) return "Rabby";
  if (eth.isPhantom) return "Phantom";
  if (eth.isCoinbaseWallet) return "Coinbase Wallet";
  if (eth.isOkxWallet || eth.isOKExWallet) return "OKX Wallet";
  if (eth.isBraveWallet) return "Brave Wallet";
  if (eth.isTrust || eth.isTrustWallet) return "Trust Wallet";
  if (eth.isMetaMask) return "MetaMask";
  return "Browser wallet";
}

function startDiscovery() {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("eip6963:announceProvider", (event) => {
    const { info, provider } = (event as AnnounceEvent).detail;
    if (discovered.some((w) => w.rdns === info.rdns)) return;
    discovered = [...discovered, { rdns: info.rdns, name: info.name, icon: info.icon, provider }];
    listeners.forEach((l) => l());
  });
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  // wallets that predate EIP-6963 only expose window.ethereum
  setTimeout(() => {
    const eth = window.ethereum;
    if (eth && discovered.length === 0) {
      discovered = [{ rdns: "injected", name: legacyName(eth), icon: "", provider: eth }];
      listeners.forEach((l) => l());
    }
  }, 500);
}

export function useWallets(): WalletInfo[] {
  return useSyncExternalStore(
    (cb) => {
      startDiscovery();
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => discovered,
    () => EMPTY,
  );
}

// Connection state

type WalletState = {
  address?: Address;
  chainId?: number;
  wallet?: WalletInfo;
  connecting: boolean;
  pickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
  connect: (wallet?: WalletInfo) => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: () => Promise<void>;
};

const WalletContext = createContext<WalletState | null>(null);
const WALLET_KEY = "equalship.wallet";

function readStored(): string | null {
  try {
    return localStorage.getItem(WALLET_KEY);
  } catch {
    return null;
  }
}

function writeStored(rdns: string | null) {
  try {
    if (rdns) localStorage.setItem(WALLET_KEY, rdns);
    else localStorage.removeItem(WALLET_KEY);
  } catch {
    // storage blocked, the session still works
  }
}

async function switchOn(provider: EIP1193Provider) {
  const hexId = numberToHex(robinhoodChain.id);
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] });
  } catch (e) {
    if ((e as { code?: number }).code !== 4902) throw e;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: hexId,
          chainName: robinhoodChain.name,
          nativeCurrency: robinhoodChain.nativeCurrency,
          rpcUrls: [...robinhoodChain.rpcUrls.default.http],
          blockExplorerUrls: [robinhoodChain.blockExplorers.default.url],
        },
      ],
    });
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallets = useWallets();
  const [address, setAddress] = useState<Address>();
  const [chainId, setChainId] = useState<number>();
  const [wallet, setWallet] = useState<WalletInfo>();
  const [connecting, setConnecting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // quiet reconnect to the wallet used last time, without a popup
  useEffect(() => {
    if (wallet) return;
    const stored = readStored();
    const match = stored ? wallets.find((w) => w.rdns === stored) : undefined;
    if (!match) return;
    match.provider.request({ method: "eth_accounts" }).then((a) => {
      const acct = (a as Address[])[0];
      if (!acct) return;
      setWallet(match);
      setAddress(acct);
      match.provider.request({ method: "eth_chainId" }).then((id) => setChainId(Number(id)));
    });
  }, [wallets, wallet]);

  useEffect(() => {
    if (!wallet) return;
    const p = wallet.provider;
    const onAccounts = (a: Address[]) => setAddress(a[0]);
    const onChain = (id: string) => setChainId(Number(id));
    p.on("accountsChanged", onAccounts);
    p.on("chainChanged", onChain);
    return () => {
      p.removeListener("accountsChanged", onAccounts);
      p.removeListener("chainChanged", onChain);
    };
  }, [wallet]);

  const switchChain = useCallback(async () => {
    if (wallet) await switchOn(wallet.provider);
  }, [wallet]);

  const connect = useCallback(async (w?: WalletInfo) => {
    if (!w) {
      setPickerOpen(true);
      return;
    }
    setConnecting(true);
    try {
      const a = (await w.provider.request({ method: "eth_requestAccounts" })) as Address[];
      setWallet(w);
      setAddress(a[0]);
      writeStored(w.rdns);
      const id = Number(await w.provider.request({ method: "eth_chainId" }));
      setChainId(id);
      setPickerOpen(false);
      if (id !== robinhoodChain.id) await switchOn(w.provider);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const p = wallet?.provider;
    setAddress(undefined);
    setWallet(undefined);
    writeStored(null);
    // wallets that support it drop the site's permission too
    try {
      await p?.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] } as never);
    } catch {
      // not supported by this wallet
    }
  }, [wallet]);

  const value = useMemo(
    () => ({
      address,
      chainId,
      wallet,
      connecting,
      pickerOpen,
      openPicker: () => setPickerOpen(true),
      closePicker: () => setPickerOpen(false),
      connect,
      disconnect,
      switchChain,
    }),
    [address, chainId, wallet, connecting, pickerOpen, connect, disconnect, switchChain],
  );
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet needs WalletProvider");
  return ctx;
}

export function useAccount() {
  const { address, chainId } = useWallet();
  return { address, chainId, isConnected: !!address };
}

export function usePublicClient() {
  return publicClient;
}

// Reads

type ReadFn<abi extends Abi> = ContractFunctionName<abi, "pure" | "view">;

/** JSON key that keeps bigints apart from numbers. */
function keyOf(value: unknown): string {
  return JSON.stringify(value, (_, v) => (typeof v === "bigint" ? `${v}n` : v));
}

export function useReadContract<
  const abi extends Abi,
  fn extends ReadFn<abi>,
  const args extends ContractFunctionArgs<abi, "pure" | "view", fn>,
>(params: {
  address: Address;
  abi: abi;
  functionName: fn;
  args?: args;
  query?: { enabled?: boolean };
}) {
  const missingArgs = "args" in params && params.args === undefined;
  const enabled = (params.query?.enabled ?? true) && !missingArgs;
  return useQuery({
    queryKey: ["read", params.address, params.functionName, keyOf(params.args ?? [])],
    enabled,
    queryFn: async () =>
      (await publicClient.readContract({
        address: params.address,
        abi: params.abi as Abi,
        functionName: params.functionName as string,
        args: (params.args ?? []) as readonly unknown[],
      })) as ContractFunctionReturnType<abi, "pure" | "view", fn, args>,
  });
}

export type ReadResult<T> =
  | { status: "success"; result: T }
  | { status: "failure"; error: Error; result?: undefined };

type AnyCall = { address: Address; abi: Abi; functionName: string; args?: readonly unknown[] };

/** Batched reads in one multicall. Results come back untyped, cast them at the call site. */
export function useReadContracts(params: { contracts: readonly AnyCall[]; query?: { enabled?: boolean } }) {
  const enabled = (params.query?.enabled ?? true) && params.contracts.length > 0;
  return useQuery({
    queryKey: ["reads", keyOf(params.contracts.map((c) => [c.address, c.functionName, c.args ?? []]))],
    enabled,
    queryFn: async () =>
      (await publicClient.multicall({
        contracts: params.contracts.map((c) => ({ ...c, args: c.args ?? [] })),
        allowFailure: true,
      })) as ReadResult<unknown>[],
  });
}

// Writes

export function useWriteContract() {
  const { address, chainId, wallet } = useWallet();
  const mutation = useMutation({
    mutationFn: async (params: {
      address: Address;
      abi: Abi;
      functionName: string;
      args?: readonly unknown[];
    }): Promise<Hash> => {
      if (!wallet || !address) throw new Error("Connect a wallet first");
      if (chainId !== robinhoodChain.id) await switchOn(wallet.provider);
      const client = createWalletClient({ chain: robinhoodChain, transport: custom(wallet.provider), account: address });
      // Simulate first so a revert shows its reason before the wallet pops up.
      const { request } = await publicClient.simulateContract({
        address: params.address,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args ?? [],
        account: address,
      });
      return client.writeContract(request);
    },
  });
  const writeContractAsync = useCallback(
    <const abi extends Abi, fn extends ContractFunctionName<abi, "nonpayable" | "payable">>(params: {
      address: Address;
      abi: abi;
      functionName: fn;
      args?: ContractFunctionArgs<abi, "nonpayable" | "payable", fn>;
    }) =>
      mutation.mutateAsync({
        address: params.address,
        abi: params.abi as Abi,
        functionName: params.functionName as string,
        args: params.args as readonly unknown[] | undefined,
      }),
    [mutation],
  );
  return { writeContractAsync };
}
