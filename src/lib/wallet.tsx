"use client";

/**
 * A small wallet layer on top of viem and React Query for injected wallets (EIP-1193).
 * The hook names follow wagmi so the pages read the same, without wagmi's connector dependencies.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
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
    ethereum?: EIP1193Provider;
  }
}

export const publicClient: PublicClient = createPublicClient({
  chain: robinhoodChain,
  transport: http(),
  batch: { multicall: true },
  pollingInterval: 1_000,
});

type WalletState = {
  address?: Address;
  chainId?: number;
  connecting: boolean;
  hasWallet: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: () => Promise<void>;
};

const noopSubscribe = () => () => {};

const WalletContext = createContext<WalletState | null>(null);
const DISCONNECTED_KEY = "equalship.disconnected";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<Address>();
  const [chainId, setChainId] = useState<number>();
  const [connecting, setConnecting] = useState(false);
  const hasWallet = useSyncExternalStore(noopSubscribe, () => !!window.ethereum, () => false);

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) return;
    let manualOff = false;
    try {
      manualOff = localStorage.getItem(DISCONNECTED_KEY) === "1";
    } catch {
      // storage blocked
    }
    if (!manualOff) {
      eth.request({ method: "eth_accounts" }).then((a) => setAddress((a as Address[])[0]));
    }
    eth.request({ method: "eth_chainId" }).then((id) => setChainId(Number(id)));
    const onAccounts = (a: Address[]) => setAddress(a[0]);
    const onChain = (id: string) => setChainId(Number(id));
    eth.on("accountsChanged", onAccounts);
    eth.on("chainChanged", onChain);
    return () => {
      eth.removeListener("accountsChanged", onAccounts);
      eth.removeListener("chainChanged", onChain);
    };
  }, []);

  const switchChain = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) return;
    const hexId = numberToHex(robinhoodChain.id);
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] });
    } catch (e) {
      if ((e as { code?: number }).code !== 4902) throw e;
      await eth.request({
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
  }, []);

  const connect = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) {
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    setConnecting(true);
    try {
      const a = (await eth.request({ method: "eth_requestAccounts" })) as Address[];
      setAddress(a[0]);
      try {
        localStorage.removeItem(DISCONNECTED_KEY);
      } catch {
        // storage blocked
      }
      const id = Number(await eth.request({ method: "eth_chainId" }));
      setChainId(id);
      if (id !== robinhoodChain.id) await switchChain();
    } finally {
      setConnecting(false);
    }
  }, [switchChain]);

  const disconnect = useCallback(() => {
    setAddress(undefined);
    try {
      localStorage.setItem(DISCONNECTED_KEY, "1");
    } catch {
      // storage blocked
    }
  }, []);

  const value = useMemo(
    () => ({ address, chainId, connecting, hasWallet, connect, disconnect, switchChain }),
    [address, chainId, connecting, hasWallet, connect, disconnect, switchChain],
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

export type ReadResult<T> = { status: "success"; result: T } | { status: "failure"; error: Error; result?: undefined };

type AnyCall = { address: Address; abi: Abi; functionName: string; args?: readonly unknown[] };

/** Batched reads in one multicall. Results come back untyped, cast them at the call site. */
export function useReadContracts(params: { contracts: readonly AnyCall[]; query?: { enabled?: boolean } }) {
  const enabled = (params.query?.enabled ?? true) && params.contracts.length > 0;
  return useQuery({
    queryKey: [
      "reads",
      keyOf(params.contracts.map((c) => [c.address, c.functionName, c.args ?? []])),
    ],
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
  const { address, chainId, switchChain } = useWallet();
  const mutation = useMutation({
    mutationFn: async (params: {
      address: Address;
      abi: Abi;
      functionName: string;
      args?: readonly unknown[];
    }): Promise<Hash> => {
      const eth = window.ethereum;
      if (!eth || !address) throw new Error("Connect a wallet first");
      if (chainId !== robinhoodChain.id) await switchChain();
      const wallet = createWalletClient({ chain: robinhoodChain, transport: custom(eth), account: address });
      // Simulate first so a revert shows its reason before the wallet pops up.
      const { request } = await publicClient.simulateContract({
        address: params.address,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args ?? [],
        account: address,
      });
      return wallet.writeContract(request);
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
