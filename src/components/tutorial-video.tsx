import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const VIDEO_ID = "kfuZbPFEzFo";

/**
 * YouTube tutorial player.
 *
 * 1. First tries to autoplay WITH sound (works when the browser allows it,
 *    e.g. returning visitors with high media engagement).
 * 2. If the browser blocks unmuted autoplay, falls back to muted autoplay
 *    immediately so the video always starts by itself.
 * 3. While muted, the first tap/click/keypress anywhere on the page — or the
 *    visible "শব্দ চালু করুন" button — turns the sound on.
 */
export function TutorialVideo() {
  const holder = useRef<HTMLDivElement>(null);
  const player = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const host = holder.current;
    if (!host) return;

    let disposed = false;
    let playState = -1;

    const applyMuteState = () => {
      const p = player.current;
      if (p && typeof p.isMuted === "function") {
        try {
          setMuted(!!p.isMuted());
        } catch {
          /* ignore */
        }
      }
    };

    // First user gesture anywhere on the page unmutes the tutorial.
    const unmute = () => {
      const p = player.current;
      if (!p || typeof p.isMuted !== "function") return;
      try {
        if (p.isMuted()) {
          p.unMute();
          p.setVolume?.(100);
          setMuted(false);
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("pointerdown", unmute);
    window.addEventListener("touchend", unmute);
    window.addEventListener("keydown", unmute);

    const create = (): boolean => {
      if (disposed || !window.YT?.Player) return false;
      const el = document.createElement("div");
      host.appendChild(el);
      try {
        player.current = new window.YT.Player(el, {
          videoId: VIDEO_ID,
          playerVars: {
            autoplay: 1,
            loop: 1,
            playlist: VIDEO_ID,
            rel: 0,
            playsinline: 1,
            modestbranding: 1,
          },
          events: {
            onReady: () => {
              try {
                player.current?.playVideo();
              } catch {
                /* ignore */
              }
              // If unmuted autoplay was blocked, drop to muted autoplay
              // so the video still starts by itself.
              window.setTimeout(() => {
                const p = player.current;
                if (disposed || !p || playState === 1) return;
                try {
                  if (!p.getPlayerState || p.getPlayerState() !== 1) {
                    p.mute?.();
                    p.playVideo?.();
                  }
                } catch {
                  /* ignore */
                }
              }, 3000);
            },
            onStateChange: () => {
              const p = player.current;
              try {
                playState = p?.getPlayerState?.() ?? -1;
              } catch {
                /* ignore */
              }
              applyMuteState();
            },
          },
        });
      } catch {
        host.removeChild(el);
        return false;
      }
      return true;
    };

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      document.head.appendChild(tag);
    }

    const started = Date.now();
    const loadIv = window.setInterval(() => {
      if (create()) {
        window.clearInterval(loadIv);
        setReady(true);
      } else if (Date.now() - started > 12000) {
        // API never loaded — keep the plain iframe fallback visible.
        window.clearInterval(loadIv);
      }
    }, 250);

    // Keep the button in sync with the real mute state.
    const muteIv = window.setInterval(applyMuteState, 500);

    return () => {
      disposed = true;
      window.clearInterval(loadIv);
      window.clearInterval(muteIv);
      window.removeEventListener("pointerdown", unmute);
      window.removeEventListener("touchend", unmute);
      window.removeEventListener("keydown", unmute);
      try {
        player.current?.destroy?.();
      } catch {
        /* ignore */
      }
      host.innerHTML = "";
    };
  }, []);

  function enableSound() {
    const p = player.current;
    try {
      p?.unMute?.();
      p?.setVolume?.(100);
      p?.playVideo?.();
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border shadow-card">
      {!ready && (
        <iframe
          className="aspect-video w-full"
          src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${VIDEO_ID}&rel=0&playsinline=1&modestbranding=1`}
          title="Business Manager Pro — ব্যবহারের টিউটোরিয়াল"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      )}
      <div ref={holder} className={ready ? "aspect-video w-full [&_iframe]:h-full [&_iframe]:w-full" : "hidden"} />
      {muted && ready && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center">
          <Button
            size="lg"
            onClick={enableSound}
            className="gap-2 rounded-full shadow-lg"
            aria-label="ভিডিওর শব্দ চালু করুন"
          >
            <Volume2 className="size-5" /> শব্দ চালু করুন
          </Button>
        </div>
      )}
    </div>
  );
}
