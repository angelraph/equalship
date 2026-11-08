import { EXPLORER } from "@/lib/chain";
import type { TxState } from "@/lib/useTx";

export function TxStatus({ state }: { state: TxState }) {
  if (state.status === "idle") return null;
  if (state.status === "error") return <p className="mt-2 text-sm text-burn">{state.error}</p>;
  return (
    <p className="mt-2 text-sm text-muted">
      {state.status === "pending" ? `${state.label}: waiting for confirmation` : `${state.label}: confirmed`}
      {state.hash && (
        <>
          {" "}
          <a className="link" href={`${EXPLORER}/tx/${state.hash}`} target="_blank" rel="noreferrer">
            view on Blockscout
          </a>
        </>
      )}
    </p>
  );
}
