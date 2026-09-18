import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  CircleUserRound,
  History,
  MessageCircle,
  Play,
  ReceiptText,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDuration, REGISTER_URL, videos } from "@/lib/tvideo-data";
import { emptyWallet, formatMoney, readWallet, requestWithdrawal, WALLET_UPDATE_EVENT } from "@/lib/tvideo-wallet";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tvideo | Tazama Video Za Wafanyabiashara" },
      {
        name: "description",
        content: "Tazama video za wafanyabiashara na ulipwe kulingana na muda uliotazama.",
      },
      { property: "og:title", content: "Tvideo | Tazama Video Za Wafanyabiashara" },
      {
        property: "og:description",
        content: "Tazama video za wafanyabiashara na ulipwe kulingana na muda uliotazama.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [wallet, setWallet] = useState(emptyWallet);
  const [hiddenVideos, setHiddenVideos] = useState<number[]>([]);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const syncWallet = () => setWallet(readWallet());
    syncWallet();
    window.addEventListener(WALLET_UPDATE_EVENT, syncWallet);
    window.addEventListener("storage", syncWallet);
    return () => {
      window.removeEventListener(WALLET_UPDATE_EVENT, syncWallet);
      window.removeEventListener("storage", syncWallet);
    };
  }, []);

  const visibleVideos = useMemo(
    () => videos.filter((video) => !hiddenVideos.includes(video.id)),
    [hiddenVideos],
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-header-border bg-header/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-md bg-brand-mark text-brand-mark-foreground shadow-sm">
              <Play className="size-5 fill-current" aria-hidden="true" />
            </div>
            <div>
              <p className="font-display text-lg font-extrabold leading-none">Tvideo</p>
              <p className="mt-1 text-xs text-header-muted">Watch. Earn. Repeat.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-header-muted hover:bg-header-hover hover:text-foreground"
              aria-label="Notifications"
              onClick={() => setNotificationsOpen(true)}
            >
              <Bell className="size-5" aria-hidden="true" />
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="text-header-muted hover:bg-header-hover hover:text-foreground"
              aria-label="Profile"
            >
              <a href={REGISTER_URL} target="_blank" rel="noopener noreferrer">
                <CircleUserRound className="size-9" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pb-24 pt-6">
        <section aria-labelledby="dashboard-heading">
          <p className="text-sm font-semibold text-page-muted">Welcome back</p>
          <h1 id="dashboard-heading" className="mt-1 font-display text-3xl font-extrabold">
            Your Dashboard
          </h1>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <article className="rounded-lg bg-profit p-4 text-profit-foreground shadow-lg shadow-profit-shadow">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-profit-muted">Net Profit</p>
                <TrendingUp className="size-5" aria-hidden="true" />
              </div>
              <p className="mt-5 text-2xl font-extrabold">{formatMoney(wallet.profit)}</p>
              <p className="mt-1 text-xs text-profit-muted">This month</p>
            </article>

            <article className="rounded-lg bg-balance p-4 text-balance-foreground shadow-lg shadow-balance-shadow">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-balance-muted">Balance</p>
                <Wallet className="size-5" aria-hidden="true" />
              </div>
              <p className="mt-5 text-2xl font-extrabold">{formatMoney(wallet.balance)}</p>
              <Button
                type="button"
                variant="withdraw"
                size="compact"
                className="mt-3 w-full"
                onClick={() => setWithdrawOpen(true)}
              >
                Toa pesa
              </Button>
            </article>
          </div>

          <Button
            type="button"
            variant="card"
            className="relative z-10 mt-3 w-full font-display font-extrabold"
            onClick={() => setHistoryOpen(true)}
          >
            <History className="size-4" aria-hidden="true" />
            Withdraw history
          </Button>

          <div className="mt-4 rounded-lg border border-card-border bg-card p-4 text-card-foreground shadow-md shadow-card-shadow">
            <p className="font-display text-lg font-extrabold leading-snug">
              Tazama video za wafanyabiashara — ulipwe kulingana na muda uliotazama!
            </p>
            <p className="mt-1.5 text-sm font-semibold text-card-muted">
              Kila video unayomaliza ni pesa mkononi. Fungua account yako sasa ili malipo yako yasipotee.
            </p>
            <Button asChild variant="accent" className="mt-3 w-full font-display text-base font-extrabold uppercase">
              <a href={REGISTER_URL} target="_blank" rel="noopener noreferrer">
                Fungua account sasa
              </a>
            </Button>
          </div>
        </section>

        <section className="mt-9" aria-labelledby="videos-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-accent">Available tasks today</p>
              <h2 id="videos-heading" className="mt-1 font-display text-2xl font-extrabold">
                Videos to Watch Today
              </h2>
            </div>
            <span className="shrink-0 rounded-md bg-count px-2.5 py-1 text-xs font-bold text-count-foreground">
              {visibleVideos.length} videos
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {visibleVideos.map((video) => (
              <VideoCard key={video.id} video={video} onCancel={() => setHiddenVideos((ids) => [...ids, video.id])} />
            ))}
          </div>
        </section>
      </div>

      <Button asChild variant="support" className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 shadow-xl">
        <a href="https://wa.me/255700000000" target="_blank" rel="noopener noreferrer">
          <MessageCircle className="size-4" aria-hidden="true" />
          Huduma kwa wateja
        </a>
      </Button>

      <WithdrawDialog open={withdrawOpen} balance={wallet.balance} onClose={() => setWithdrawOpen(false)} />
      <HistoryDialog open={historyOpen} entries={wallet.withdrawals} onClose={() => setHistoryOpen(false)} />
      <SimpleDialog open={notificationsOpen} title="Notifications" onClose={() => setNotificationsOpen(false)}>
        <p className="text-sm font-semibold text-card-muted">Hakuna taarifa mpya kwa sasa.</p>
      </SimpleDialog>
    </main>
  );
}

type VideoCardProps = {
  video: (typeof videos)[number];
  onCancel: () => void;
};

function VideoCard({ video, onCancel }: VideoCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-card-border bg-card text-card-foreground shadow-md shadow-card-shadow">
      <Link to="/video/$videoId" params={{ videoId: String(video.id) }} className="group block" aria-label={`Play ${video.title}`}>
        <div className="relative aspect-video overflow-hidden bg-image-shade">
          <video className="h-full w-full object-cover" src={video.src} poster={video.cover} preload="metadata" muted playsInline />
          <div className="absolute left-3 top-3 flex items-center gap-2">
            <span className="rounded-md bg-image-label px-2.5 py-1 text-xs font-extrabold text-image-label-foreground">
              # {String(video.id).padStart(2, "0")}
            </span>
            <span className="rounded-md bg-image-label px-2.5 py-1 text-xs font-extrabold text-image-label-foreground">
              {formatDuration(video.duration)}
            </span>
          </div>
          <span className="absolute inset-0 grid place-items-center bg-playing-overlay/0 transition group-hover:bg-playing-overlay/60">
            <span className="grid size-14 place-items-center rounded-full bg-playing-icon text-playing-icon-foreground shadow-xl transition group-hover:scale-105">
              <Play className="size-7 fill-current" aria-hidden="true" />
            </span>
          </span>
        </div>
      </Link>
      <div className="p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-accent">{video.category}</p>
        <h3 className="mt-1 font-display text-lg font-extrabold leading-tight">{video.title}</h3>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-card-muted">Reward</p>
            <p className="font-display text-xl font-extrabold text-reward">{formatMoney(video.reward)}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button asChild variant="primary" size="compact">
              <Link to="/video/$videoId" params={{ videoId: String(video.id) }}>
                <Play className="size-4 fill-current" aria-hidden="true" />
                Play
              </Link>
            </Button>
            <Button type="button" variant="cancel" size="compact" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

type DialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

function SimpleDialog({ open, title, onClose, children }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-modal-backdrop p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-card text-card-foreground shadow-2xl">
        <header className="flex items-center justify-between border-b border-card-border px-5 py-4">
          <h2 className="font-display text-lg font-extrabold">{title}</h2>
          <Button type="button" variant="ghost" size="icon" className="text-card-muted hover:bg-muted" aria-label="Funga" onClick={onClose}>
            <X className="size-5" aria-hidden="true" />
          </Button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function WithdrawDialog({ open, balance, onClose }: { open: boolean; balance: number; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setMessage("");
    }
  }, [open]);

  if (!open) return null;

  const submit = () => {
    const value = Number(amount);
    const result = requestWithdrawal(value);
    if (!result.ok) {
      setMessage("Kiasi ulichoingiza ni kikubwa kuliko salio lako.");
      return;
    }
    setMessage("Ombi lako la kutoa pesa limepokelewa.");
  };

  return (
    <SimpleDialog open={open} title="Toa pesa" onClose={onClose}>
      <div className="text-center">
        <p className="font-display text-base font-extrabold">Ingiza kiasi unachotaka kutoa</p>
        <p className="mt-1 text-sm font-semibold text-card-muted">Salio lako: {formatMoney(balance)}</p>
        <label htmlFor="withdraw-amount" className="sr-only">
          Kiasi
        </label>
        <div className="mt-6 flex items-center justify-center gap-3 rounded-lg border-2 border-accent bg-background px-5 py-7 shadow-lg shadow-accent/20 focus-within:ring-4 focus-within:ring-accent/20">
          <span className="font-display text-2xl font-extrabold text-accent">TSh</span>
          <input
            id="withdraw-amount"
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0"
            className="w-full min-w-0 bg-transparent text-center font-display text-4xl font-extrabold text-foreground outline-none placeholder:text-card-muted"
          />
        </div>
        {message ? (
          <p className={cn("mt-4 text-sm font-bold", message.includes("limepokelewa") ? "text-success" : "text-destructive")}>{message}</p>
        ) : null}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button type="button" variant="cancel" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="withdraw" onClick={submit}>
            Toa pesa
          </Button>
        </div>
      </div>
    </SimpleDialog>
  );
}

function HistoryDialog({ open, entries, onClose }: { open: boolean; entries: typeof emptyWallet.withdrawals; onClose: () => void }) {
  return (
    <SimpleDialog open={open} title="Withdraw history" onClose={onClose}>
      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-card-border bg-receipt-bg p-5 text-center">
          <ReceiptText className="mx-auto size-8 text-receipt-id" aria-hidden="true" />
          <p className="mt-3 font-bold text-card-foreground">Hakuna historia ya kutoa pesa.</p>
          <p className="mt-1 text-sm text-card-muted">Maliza video kisha ujaribu kutoa pesa.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-receipt-border bg-receipt-bg p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-display font-extrabold text-receipt-id">{entry.id}</p>
                <span className="rounded-md bg-receipt-chip px-2 py-1 text-xs font-bold text-receipt-chip-foreground">Pending</span>
              </div>
              <p className="mt-2 font-bold text-card-foreground">{formatMoney(entry.amount)}</p>
              <p className="mt-1 text-xs font-semibold text-receipt-foot">{new Date(entry.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </SimpleDialog>
  );
}
