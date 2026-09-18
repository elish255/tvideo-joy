import { Link, createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  CheckCircle2,
  CircleAlert,
  Clock3,
  MessageCircle,
  MessageSquareText,
  Play,
  ShoppingBag,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { BUY_URL, formatDuration, getVideo, REGISTER_URL, videos } from "@/lib/tvideo-data";
import { creditVideoReward, formatMoney } from "@/lib/tvideo-wallet";

export const Route = createFileRoute("/video/$videoId")({
  head: ({ params }) => {
    const video = getVideo(Number(params.videoId));
    const title = video ? `${video.title} | Tvideo` : "Tazama Video | Tvideo";
    return {
      meta: [
        { title },
        { name: "description", content: "Tazama video ya biashara na wasiliana na muuzaji moja kwa moja." },
        { property: "og:title", content: title },
        { property: "og:description", content: "Tazama video ya biashara na wasiliana na muuzaji moja kwa moja." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(video
          ? [
              { property: "og:image", content: video.cover },
              { name: "twitter:image", content: video.cover },
            ]
          : []),
      ],
    };
  },
  component: VideoPage,
});

function VideoPage() {
  const { videoId } = Route.useParams();
  const video = useMemo(() => getVideo(Number(videoId)) ?? videos[0], [videoId]);
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const bestTimeRef = useRef(0);
  const finishedRef = useRef(false);
  const [remaining, setRemaining] = useState(video.duration);
  const [needsPlay, setNeedsPlay] = useState(false);
  const [mutedAutoPlay, setMutedAutoPlay] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [completeMessage, setCompleteMessage] = useState("");

  useEffect(() => {
    setRemaining(video.duration);
    bestTimeRef.current = 0;
    finishedRef.current = false;
    setCompleteMessage("");
    setNeedsPlay(false);
    setMutedAutoPlay(false);

    const player = playerRef.current;
    if (!player) return;

    player.load();
    const playVideo = async () => {
      try {
        player.muted = false;
        await player.play();
      } catch {
        try {
          player.muted = true;
          setMutedAutoPlay(true);
          await player.play();
        } catch {
          setNeedsPlay(true);
        }
      }
    };
    void playVideo();
  }, [video]);

  const completeVideo = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const player = playerRef.current;
    if (player) player.pause();
    setRemaining(0);
    const result = creditVideoReward(video.id, video.reward);
    setCompleteMessage(
      result.credited
        ? `Umefanikiwa! Umeongezewa ${formatMoney(video.reward)} kwenye balance.`
        : "Tayari umeshalipwa kwa video hii.",
    );
  };

  const handleTimeUpdate = () => {
    const player = playerRef.current;
    if (!player || finishedRef.current) return;
    if (player.currentTime <= bestTimeRef.current + 1.25) {
      bestTimeRef.current = Math.max(bestTimeRef.current, player.currentTime);
    }
    const nextRemaining = Math.max(0, Math.ceil(video.duration - Math.min(bestTimeRef.current, video.duration)));
    setRemaining(nextRemaining);
    if (nextRemaining === 0 || player.currentTime >= video.duration) {
      completeVideo();
    }
  };

  const handleSeeking = () => {
    const player = playerRef.current;
    if (!player || finishedRef.current) return;
    if (player.currentTime > bestTimeRef.current + 1) {
      player.currentTime = bestTimeRef.current;
    }
  };

  const playManually = async () => {
    const player = playerRef.current;
    if (!player) return;
    setNeedsPlay(false);
    await player.play().catch(() => setNeedsPlay(true));
  };

  const unmute = () => {
    const player = playerRef.current;
    if (!player) return;
    player.muted = false;
    setMutedAutoPlay(false);
  };

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-header-border bg-header/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link
            to="/"
            className="grid size-10 place-items-center rounded-md text-header-muted transition hover:bg-header-hover hover:text-foreground"
            aria-label="Rudi kwenye dashboard"
          >
            <X className="size-5" aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-extrabold">{video.title}</p>
            <p className="text-xs font-medium uppercase text-header-muted">{video.category}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
        <div className="relative overflow-hidden rounded-lg border border-card-border bg-card shadow-md shadow-card-shadow">
          <video
            ref={playerRef}
            src={video.src}
            poster={video.cover}
            className="aspect-video w-full object-cover"
            autoPlay
            playsInline
            preload="auto"
            controls
            onTimeUpdate={handleTimeUpdate}
            onSeeking={handleSeeking}
            onEnded={completeVideo}
            aria-label="Video ya biashara"
          />
          <Button
            type="button"
            variant="withdraw"
            className="animate-buy-blink absolute left-1/2 top-4 z-10 -translate-x-1/2 px-5 font-display text-lg font-extrabold uppercase shadow-xl"
            onClick={() => setBuyOpen(true)}
          >
            Nunua / Buy
          </Button>
          {mutedAutoPlay ? (
            <Button
              type="button"
              variant="overlay"
              className="absolute bottom-3 right-3 z-10"
              aria-label="Washa sauti"
              onClick={unmute}
            >
              <VolumeX className="size-5" aria-hidden="true" />
              Washa sauti
            </Button>
          ) : null}
          {needsPlay ? (
            <button
              type="button"
              onClick={playManually}
              className="absolute inset-0 z-10 grid place-items-center bg-playing-overlay/60"
              aria-label="Cheza video"
            >
              <span className="grid size-20 place-items-center rounded-full bg-accent text-accent-foreground shadow-2xl transition hover:scale-105">
                <Play className="size-10 fill-current" aria-hidden="true" />
              </span>
            </button>
          ) : null}
        </div>

        <div className="mt-4 rounded-lg border border-card-border bg-card p-4 text-card-foreground shadow-md shadow-card-shadow" aria-live="polite">
          {completeMessage ? (
            <div className="rounded-lg bg-profit p-5 text-profit-foreground shadow-lg shadow-profit-shadow" role="status">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-10 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-display text-xl font-extrabold">Malipo yamekamilika</p>
                  <p className="mt-1 text-sm font-semibold text-profit-muted">{completeMessage}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-lg bg-receipt-bg p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Clock3 className="size-6 text-primary" aria-hidden="true" />
                    <p className="font-display text-lg font-extrabold">Muda uliobaki</p>
                  </div>
                  <p className="font-display text-4xl font-extrabold text-primary">{remaining} sek.</p>
                </div>
              </div>

              <div className="mt-6 space-y-5 text-lg">
                <InfoLine icon={<BadgeCheck className="size-7 text-success" aria-hidden="true" />}>
                  <span className="font-display font-extrabold">Malipo:</span> {formatMoney(video.reward)}
                </InfoLine>
                <InfoLine icon={<CircleAlert className="size-7 text-destructive" aria-hidden="true" />}>
                  <span className="font-display font-extrabold">Tazama hadi mwisho.</span> Usipomaliza, hakuna malipo.
                </InfoLine>
                <InfoLine icon={<ShoppingBag className="size-7 text-accent" aria-hidden="true" />}>
                  Ukipenda bidhaa, gusa <span className="font-display font-extrabold uppercase">Nunua/Buy</span> kwenye video.
                </InfoLine>
              </div>
            </>
          )}
        </div>

        <Button asChild variant="accent" size="lg" className="mt-7 w-full font-display text-xl font-extrabold">
          <a href={REGISTER_URL} target="_blank" rel="noopener noreferrer">
            Fungua account hapa
          </a>
        </Button>
      </div>

      <BuyDialog open={buyOpen} title={video.title} onClose={() => setBuyOpen(false)} />
    </main>
  );
}

function InfoLine({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[2.25rem_1fr] gap-4 leading-relaxed text-card-foreground">
      <div className="pt-0.5">{icon}</div>
      <p>{children}</p>
    </div>
  );
}

function BuyDialog({ open, title, onClose }: { open: boolean; title: string; onClose: () => void }) {
  if (!open) return null;
  const smsHref = `sms:+255700000000?body=${encodeURIComponent(`Habari, nataka kununua ${title}`)}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-modal-backdrop p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-card text-card-foreground shadow-2xl">
        <header className="flex items-center justify-between border-b border-card-border px-5 py-4">
          <h2 className="font-display text-lg font-extrabold">Nunua / Buy</h2>
          <Button type="button" variant="ghost" size="icon" className="text-card-muted hover:bg-muted" aria-label="Funga" onClick={onClose}>
            <X className="size-5" aria-hidden="true" />
          </Button>
        </header>
        <div className="space-y-3 p-5">
          <p className="text-sm font-semibold text-card-muted">Chagua njia ya kuwasiliana na muuzaji.</p>
          <Button asChild variant="primary" className="w-full">
            <a href={BUY_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" aria-hidden="true" />
              WhatsApp
            </a>
          </Button>
          <Button asChild variant="card" className="w-full">
            <a href={smsHref}>
              <MessageSquareText className="size-4" aria-hidden="true" />
              SMS
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
