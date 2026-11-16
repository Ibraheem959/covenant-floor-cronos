import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { initialState, reduce, type Action, type State } from "@/lib/cronos/logic";

function reducer(state: State, action: Action): State {
  return reduce(state, action);
}

const KEY = "covenant-cronos-v2";

type Api = {
  state: State;
  send: (action: Action) => void;
};

const Ctx = createContext<Api | null>(null);

function revive(raw: string): State | null {
  try {
    const parsed = JSON.parse(raw, (_key, value: unknown) => {
      if (typeof value === "string" && /^n:-?\d+$/.test(value)) return BigInt(value.slice(2));
      return value;
    }) as State;
    if (!parsed.seats || parsed.seats.length !== 2) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function FloorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (!saved) return;
    const next = revive(saved);
    if (next) dispatch({ type: "hydrate", state: next });
  }, []);
  useEffect(() => {
    const json = JSON.stringify(state, (_key, value: unknown) => (typeof value === "bigint" ? `n:${value.toString()}` : value));
    localStorage.setItem(KEY, json);
  }, [state]);
  const api = useMemo<Api>(() => ({ state, send: dispatch }), [state]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useFloor(): Api {
  const api = useContext(Ctx);
  if (!api) throw new Error("Floor is not mounted.");
  return api;
}
