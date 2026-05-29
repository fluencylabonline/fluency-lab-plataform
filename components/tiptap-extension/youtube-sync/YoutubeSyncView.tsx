"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { ref, onValue, set, off, DataSnapshot } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { 
  Search, 
  Link as LinkIcon, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Gauge, 
  RefreshCw, 
  Loader2, 
  Video,
  AlertCircle
} from "lucide-react";

import type { YouTubeVideo } from "@/modules/media/media.service";
import type { YouTubeNodeAttributes } from "./YoutubeSyncNode";
import "./youtube-sync.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface YouTubeSyncState {
  url: string;
  playing: boolean;
  currentTime: number;
  playbackRate: number; // Velocidade de reprodução sincronizada
  lastUpdatedBy: string;
  updatedAt: number;
}

export interface YouTubePlayerInstance {
  getCurrentTime: () => number;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (time: number, allowSeek: boolean) => void;
  destroy: () => void;
  setVolume: (vol: number) => void;
  getVolume: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setPlaybackRate: (rate: number) => void;
  getPlaybackRate: () => number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// ─── YouTube IFrame API loader ────────────────────────────────────────────────

let ytApiLoaded = false;
let ytApiLoading = false;
const ytApiCallbacks: (() => void)[] = [];

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (ytApiLoaded) return resolve();
    ytApiCallbacks.push(resolve);
    if (ytApiLoading) return;
    ytApiLoading = true;

    (window as unknown as Record<string, unknown>).onYouTubeIframeAPIReady =
      () => {
        ytApiLoaded = true;
        ytApiCallbacks.forEach((cb) => cb());
        ytApiCallbacks.length = 0;
      };

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
}

// ─── NodeView Component ───────────────────────────────────────────────────────

const SYNC_TOLERANCE_SEC = 2; // diferença mínima para re-sincronizar posição

export function YouTubeSyncView({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) {
  const { nodeId, url } = node.attrs as YouTubeNodeAttributes;

  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const playerDivId = `yt-player-${nodeId}`;
  const isSyncingRef = useRef(false);

  const [inputUrl, setInputUrl] = useState(url ?? "");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Volume & Speed states
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);

  // Search states
  const [activeTab, setActiveTab] = useState<"search" | "url">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const videoId = url ? extractYouTubeId(url) : null;

  // ── Publicar estado no Firebase Realtime DB ───────────────────────────────
  const publishState = useCallback(
    (playing: boolean, currentTime: number, playbackRateVal?: number) => {
      if (!nodeId) return;
      const rate = playbackRateVal !== undefined ? playbackRateVal : speed;
      const state: YouTubeSyncState = {
        url: url ?? "",
        playing,
        currentTime,
        playbackRate: rate,
        lastUpdatedBy:
          (globalThis as Record<string, unknown>).__userId?.toString() ??
          "anonymous",
        updatedAt: Date.now(),
      };
      set(ref(rtdb, `youtube-sync/${nodeId}`), state).catch(console.error);
    },
    [nodeId, url, speed],
  );

  // ── Inicializar player após API carregar ──────────────────────────────────
  useEffect(() => {
    if (!videoId) return;

    let destroyed = false;

    loadYouTubeAPI().then(() => {
      if (destroyed) return;

      const YTWindow = window as unknown as {
        YT: {
          Player: new (
            id: string,
            options: {
              videoId: string;
              playerVars: Record<string, number>;
              events: {
                onReady: () => void;
                onStateChange: (event: { data: number }) => void;
                onError: () => void;
              };
            },
          ) => {
            getCurrentTime: () => number;
            playVideo: () => void;
            pauseVideo: () => void;
            seekTo: (time: number, allowSeek: boolean) => void;
            destroy: () => void;
            setVolume: (vol: number) => void;
            getVolume: () => number;
            mute: () => void;
            unMute: () => void;
            isMuted: () => boolean;
            setPlaybackRate: (rate: number) => void;
            getPlaybackRate: () => number;
          };
          PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
        };
      };

      playerRef.current = new YTWindow.YT.Player(playerDivId, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1,
        },
        events: {
          onReady: () => {
            if (destroyed) return;
            setIsReady(true);
            const player = playerRef.current;
            if (player) {
              if (player.setVolume) player.setVolume(volume);
              if (player.mute && isMuted) player.mute();
              else if (player.unMute) player.unMute();
              if (player.setPlaybackRate) player.setPlaybackRate(speed);
            }
          },
          onStateChange: (event) => {
            if (destroyed || isSyncingRef.current) return;
            const YT = YTWindow.YT.PlayerState;
            const player = playerRef.current;
            if (event.data === YT.PLAYING) {
              setIsPlaying(true);
              publishState(true, player?.getCurrentTime() ?? 0);
            } else if (
              event.data === YT.PAUSED ||
              event.data === YT.ENDED
            ) {
              setIsPlaying(false);
              publishState(false, player?.getCurrentTime() ?? 0);
            }
          },
          onError: () => {
            if (!destroyed) setError("Não foi possível carregar o vídeo.");
          },
        },
      });
    });

    return () => {
      destroyed = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
      setIsReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, playerDivId]);

  // ── Escutar Firebase e sincronizar ────────────────────────────────────────
  useEffect(() => {
    if (!nodeId) return;

    const syncRef = ref(rtdb, `youtube-sync/${nodeId}`);

    const handleSnapshot = (snapshot: DataSnapshot) => {
      const state: YouTubeSyncState | null = snapshot.val();
      if (!state || !playerRef.current) return;

      const myId =
        (globalThis as Record<string, unknown>).__userId?.toString() ??
        "anonymous";
      if (state.lastUpdatedBy === myId) return;

      isSyncingRef.current = true;

      const player = playerRef.current;

      try {
        const currentTime = player.getCurrentTime?.() ?? 0;
        const timeDiff = Math.abs(currentTime - state.currentTime);

        if (timeDiff > SYNC_TOLERANCE_SEC) {
          player.seekTo?.(state.currentTime, true);
        }

        if (state.playing) {
          player.playVideo?.();
          setIsPlaying(true);
        } else {
          player.pauseVideo?.();
          setIsPlaying(false);
        }

        // Sincronização de velocidade
        if (state.playbackRate !== undefined && player.setPlaybackRate && player.getPlaybackRate) {
          const currentRate = player.getPlaybackRate();
          if (Math.abs(currentRate - state.playbackRate) > 0.01) {
            player.setPlaybackRate(state.playbackRate);
            setSpeed(state.playbackRate);
          }
        }
      } finally {
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 300);
      }
    };

    onValue(syncRef, handleSnapshot);

    return () => {
      off(syncRef, "value", handleSnapshot);
    };
  }, [nodeId]);

  // ── Controles locais ──────────────────────────────────────────────────────
  const handlePlay = () => {
    playerRef.current?.playVideo();
  };

  const handlePause = () => {
    playerRef.current?.pauseVideo();
  };

  const handleVolumeChange = (newVal: number) => {
    setVolume(newVal);
    const player = playerRef.current;
    if (player) {
      if (newVal > 0 && isMuted) {
        setIsMuted(false);
        player.unMute?.();
      }
      player.setVolume?.(newVal);
    }
  };

  const handleToggleMute = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);
    const player = playerRef.current;
    if (player) {
      if (newMute) {
        player.mute?.();
      } else {
        player.unMute?.();
        player.setVolume?.(volume);
      }
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    setSpeedOpen(false);
    const player = playerRef.current;
    if (player) {
      player.setPlaybackRate?.(newSpeed);
      const currentTime = player.getCurrentTime?.() ?? 0;
      publishState(isPlaying, currentTime, newSpeed);
    }
  };

  // ── Buscar vídeos do Youtube via API ──────────────────────────────────────
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/editor/youtube-search?q=${encodeURIComponent(query)}&maxResults=6`
      );
      if (!response.ok) {
        throw new Error("Não foi possível buscar vídeos.");
      }
      const data = (await response.json()) as { items: YouTubeVideo[] };
      setSearchResults(data.items || []);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Erro na pesquisa de vídeos.";
      setError(errMsg);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // ── Confirmar URL direta ──────────────────────────────────────────────────
  const handleUrlSubmit = () => {
    const trimmed = inputUrl.trim();
    if (!trimmed) return;
    if (!extractYouTubeId(trimmed)) {
      setError("URL do YouTube inválida.");
      return;
    }
    setError(null);
    updateAttributes({ url: trimmed });
  };

  // Close speed dropdown on outside click
  useEffect(() => {
    if (!speedOpen) return;
    const handleOutsideClick = () => setSpeedOpen(false);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [speedOpen]);

  // ── Render: entrada de URL ou Pesquisa ────────────────────────────────────
  if (!videoId) {
    return (
      <NodeViewWrapper>
        <div className="yt-sync-input-wrapper" data-selected={selected}>
          <div className="yt-sync-header">
            <div className="yt-sync-input-icon">
              <Video size={20} />
            </div>
            <h3 className="yt-sync-title">YouTube Sincronizado</h3>
            <p className="yt-sync-subtitle">
              Pesquise vídeos diretamente ou cole um link para assistir com sincronização em tempo real.
            </p>
          </div>

          {/* Abas de Navegação */}
          <div className="yt-sync-tabs">
            <button
              onClick={() => {
                setActiveTab("search");
                setError(null);
              }}
              className={`yt-sync-tab-btn ${activeTab === "search" ? "active" : ""}`}
            >
              <Search size={14} />
              Pesquisar Vídeo
            </button>
            <button
              onClick={() => {
                setActiveTab("url");
                setError(null);
              }}
              className={`yt-sync-tab-btn ${activeTab === "url" ? "active" : ""}`}
            >
              <LinkIcon size={14} />
              Colar Link
            </button>
          </div>

          {/* Conteúdo da Aba: Pesquisar */}
          {activeTab === "search" && (
            <div className="yt-sync-tab-content">
              <form onSubmit={handleSearch} className="yt-sync-search-form">
                <input
                  type="text"
                  placeholder="Pesquise por títulos, assuntos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="yt-sync-search-input"
                />
                <button 
                  type="submit" 
                  disabled={isSearching || !searchQuery.trim()} 
                  className="yt-sync-search-btn"
                >
                  {isSearching ? <Loader2 size={16} className="yt-spin" /> : "Pesquisar"}
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="yt-sync-search-results">
                  {searchResults.map((video) => (
                    <button
                      key={video.videoId}
                      onClick={() => updateAttributes({ url: `https://www.youtube.com/watch?v=${video.videoId}` })}
                      className="yt-sync-result-card"
                    >
                      <div className="yt-sync-result-thumb-wrapper">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="yt-sync-result-thumb"
                        />
                        <div className="yt-sync-result-play-overlay">
                          <Play size={20} fill="currentColor" />
                        </div>
                      </div>
                      <div className="yt-sync-result-info">
                        <span className="yt-sync-result-title" dangerouslySetInnerHTML={{ __html: video.title }} />
                        <span className="yt-sync-result-channel">{video.channelTitle}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conteúdo da Aba: Colar Link */}
          {activeTab === "url" && (
            <div className="yt-sync-tab-content">
              <div className="yt-sync-input-row">
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                  className="yt-sync-url-input"
                />
                <button onClick={handleUrlSubmit} className="yt-sync-confirm-btn">
                  Confirmar
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="yt-sync-error-box">
              <AlertCircle size={14} />
              <p className="yt-sync-error">{error}</p>
            </div>
          )}
        </div>
      </NodeViewWrapper>
    );
  }

  // ── Render: player com controles premium ──────────────────────────────────
  return (
    <NodeViewWrapper>
      <div className="yt-sync-player-wrapper" data-selected={selected}>
        {/* IFrame container */}
        <div className="yt-sync-embed">
          <div id={playerDivId} className="yt-sync-iframe" />
          {!isReady && (
            <div className="yt-sync-loading">
              <span className="yt-sync-spinner" />
            </div>
          )}
        </div>

        {/* Barra de controles premium */}
        <div className="yt-sync-controls">
          <div className="yt-sync-controls-left">
            {/* Play/Pause */}
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              disabled={!isReady}
              className="yt-sync-play-btn"
              aria-label={isPlaying ? "Pausar" : "Reproduzir"}
            >
              {isPlaying ? (
                <Pause size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" />
              )}
            </button>

            {/* Volume Control */}
            <div className="yt-sync-volume-control">
              <button
                onClick={handleToggleMute}
                disabled={!isReady}
                className="yt-sync-icon-btn"
                title={isMuted ? "Ativar som" : "Desativar som"}
              >
                {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                disabled={!isReady}
                className="yt-sync-volume-slider"
                style={{
                  background: `linear-gradient(to right, var(--color-primary, #6366f1) 0%, var(--color-primary, #6366f1) ${isMuted ? 0 : volume}%, #e5e7eb ${isMuted ? 0 : volume}%, #e5e7eb 100%)`
                }}
              />
            </div>
          </div>

          <div className="yt-sync-controls-right">
            {/* Speed Control (Playback Rate) */}
            <div className="yt-sync-speed-control">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSpeedOpen(!speedOpen);
                }}
                disabled={!isReady}
                className="yt-sync-speed-btn"
                title="Velocidade de reprodução"
              >
                <Gauge size={14} />
                <span>{speed === 1 ? "Normal" : `${speed}x`}</span>
              </button>

              {speedOpen && (
                <div className="yt-sync-speed-dropdown" onClick={(e) => e.stopPropagation()}>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleSpeedChange(rate)}
                      className={`yt-sync-speed-option ${speed === rate ? "selected" : ""}`}
                    >
                      {rate === 1 ? "Normal" : `${rate}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Sincronização */}
            <span className="yt-sync-status-badge">
              <span className={`yt-sync-status-dot ${isReady ? (isPlaying ? "playing" : "paused") : "loading"}`} />
              {isReady
                ? isPlaying
                  ? "Sincronizado"
                  : "Pausado"
                : "Carregando"}
            </span>

            {/* Trocar Vídeo */}
            <button
              className="yt-sync-change-btn"
              onClick={() => updateAttributes({ url: "" })}
              title="Trocar vídeo"
            >
              <RefreshCw size={12} />
              Trocar
            </button>
          </div>
        </div>

        {error && (
          <div className="yt-sync-error-box">
            <AlertCircle size={14} />
            <p className="yt-sync-error">{error}</p>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

