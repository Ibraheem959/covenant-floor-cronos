import { useContext, useEffect, useRef, useState } from "react";
import { Menu, Wallet, X } from "lucide-react";
import { Area, Field, Go, Picks, Stage, Stat } from "@/components/cronos/bits";
import { Lobby } from "@/components/cronos/stage";
import { PickPage, BaccaratPage, BjPage, DicePage, DuelPage, HiloPage, KenoPage, LotteryPage, MinesPage, PlinkoPage, PokerPage, RoulettePage, SlotsPage, TablePage } from "@/components/cronos/tables";
import { FloorProvider, useFloor } from "@/lib/cronos/store";
import { FLOOR, OWNERS } from "@/lib/cronos/addresses";
import { approveHouse, cancelJob, chainBalances, depositFelt, fundHouse, payJob, postJob, proposeHouse, readDesk, rejectHouse, returnJob, sendHouse, sendWork, setActiveWallet, silenceJob, withdrawFelt, type ChainJob, type ChainProposal } from "@/lib/cronos/chain";
import {
  FAITH_MIN,
  formatCro,
  formatFelt,
  owedOf,
  parseFelt,
  type Action,
} from "@/lib/cronos/logic";

const NAV = [
  ["floor", "Floor"],
  ["lottery", "Lottery"],
  ["desk", "Pay desk"],
  ["competition", "Competition"],
  ["dice", "Dice"],
  ["roulette", "Roulette"],
  ["slots", "Slots"],
  ["plinko", "Plinko"],
  ["keno", "Keno"],
  ["baccarat", "Baccarat"],
  ["hi-lo", "Hi-Lo"],
  ["mines", "Mines"],
  ["blackjack", "Blackjack"],
  ["poker", "Poker"],
  ["duel", "Heads-Up"],
  ["table", "Table"],
  ["wallet", "Wallet"],
  ["stakes", "Stakes"],
  ["tithe", "Tithe"],
  ["pilgrimage", "Pilgrimage"],
  ["house", "House"],
] as const;

type PageId = (typeof NAV)[number][0];

const COPY: Record<PageId, { eyebrow: string; title: string; copy: string }> = {
  floor: { eyebrow: "Cronos · chain 25", title: "Covenant Floor", copy: "You are on the FELT floor. A wager leaves your vault. A win is paid back into it from the house. The tables below are the ways in." },
  lottery: { eyebrow: "One pot", title: "Lottery", copy: "A scroll is 1,000 FELT. Pay it into the pot, or burn it and still hold a ticket. The draw pays 90%." },
  desk: { eyebrow: "Work · not a bet", title: "Pay desk", copy: "Lock FELT from your vault on a brief. The first other seat to submit can be paid. You have 48 hours to pay them or send it back with a reason. Silence pays the worker." },
  competition: { eyebrow: "Play any game", title: "Competition", copy: "A timed race. The prize is locked before the first bet. The seat that comes out ahead by the most FELT takes it. A tie goes to more winning rounds." },
  dice: { eyebrow: "Two dice", title: "Dice", copy: "Under 7 and over 7 pay 2.30×. Exact 7 pays 5.76×. An exact sum pays 36× at 96%, split by the number of ways." },
  roulette: { eyebrow: "0 to 36", title: "Roulette", copy: "A straight pays 36×. Red, black, even, and odd pay 2×. A dozen pays 3×. Zero loses the outside bets." },
  slots: { eyebrow: "Three reels", title: "Slots", copy: "Three 7s pay 25×. Three BARs pay 10×. GEM or BELL triples pay 5×. Any other triple pays 2×. Any pair pays 1.5×." },
  plinko: { eyebrow: "Eight drops", title: "Plinko", copy: "The ball takes eight even left or right steps. Low, medium, and high change the bucket pays. Edges pay the most." },
  keno: { eyebrow: "10 of 40", title: "Keno", copy: "Choose 1 to 10 numbers. Ten numbers are drawn. A full card of hits pays 80×. The wager cap is 10,000 FELT." },
  baccarat: { eyebrow: "Player, banker, tie", title: "Baccarat", copy: "Player and banker pay 2×. A tie pays 9× and returns a player or banker wager. Third-card rules are the standard shoe." },
  "hi-lo": { eyebrow: "One rank at a time", title: "Hi-Lo", copy: "Call the next rank higher or lower. A match stays. A hit multiplies by 1.9, up to 20×. Cash out, or lose the wager on a miss." },
  mines: { eyebrow: "25 tiles · 3 mines", title: "Mines", copy: "Each reveal can be a mine among the tiles still closed. A safe tile raises the cash-out. Hit a mine and the wager stays with the house." },
  blackjack: { eyebrow: "Dealer stands on 17", title: "Blackjack", copy: "Even wagers. A natural pays 3 to 2. Double a hard 9, 10, or 11. Split a pair. Split aces take one card and stand." },
  poker: { eyebrow: "You versus the house", title: "Poker", copy: "Casino hold'em. Ante, see two cards and a flop. Call for exactly twice the ante, or fold. The house needs a pair of fours. A royal pays 100 to 1 on the ante." },
  duel: { eyebrow: "You versus the other seat", title: "Heads-Up", copy: "No-limit hold'em. Matched stacks, 20 to 50,000 FELT. The host is the small blind. Blinds are 1/20 and 1/10 of the buy-in. The winner pays a 2% rake." },
  table: { eyebrow: "Two seats, one shoe", title: "Table", copy: "Both seats put up an even wager. The dealer stands on 17. A natural pays 3 to 2. Leave only while the other chair is empty." },
  wallet: { eyebrow: "Vault", title: "Wallet", copy: "Games take FELT from the vault. Scrolls, packs, and pilgrimage locks take FELT from the wallet. Move funds between them here." },
  stakes: { eyebrow: "CRO lock · FELT rewards", title: "Stakes", copy: "Lock CRO. 7 days is 1.0×, 30 days is 1.5×, 90 days is 2.0×. 10% of each net loss is shared by that weight. Early unstake is refused." },
  tithe: { eyebrow: "Scroll packs", title: "Tithe", copy: "Pay for scrolls ahead. 5 paid receives 6. Larger packs add more. Allocate them into the open round. Close returns unused paid FELT." },
  pilgrimage: { eyebrow: "Faith and lockups", title: "Pilgrimage", copy: "Tier 1 pays 20 faith per 1,000,000 FELT, tier 2 pays 60, tier 3 pays 150. The minimum lock is 20,000,000 FELT. Faith can be spent as scrolls. It does not fill the pot." },
  house: { eyebrow: "Two of three owners", title: "House bank", copy: "A withdrawal takes FELT from the house bank only and pays a named wallet. Two owners must approve. Player vaults, the staker pot, and open jobs are not used." },
};

export function Floor() {
  return (
    <FloorProvider>
      <Shell />
    </FloorProvider>
  );
}

function isCronos(chain: unknown) {
  const text = String(chain ?? "").trim().toLowerCase();
  const id = text.startsWith("0x") ? Number.parseInt(text, 16) : Number(text);
  return id === 25;
}

function explain(error: unknown) {
  const any = error as Error & { shortMessage?: string; reason?: string };
  const text = error instanceof Error ? any.reason || any.shortMessage || any.message : "The wallet refused that.";
  if (/allowance/i.test(text)) return "The house is not approved to take that FELT yet. Confirm the approval, then add it again.";
  if (/max wallet|max tx|limit/i.test(text)) return "That amount is above the token limit. One add can be 55,000,000 FELT, and the house can hold 50,000,000.";
  return text;
}

function Shell() {
  const { state, send } = useFloor();
  const [page, setPage] = useState<PageId>("floor");
  const [open, setOpen] = useState(false);
  const [walletNote, setWalletNote] = useState("");
  const [choices, setChoices] = useState<WalletChoice[] | null>(null);
  const chosen = useRef<Eth | null>(null);
  const unlisten = useRef<(() => void) | null>(null);
  const copy = COPY[page];
  const shownVault = state.address ? state.chainVault : 0n;

  useEffect(() => {
    if (state.contract !== FLOOR) send({ type: "contract", address: FLOOR });
  }, [send, state.contract]);

  useEffect(() => {
    let stop = false;
    const pull = () => {
      void chainBalances(state.address).then((row) => {
        if (!stop) send({ type: "synced", wallet: row.wallet, vault: row.vault, bank: row.bank, burned: row.burned, buyback: row.buyback, stakers: row.stakers, cro: row.cro });
      }).catch(() => undefined);
    };
    pull();
    const timer = window.setInterval(pull, 12000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [send, state.address]);

  function watch(eth: Eth) {
    unlisten.current?.();
    const onAccounts = (accounts: unknown) => {
      const list = Array.isArray(accounts) ? accounts.map(String) : [];
      if (forgotten.current) return;
      if (list.length === 0) {
        send({ type: "wallet", address: "", chainOk: false });
        return;
      }
      void eth.request({ method: "eth_chainId" }).then((chain) => {
        if (forgotten.current) return;
        send({ type: "wallet", address: list[0] ?? "", chainOk: isCronos(chain) });
      }).catch(() => undefined);
    };
    eth.on?.("accountsChanged", onAccounts);
    unlisten.current = () => eth.removeListener?.("accountsChanged", onAccounts);
  }

  async function connect() {
    setWalletNote("");
    const wallets = await discoverWallets();
    if (!wallets.length) {
      setWalletNote("No wallet found. Install MetaMask or OKX, then try again.");
      return;
    }
    setChoices(wallets);
  }

  async function pickWallet(choice: WalletChoice) {
    setChoices(null);
    setWalletNote("");
    chosen.current = choice.provider;
    setActiveWallet(choice.provider);
    try {
      const next = await openWallet(choice.provider);
      if (!next.address) throw new Error("That wallet did not return an account.");
      forgotten.current = false;
      watch(choice.provider);
      send({ type: "wallet", address: next.address, chainOk: next.chainOk });
      setWalletNote(next.chainOk ? "" : "Switch the wallet to Cronos.");
    } catch (error) {
      chosen.current = null;
      setActiveWallet(null);
      setWalletNote(error instanceof Error ? error.message : "The wallet did not connect.");
    }
  }

  async function disconnect() {
    forgotten.current = true;
    unlisten.current?.();
    unlisten.current = null;
    const eth = chosen.current;
    chosen.current = null;
    setActiveWallet(null);
    send({ type: "wallet", address: "", chainOk: false });
    setWalletNote("");
    setPage((current) => (current === "house" ? "floor" : current));
    try {
      await eth?.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
    } catch {
      /* this wallet has no permission revoke */
    }
  }

  const forgotten = useRef(true);
  const signerIndex = OWNERS.findIndex((addr) => addr.toLowerCase() === state.address.toLowerCase());
  const signer = signerIndex >= 0;
  useEffect(() => {
    if (page === "house" && !signer) setPage("floor");
  }, [page, signer]);

  const bank = state.chainBank;
  const burned = state.chainBurned;
  const buyback = state.chainBuyback;
  const stakers = state.chainStakers;

  return (
    <PickPage.Provider value={(id) => { const hit = NAV.find(([page]) => page === id); if (hit) setPage(hit[0]); }}>
    <div className="app-noise app-frame">
      <div className="floor-shell">
        <aside className="app-sidebar hidden w-[224px] shrink-0 flex-col border-r border-line px-4 py-5 lg:flex">
          <Brand />
          <div className="mt-6 px-3 text-[10px] font-extrabold tracking-[.22em] text-muted uppercase">Play</div>
          <Nav page={page} signer={signer} onPick={setPage} />
          <p className="mt-4 border-t border-line px-3 pt-4 text-xs text-muted">Cronos · chain 25 · FELT</p>
        </aside>
        <main className="floor-main min-w-0 flex-1">
          <header className="app-header sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b border-line px-3 backdrop-blur-xl sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <button type="button" className="icon-button grid place-items-center lg:hidden" aria-label="Open navigation" onClick={() => setOpen((v) => !v)}>
                {open ? <X size={18} /> : <Menu size={18} />}
              </button>
              <div className="lg:hidden"><Brand compact /></div>
              <div className="hidden items-center gap-2 text-[11px] tracking-[.08em] text-muted sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                CRONOS
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {state.address ? (
                <>
                  {signer ? <span className="rounded-full border border-gold/50 px-2 py-1 text-[10px] font-bold tracking-[.14em] text-gold uppercase">Signer {signerIndex + 1}</span> : null}
                  <span className="hidden font-mono text-xs text-muted sm:inline">{short(state.address)}</span>
                  <button type="button" onClick={() => void disconnect()} className="disconnect-button">Disconnect</button>
                </>
              ) : (
                <button type="button" onClick={() => void connect()} className="wallet-button">
                  <Wallet size={15} aria-hidden />
                  <span>Connect wallet</span>
                </button>
              )}
            </div>
          </header>
          {walletNote ? <p className="mx-auto w-full max-w-[1480px] px-4 pt-3 text-sm text-wine sm:px-6">{walletNote}</p> : null}
          {choices ? (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4" role="dialog" aria-label="Choose a wallet">
              <div className="grid w-full max-w-sm gap-3 rounded-2xl border border-line bg-panel p-4">
                <div className="flex items-center justify-between gap-3">
                  <strong>Choose a wallet</strong>
                  <button type="button" className="text-sm text-muted" onClick={() => setChoices(null)}>Close</button>
                </div>
                {choices.map((choice) => (
                  <button key={choice.id} type="button" className="flex items-center gap-3 rounded-xl border border-line px-3 py-3 text-left" onClick={() => void pickWallet(choice)}>
                    {choice.icon ? <img src={choice.icon} alt="" className="h-8 w-8 rounded-lg" /> : <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold/20 text-xs font-bold">{choice.name.slice(0, 1)}</span>}
                    <span>{choice.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {open ? (
            <div className="nav-drawer lg:hidden">
              <Nav page={page} signer={signer} onPick={(id) => { setPage(id); setOpen(false); }} />
            </div>
          ) : null}
          <div className="floor-body mx-auto w-full max-w-[1480px]">
            <section className="grid min-w-0 gap-4">
              <p className="text-[11px] font-bold tracking-[.21em] text-muted uppercase">{copy.eyebrow}</p>
              <div className="page-heading flex items-center justify-between gap-4">
                <div>
                  <h1>{copy.title}</h1>
                  <p>{copy.copy}</p>
                </div>
                <div className="heading-mark hidden sm:grid">F<i /></div>
              </div>
              {TABLE_PAGES.has(page) ? null : (
                <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-line bg-panel/70 px-4 py-3">
                  <div>
                    <p className="text-[10px] tracking-[.14em] text-muted uppercase">Vault</p>
                    <p className="num-strip text-3xl text-gold" data-testid="chip-balance">{formatFelt(shownVault)}</p>
                  </div>
                </div>
              )}
              {state.error ? <p className="rounded-lg border border-wine px-3 py-3 text-sm text-wine">{state.error}</p> : null}
              {walletNote ? <p className="text-sm text-muted">{walletNote}</p> : null}
              <Body page={page} />
              {!TABLE_PAGES.has(page) && page !== "house" && state.last.game === page ? <Stage title={state.last.title} line={state.last.line} tone={state.last.tone} /> : null}
            </section>
            <aside className="right-rail">
              <div className="flex items-center justify-between px-4 pt-4">
                <div>
                  <p className="text-[9px] tracking-[.16em] text-muted uppercase">House</p>
                  <h2 className="font-display text-xl">FELT</h2>
                </div>
              </div>
              <div className="mt-3 border-t border-line">
                <RailRow label="House FELT" value={`${formatFelt(bank)}`} hot />
                <RailRow label="Your vault" value={state.address ? `${formatFelt(shownVault)}` : "—"} />
                <RailRow label="Burned" value={`${formatFelt(burned)}`} />
                <RailRow label="Buyback" value={`${formatFelt(buyback)}`} />
                <RailRow label="Stakers" value={`${formatFelt(stakers)}`} />
              </div>
              <div className="border-t border-line px-4 py-4">
                <p className="text-xs font-semibold">These figures are FELT, not CRO.</p>
                <div className="split-bar my-3"><span /><span /><span /><span /></div>
                <p className="text-[11px] leading-relaxed text-muted">The house number is FELT locked in the contract. It is not a CRO balance, and it is not a win. A player is paid only after FELT is deposited and the bet settles.</p>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
    </PickPage.Provider>
  );
}

type Eth = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, fn: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, fn: (...args: unknown[]) => void) => void;
  providers?: Eth[];
  isMetaMask?: boolean;
  isOkxWallet?: boolean;
  isRabby?: boolean;
};

type WalletChoice = { id: string; name: string; icon?: string; provider: Eth };

function walletName(provider: Eth, fallback: string) {
  if (provider.isOkxWallet) return "OKX Wallet";
  if (provider.isRabby) return "Rabby";
  if (provider.isMetaMask) return "MetaMask";
  return fallback;
}

function discoverWallets(): Promise<WalletChoice[]> {
  return new Promise((resolve) => {
    const found = new Map<string, WalletChoice>();
    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent<{ info?: { uuid: string; name: string; icon: string }; provider?: Eth }>).detail;
      if (!detail?.info || !detail.provider) return;
      found.set(detail.info.uuid, { id: detail.info.uuid, name: detail.info.name, icon: detail.info.icon, provider: detail.provider });
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    window.setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      const root = window as Window & { ethereum?: Eth; okxwallet?: Eth };
      const list = Array.isArray(root.ethereum?.providers) ? root.ethereum.providers : [];
      list.forEach((provider, index) => {
        const id = `legacy-${index}`;
        if ([...found.values()].some((item) => item.provider === provider)) return;
        found.set(id, { id, name: walletName(provider, `Wallet ${index + 1}`), provider });
      });
      if (root.okxwallet && ![...found.values()].some((item) => item.provider === root.okxwallet)) {
        found.set("okx", { id: "okx", name: "OKX Wallet", provider: root.okxwallet });
      }
      if (root.ethereum && !list.length && ![...found.values()].some((item) => item.provider === root.ethereum)) {
        found.set("injected", { id: "injected", name: walletName(root.ethereum, "Browser wallet"), provider: root.ethereum });
      }
      resolve([...found.values()]);
    }, 300);
  });
}

async function openWallet(eth: Eth) {
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x19" }] });
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code !== 4902) throw error;
    await eth.request({
      method: "wallet_addEthereumChain",
      params: [{ chainId: "0x19", chainName: "Cronos", nativeCurrency: { name: "CRO", symbol: "CRO", decimals: 18 }, rpcUrls: ["https://evm.cronos.org"], blockExplorerUrls: ["https://cronoscan.com"] }],
    });
  }
  try {
    await eth.request({ method: "wallet_requestPermissions", params: [{ eth_accounts: {} }] });
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code === 4001) throw error;
  }
  const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
  const chain = await eth.request({ method: "eth_chainId" });
  return { address: accounts[0] ?? "", chainOk: isCronos(chain) };
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "gap-2" : ""}`}>
      <div className="brand-emblem">F</div>
      <div>
        <strong>FELT</strong>
        <small>FAIR ENTRY · LOCKED TOGETHER</small>
      </div>
    </div>
  );
}

function FloorHome() {
  const { state } = useFloor();
  const open = useContext(PickPage);
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Wallet" value={state.address ? `${formatFelt(state.chainWallet)} FELT` : "Not connected"} />
        <Stat label="Vault" value={state.address ? `${formatFelt(state.chainVault)} FELT` : "—"} />
        <Stat label="House" value={`${formatFelt(state.chainBank)} FELT`} />
      </div>
      <Lobby onOpen={open} />
    </div>
  );
}

function Nav({ page, signer, onPick }: { page: PageId; signer: boolean; onPick: (id: PageId) => void }) {
  const items = NAV.filter(([id]) => id !== "house" || signer);
  return (
    <nav className="mt-3 grid grid-cols-2 gap-1 lg:grid-cols-1">
      {items.map(([id, label], index) => (
        <button key={id} type="button" onClick={() => onPick(id)} className={`nav-link ${page === id ? "nav-link-active" : ""}`}>
          <span className="nav-index">{String(index + 1).padStart(2, "0")}</span>
          <span>{label}</span>
          {page === id ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" /> : null}
        </button>
      ))}
    </nav>
  );
}

function RailRow({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 text-xs">
      <span className="text-muted">{label}</span>
      <strong className={hot ? "text-gold" : "font-normal"}>{value}</strong>
    </div>
  );
}

const TABLE_PAGES = new Set(["dice", "roulette", "slots", "plinko", "keno", "baccarat", "hi-lo", "mines", "blackjack", "poker", "duel", "table"]);
function Body({ page }: { page: PageId }) {
  if (page === "floor") return <FloorHome />;
  if (page === "lottery") return <LotteryPage />;
  if (page === "desk") return <DeskPage />;
  if (page === "competition") return <RacePage />;
  if (page === "dice") return <DicePage />;
  if (page === "roulette") return <RoulettePage />;
  if (page === "slots") return <SlotsPage />;
  if (page === "plinko") return <PlinkoPage />;
  if (page === "keno") return <KenoPage />;
  if (page === "baccarat") return <BaccaratPage />;
  if (page === "hi-lo") return <HiloPage />;
  if (page === "mines") return <MinesPage />;
  if (page === "blackjack") return <BjPage />;
  if (page === "poker") return <PokerPage />;
  if (page === "duel") return <DuelPage />;
  if (page === "table") return <TablePage />;
  if (page === "wallet") return <WalletPage />;
  if (page === "stakes") return <StakePage />;
  if (page === "tithe") return <TithePage />;
  if (page === "pilgrimage") return <PilgrimPage />;
  return <HousePage />;
}

function useForm() {
  const api = useFloor();
  const [local, setLocal] = useState("");
  const [busy, setBusy] = useState(false);
  const live = Boolean(api.state.address && api.state.chainOk);
  function go(_build: () => Action) {
    setLocal(live ? "This is not open on Cronos yet." : "Connect a Cronos wallet.");
  }
  async function run(task: () => Promise<void>) {
    try {
      setLocal("");
      setBusy(true);
      await task();
    } catch (error) {
      setLocal(explain(error));
    } finally {
      setBusy(false);
    }
  }
  async function refresh() {
    if (!api.state.address) return;
    const row = await chainBalances(api.state.address);
    api.send({ type: "synced", wallet: row.wallet, vault: row.vault, bank: row.bank, burned: row.burned, buyback: row.buyback, stakers: row.stakers, cro: row.cro });
  }
  return { ...api, local, go, run, busy, refresh, live };
}

function Bomb({ text }: { text: string }) {
  if (!text) return null;
  return <p className="text-sm text-wine">{text}</p>;
}

function DeskPage() {
  const { state, go, run, busy, local, live } = useForm();
  const [brief, setBrief] = useState("");
  const [hours, setHours] = useState("24");
  const [pay, setPay] = useState("10");
  const [work, setWork] = useState("");
  const [reason, setReason] = useState("");
  const [jobs, setJobs] = useState<ChainJob[]>([]);
  useEffect(() => {
    if (!live) return;
    let stop = false;
    void readDesk(state.address).then((row) => {
      if (!stop) setJobs(row.jobs);
    }).catch(() => undefined);
    return () => { stop = true; };
  }, [live, state.address, busy]);
  const me = state.address.toLowerCase();
  return (
    <div className="grid gap-4">
      <Area label="Brief" value={brief} onChange={setBrief} hint="The brief locks when you post it." />
      <Field label="Hours to submit" value={hours} onChange={setHours} hint="From 1 hour up to 14 days." />
      <Field label="Pay · FELT" value={pay} onChange={setPay} hint="Taken from your vault. Minimum 1." />
      <Go disabled={busy} onClick={() => {
        if (live) void run(async () => { await postJob(brief, Number(hours), parseFelt(pay)); });
        else go(() => ({ type: "job-open", brief, hours: Number(hours), pay: parseFelt(pay) }));
      }}>Post the job</Go>
      <Area label="Work" value={work} onChange={setWork} hint="Someone else submits the work." />
      <Field label="Rejection reason" value={reason} onChange={setReason} hint="Required if you send the FELT back." />
      <Bomb text={local} />
      <ul className="grid gap-3">
        {live && jobs.length === 0 ? <li className="text-sm text-muted">No jobs yet.</li> : null}
        {!live && state.jobs.length === 0 ? <li className="text-sm text-muted">No jobs yet.</li> : null}
        {live ? jobs.map((job) => (
          <li key={job.index} className="grid gap-2 rounded-lg border border-line p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <strong>#{job.id.toString()} · {formatFelt(job.pay)} FELT</strong>
              <span className="text-xs text-muted uppercase">{job.state === 0 ? "Open" : job.state === 1 ? "Work in" : job.state === 2 ? "Paid" : "Returned"}</span>
            </div>
            <p className="text-sm">{job.brief}</p>
            {job.work ? <p className="text-sm text-muted">Work: {job.work}</p> : null}
            {job.reason ? <p className="text-sm text-muted">Reason: {job.reason}</p> : null}
            <p className="text-xs text-muted">Posted by {short(job.creator)}. Open until {new Date(Number(job.deadline) * 1000).toLocaleString()}.</p>
            <div className="flex flex-wrap gap-2">
              {job.state === 0 && job.creator.toLowerCase() !== me ? <Go disabled={busy} onClick={() => void run(async () => { await sendWork(job.index, work); })}>Submit</Go> : null}
              {job.state === 0 && job.creator.toLowerCase() === me ? <Go quiet disabled={busy} onClick={() => void run(async () => { await cancelJob(job.index); })}>Cancel</Go> : null}
              {job.state === 1 && job.creator.toLowerCase() === me ? <Go disabled={busy} onClick={() => void run(async () => { await payJob(job.index); })}>Pay</Go> : null}
              {job.state === 1 && job.creator.toLowerCase() === me ? <Go quiet disabled={busy} onClick={() => void run(async () => { await returnJob(job.index, reason); })}>Send back</Go> : null}
              {job.state === 1 ? <Go quiet disabled={busy} onClick={() => void run(async () => { await silenceJob(job.index); })}>Settle silence</Go> : null}
            </div>
          </li>
        )) : state.jobs.map((job) => (
          <li key={job.id} className="grid gap-2 rounded-lg border border-line p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <strong>#{job.id} · {formatFelt(job.pay)} FELT</strong>
              <span className="text-xs text-muted uppercase">{job.state === 0 ? "Open" : job.state === 1 ? "Work in" : job.state === 2 ? "Paid" : "Returned"}</span>
            </div>
            <p className="text-sm">{job.brief}</p>
            {job.work ? <p className="text-sm text-muted">Work: {job.work}</p> : null}
            {job.reason ? <p className="text-sm text-muted">Reason: {job.reason}</p> : null}
            <p className="text-xs text-muted">Submit before {new Date(job.deadline).toLocaleString()}.</p>
            <div className="flex flex-wrap gap-2">
              {job.state === 0 ? <Go onClick={() => go(() => ({ type: "job-submit", id: job.id, work }))}>Submit</Go> : null}
              {job.state === 0 ? <Go quiet onClick={() => go(() => ({ type: "job-cancel", id: job.id }))}>Cancel</Go> : null}
              {job.state === 1 ? <Go onClick={() => go(() => ({ type: "job-approve", id: job.id }))}>Pay</Go> : null}
              {job.state === 1 ? <Go quiet onClick={() => go(() => ({ type: "job-reject", id: job.id, reason }))}>Send back</Go> : null}
              {job.state === 1 ? <Go quiet onClick={() => go(() => ({ type: "job-settle", id: job.id }))}>Settle silence</Go> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RacePage() {
  const { state, go, local } = useForm();
  const [name, setName] = useState("Tonight");
  const [hours, setHours] = useState("1");
  const [prize, setPrize] = useState("100");
  return (
    <div className="grid gap-4">
      <Field label="Name" value={name} onChange={setName} />
      <Field label="Hours" value={hours} onChange={setHours} />
      <Field label="Prize · FELT" value={prize} onChange={setPrize} hint="Locked from the vault before the first bet." />
      <Go onClick={() => go(() => ({ type: "contest-open", name, hours: Number(hours), prize: parseFelt(prize) }))}>Open the race</Go>
      <Bomb text={local} />
      <ul className="grid gap-3">
        {state.contests.map((race) => (
          <li key={race.id} className="grid gap-2 rounded-lg border border-line p-3">
            <strong>{race.name} · {formatFelt(race.prize)} FELT</strong>
            <p className="text-sm text-muted">Chair A {formatFelt(race.net[0])} · {race.wins[0]} wins. Chair B {formatFelt(race.net[1])} · {race.wins[1]} wins.</p>
            <p className="text-xs text-muted">{race.settled ? "Settled" : `Ends ${new Date(race.end).toLocaleString()}`}</p>
            {!race.settled ? <Go quiet onClick={() => go(() => ({ type: "contest-claim", id: race.id }))}>Settle</Go> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function WalletPage() {
  const { state, run, busy, local, refresh } = useForm();
  const [amount, setAmount] = useState("1000");
  const live = Boolean(state.address && state.chainOk);
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Wallet" value={`${formatFelt(state.address ? state.chainWallet : 0n)} FELT`} />
        <Stat label="Vault" value={`${formatFelt(state.address ? state.chainVault : 0n)} FELT`} />
        <Stat label="Gas · CRO" value={state.address ? formatCro(state.chainCro) : "—"} />
      </div>
      <Field label="Amount · FELT" value={amount} onChange={setAmount} />
      <div className="flex flex-wrap gap-2">
        <Go disabled={busy} onClick={() => void run(async () => {
          if (!live) throw new Error("Connect a Cronos wallet.");
          await depositFelt(parseFelt(amount));
          await refresh();
        })}>Deposit to vault</Go>
        <Go quiet disabled={busy} onClick={() => void run(async () => {
          if (!live) throw new Error("Connect a Cronos wallet.");
          await withdrawFelt(parseFelt(amount));
          await refresh();
        })}>Withdraw</Go>
      </div>
      <p className="text-sm text-muted">House bank {formatFelt(state.chainBank)} FELT. Burned {formatFelt(state.chainBurned)}. Buyback {formatFelt(state.chainBuyback)}. Set aside for stakers {formatFelt(state.chainStakers)}.</p>
      {live ? <p className="text-sm text-muted">Claim is once per wallet.</p> : null}
      <Bomb text={local} />
    </div>
  );
}

function StakePage() {
  const { state, go, local, live } = useForm();
  const [tier, setTier] = useState("1");
  const [cro, setCro] = useState("100");
  const lock = state.seats[state.acting].lock;
  const due = owedOf(state, state.acting);
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Your CRO" value={state.address ? formatCro(state.chainCro) : "—"} />
        <Stat label="Total weight" value={state.weight.toString()} />
        <Stat label="Owed" value={`${formatFelt(due)} FELT`} />
      </div>
      {!live && lock ? <p className="text-sm text-muted">Locked {lock.amount.toString()} CRO at tier {lock.tier}. Unlocks {new Date(lock.unlockAt).toLocaleString()}.</p> : null}
      <Picks value={tier} onChange={setTier} options={[{ id: "1", label: "7 days · 1.0×" }, { id: "2", label: "30 days · 1.5×" }, { id: "3", label: "90 days · 2.0×" }]} />
      <Field label="CRO to lock" value={cro} onChange={setCro} />
      <div className="flex flex-wrap gap-2">
        <Go onClick={() => go(() => ({ type: "stake", tier: Number(tier) as 1 | 2 | 3, cro: BigInt(cro) }))}>Lock</Go>
        <Go quiet onClick={() => go(() => ({ type: "stake-claim" }))}>Claim FELT</Go>
        <Go quiet onClick={() => go(() => ({ type: "unstake" }))}>Unstake</Go>
      </div>
      <Bomb text={local} />
    </div>
  );
}

function TithePage() {
  const { state, go, local } = useForm();
  const [tier, setTier] = useState("1");
  const [n, setN] = useState("1");
  const pack = state.seats[state.acting].tithe;
  return (
    <div className="grid gap-4">
      <Picks value={tier} onChange={setTier} options={[
        { id: "1", label: "5 → 6" }, { id: "2", label: "10 → 13" }, { id: "3", label: "30 → 45" },
        { id: "4", label: "100 → 175" }, { id: "5", label: "250 → 500" }, { id: "6", label: "500 → 1,100" },
      ]} />
      {pack ? <p className="text-sm text-muted">{pack.paid} paid and {pack.bonus} extra still in the pack. Escrow {formatFelt(pack.escrow)} FELT.</p> : <p className="text-sm text-muted">No pack is open.</p>}
      <Field label="Scrolls to allocate" value={n} onChange={setN} />
      <div className="flex flex-wrap gap-2">
        <Go onClick={() => go(() => ({ type: "tithe", tier: Number(tier) }))}>Buy pack</Go>
        <Go quiet onClick={() => go(() => ({ type: "tithe-allocate", n: Number(n) }))}>Allocate</Go>
        <Go quiet onClick={() => go(() => ({ type: "tithe-close" }))}>Close pack</Go>
      </div>
      <Bomb text={local} />
    </div>
  );
}

function PilgrimPage() {
  const { state, go, local } = useForm();
  const [tier, setTier] = useState("1");
  const [amount, setAmount] = useState(formatFelt(FAITH_MIN));
  const seat = state.seats[state.acting];
  return (
    <div className="grid gap-4">
      <Stat label="Faith" value={seat.faith.toString()} />
      <Picks value={tier} onChange={setTier} options={[{ id: "1", label: "7 days · 20" }, { id: "2", label: "30 days · 60" }, { id: "3", label: "90 days · 150" }]} />
      <Field label="FELT to lock" value={amount} onChange={setAmount} hint="Minimum 20,000,000 FELT from the wallet." />
      <div className="flex flex-wrap gap-2">
        <Go onClick={() => go(() => ({ type: "pilgrim", tier: Number(tier) as 1 | 2 | 3, amount: parseFelt(amount) }))}>Begin</Go>
        <Go quiet onClick={() => go(() => ({ type: "faith-spend", n: 1 }))}>Spend 1 faith</Go>
      </div>
      <ul className="grid gap-2">
        {seat.pilgrims.map((row, index) => (
          <li key={`${row.unlockAt}-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-3 text-sm">
            <span>{formatFelt(row.amount)} FELT · unlocks {new Date(row.unlockAt).toLocaleDateString()}</span>
            <Go quiet onClick={() => go(() => ({ type: "pilgrim-claim", index }))}>Claim</Go>
          </li>
        ))}
      </ul>
      <Bomb text={local} />
    </div>
  );
}

function HousePage() {
  const { state, run, busy, local, live, refresh } = useForm();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("1000");
  const [fund, setFund] = useState("1000");
  const [proposal, setProposal] = useState<ChainProposal | null>(null);
  const signerIndex = OWNERS.findIndex((addr) => addr.toLowerCase() === state.address.toLowerCase());
  const signer = signerIndex >= 0;
  useEffect(() => {
    let stop = false;
    void readDesk(state.address).then((row) => {
      if (!stop) setProposal(row.proposal.open ? row.proposal : null);
    }).catch(() => undefined);
    return () => { stop = true; };
  }, [state.address, busy]);
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="House bank" value={`${formatFelt(state.chainBank)} FELT`} />
        <Stat label="Staker pot" value={`${formatFelt(state.chainStakers)} FELT`} />
        <Stat label="Burned" value={`${formatFelt(state.chainBurned)} FELT`} />
      </div>
      <p className="rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm">Signer {signerIndex + 1} of 3 · {short(state.address)}. Add to the house is one signature from this wallet. It does not ask the other signers. Taking FELT out is different: Propose, then Disconnect, connect signer 2 or 3, press Approve, then Send.</p>
      <Field label="Add to the house · FELT" value={fund} onChange={setFund} hint="50,000,000 is the most this token lets the house hold." />
      <Go disabled={busy || !signer} onClick={() => void run(async () => {
        if (!signer) throw new Error("Connect a signer wallet.");
        if (!live) throw new Error("Switch the signer wallet to Cronos.");
        await fundHouse(parseFelt(fund));
        await refresh();
      })}>{busy ? "Check the wallet" : "Add to the house"}</Go>
      {signer ? (
        <>
          <Field label="Destination" value={to} onChange={setTo} />
          <Field label="Amount · FELT" value={amount} onChange={setAmount} />
          <div className="flex flex-wrap gap-2">
            <Go disabled={busy} onClick={() => void run(async () => { await proposeHouse(to, parseFelt(amount)); })}>Propose</Go>
            <Go quiet disabled={busy} onClick={() => void run(async () => { await approveHouse(); })}>Approve</Go>
            <Go quiet disabled={busy} onClick={() => void run(async () => { await sendHouse(); })}>Send</Go>
            <Go quiet disabled={busy} onClick={() => void run(async () => { await rejectHouse(); })}>Reject</Go>
          </div>
        </>
      ) : <p className="text-sm text-muted">Connect an owner wallet to move the bank.</p>}
      {proposal ? <p className="text-sm">Waiting: {formatFelt(proposal.amount)} FELT to {short(proposal.to)}. Disconnect, connect a different signer, then press Approve. Send works after two signers have signed.</p> : <p className="text-sm text-muted">No withdrawal is waiting. A second signer is only used for a withdrawal.</p>}
      <Bomb text={local} />
    </div>
  );
}

function short(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

