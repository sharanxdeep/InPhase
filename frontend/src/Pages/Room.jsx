import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import { extractVideoId } from "../utils/extractVideoId";

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
);
const PauseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
);
const RewindIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11 5v14L2 12zm10 0v14l-9-7z" /></svg>
);
const ForwardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 5v14l9-7zM3 5v14l9-7z" /></svg>
);
const MuteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12A4.5 4.5 0 0014 8v2.2l2.45 2.45c.03-.2.05-.43.05-.65zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.92 8.92 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
);
const UnmuteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8v8a4.5 4.5 0 002.5-4zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
);
const ChevronIcon = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);
const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z" /></svg>
);

const Room = () => {
  const { roomId } = useParams();
  const playerRef = useRef(null);
  const isRemoteActionRef = useRef(false);
  const isLoadingVideoRef = useRef(false);
  const messagesEndRef = useRef(null);
  const messagesScrollRef = useRef(null);

  const [isHost, setIsHost] = useState(false);
  const [allowGuestControl, setAllowGuestControl] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [controlsOpen, setControlsOpen] = useState(true);
  const [hasVideo, setHasVideo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [guestName, setGuestName] = useState(() => sessionStorage.getItem("guestName") || "");
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [hostCheckDone, setHostCheckDone] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(null);
  const [viewportOffset, setViewportOffset] = useState(0);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const canEnterRoom = hostCheckDone && (isHost || guestName);
  const myId = isHost ? localStorage.getItem("hostId") : sessionStorage.getItem("guestId");
  const myName = isHost ? localStorage.getItem("hostName") : guestName;
  const canControl = isHost || allowGuestControl;
  const hasToggleableContent = canControl || isHost;

  const handleSetGuestName = () => {
    if (!nameInput.trim()) {
      setNameError("Enter your name to join the room");
      return;
    }
    let guestId = sessionStorage.getItem("guestId");
    if (!guestId) {
      guestId = crypto.randomUUID();
      sessionStorage.setItem("guestId", guestId);
    }
    sessionStorage.setItem("guestName", nameInput.trim());
    setGuestName(nameInput.trim());
  };

  const handlePlay = () => {
    if (!isPlayerReady) return;
    playerRef.current.playVideo();
  };

  const handlePause = () => {
    if (!isPlayerReady) return;
    playerRef.current.pauseVideo();
  };

  const handleForward = () => {
    if (!isPlayerReady) return;
    const newTime = playerRef.current.getCurrentTime() + 10;
    playerRef.current.seekTo(newTime, true);
    socket.emit("video-action", { roomId, type: "seek", time: newTime });
  };

  const handleRewind = () => {
    if (!isPlayerReady) return;
    const newTime = Math.max(0, playerRef.current.getCurrentTime() - 10);
    playerRef.current.seekTo(newTime, true);
    socket.emit("video-action", { roomId, type: "seek", time: newTime });
  };

  const handleToggleMute = () => {
    if (!isPlayerReady) return;
    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(60);
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleToggleGuestControl = (e) => {
    socket.emit("toggle-guest-control", { roomId, allow: e.target.checked });
  };

  const handleLoadVideo = () => {
    if (!isPlayerReady) return;
    const videoId = extractVideoId(videoUrlInput);
    if (!videoId) {
      alert("Couldn't parse a valid YouTube video ID from that link.");
      return;
    }
    isLoadingVideoRef.current = true;
    playerRef.current.loadVideoById(videoId);
    setHasVideo(true);
    socket.emit("video-action", { roomId, type: "load-video", videoId });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleSendMessage = () => {
    const text = chatInput.trim();
    if (!text) return;
    socket.emit("chat-message", { roomId, senderId: myId, senderName: myName, text });
    setChatInput("");
  };

  useEffect(() => {
    if (!window.visualViewport) return;
    const vv = window.visualViewport;
    const handleResize = () => {
      setViewportHeight(vv.height);
      setViewportOffset(vv.offsetTop);
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ block: "end" });
      });
    };
    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);
    handleResize();
    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleResize);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, controlsOpen]);

  useEffect(() => {
    const hostId = localStorage.getItem("hostId");
    const joinRoom = () => {
      socket.emit("join-room", { roomId, hostId });
    };

    joinRoom(); // initial join

    socket.on("connect", joinRoom); // re-join on every reconnect too

    return () => {
      socket.off("connect", joinRoom);
    };
  }, [roomId]);

  useEffect(() => {
    if (!canEnterRoom) return;

    const createPlayer = () => {
      playerRef.current = new window.YT.Player("yt-player", {
        playerVars: {
          autoplay: 0,
          origin: window.location.origin,
          mute: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          fs: 0,
          iv_load_policy: 3,
        },
        events: {
          onReady: () => {
            setIsPlayerReady(true);
          },
          onStateChange: (event) => {
            if (
              event.data !== window.YT.PlayerState.PLAYING &&
              event.data !== window.YT.PlayerState.PAUSED
            ) {
              return;
            }
            if (isLoadingVideoRef.current) {
              if (event.data === window.YT.PlayerState.PLAYING) {
                isLoadingVideoRef.current = false;
              }
              return;
            }
            if (isRemoteActionRef.current) {
              isRemoteActionRef.current = false;
              return;
            }
            if (event.data === window.YT.PlayerState.PLAYING) {
              socket.emit("video-action", { roomId, type: "play" });
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              socket.emit("video-action", { roomId, type: "pause" });
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
    }
  }, [canEnterRoom]);

  useEffect(() => {
    const handleRemoteAction = ({ type, time, videoId }) => {
      if (!isPlayerReady) return;
      if (type === "load-video") {
        isLoadingVideoRef.current = true;
        playerRef.current.loadVideoById(videoId);
        setHasVideo(true);
        return;
      }
      isRemoteActionRef.current = true;
      if (type === "play") playerRef.current.playVideo();
      else if (type === "pause") playerRef.current.pauseVideo();
      else if (type === "seek") playerRef.current.seekTo(time, true);

      setTimeout(() => {
        isRemoteActionRef.current = false;
      }, 1000);
    };

    const handleSyncTime = ({ time }) => {
      if (!isPlayerReady || !playerRef.current?.getCurrentTime) return;
      const myTime = playerRef.current.getCurrentTime();
      const drift = Math.abs(myTime - time);
      if (drift > 1.5) {
        playerRef.current.seekTo(time, true);
      }
    };

    const handleGuestControlUpdate = ({ allowGuestControl }) => {
      setAllowGuestControl(allowGuestControl);
    };

    const handleSyncRequested = ({ requesterId }) => {
      if (!isPlayerReady || !playerRef.current?.getVideoData) return;
      const videoData = playerRef.current.getVideoData();
      const time = playerRef.current.getCurrentTime();
      const isPlaying = playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING;

      socket.emit("sync-response", {
        requesterId,
        videoId: videoData?.video_id || null,
        time,
        isPlaying,
      });
    };

    const handleSyncResponse = ({ videoId, time, isPlaying }) => {
      if (!videoId || !playerRef.current) return;
      isLoadingVideoRef.current = true;
      playerRef.current.loadVideoById(videoId);
      setHasVideo(true);

      setTimeout(() => {
        playerRef.current.seekTo(time, true);
        if (isPlaying) {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      }, 800);
    };

    const handleChatMessage = (message) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          senderId: message.senderId,
          senderName: message.senderName,
          text: message.text,
          sentAt: new Date(message.sentAt).getTime(),
        },
      ]);
    };

    socket.on("video-action", handleRemoteAction);
    socket.on("sync-time", handleSyncTime);
    socket.on("guest-control-updated", handleGuestControlUpdate);
    socket.on("sync-requested", handleSyncRequested);
    socket.on("sync-response", handleSyncResponse);
    socket.on("chat-message", handleChatMessage);

    return () => {
      socket.off("video-action", handleRemoteAction);
      socket.off("sync-time", handleSyncTime);
      socket.off("guest-control-updated", handleGuestControlUpdate);
      socket.off("sync-requested", handleSyncRequested);
      socket.off("sync-response", handleSyncResponse);
      socket.off("chat-message", handleChatMessage);
    };
  }, [isPlayerReady]);

  useEffect(() => {
    const fetchRoom = async () => {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/rooms/${roomId}`);
      const room = await res.json();
      const myHostId = localStorage.getItem("hostId");
      setIsHost(room.hostId === myHostId);
      setAllowGuestControl(room.allowGuestControl);
      if (room.videoId) setHasVideo(true);
      setMessages(
        (room.messages || []).map((m) => ({
          id: crypto.randomUUID(),
          senderId: m.senderId,
          senderName: m.senderName,
          text: m.text,
          sentAt: new Date(m.sentAt).getTime(),
        }))
      );
      setHostCheckDone(true);
    };
    fetchRoom();
  }, [roomId]);

  useEffect(() => {
    if (!isHost) return;

    const intervalId = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        socket.emit("sync-time", { roomId, time });
      }
    }, 7000);

    return () => clearInterval(intervalId);
  }, [isHost, roomId]);

  useEffect(() => {
    if (!isPlayerReady || isHost) return;
    socket.emit("request-sync", { roomId });
  }, [isPlayerReady, isHost, roomId]);

  if (!canEnterRoom) {
    return (
      <div className="min-h-screen w-full bg-[#0a0a0f] font-body text-white flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-white/40 mb-6">Enter your name to join the room</p>
        <input
          type="text"
          placeholder="Your name"
          value={nameInput}
          onChange={(e) => {
            setNameInput(e.target.value);
            if (nameError) setNameError("");
          }}
          maxLength={30}
          onKeyDown={(e) => e.key === "Enter" && handleSetGuestName()}
          className="w-full max-w-[260px] bg-white/5 border border-white/10 rounded-full px-5 py-3 text-base text-center placeholder:text-white/25 focus:outline-none focus:bg-white/10"
        />
        {nameError && <p className="text-xs text-red-400 mt-2 mb-1">{nameError}</p>}
        <button
          onClick={handleSetGuestName}
          className={`px-8 py-3.5 rounded-full bg-white text-black font-medium text-sm active:scale-[0.97] transition-transform ${nameError ? "mt-1" : "mt-4"}`}
        >
          Join room
        </button>
      </div>
    );
  }

  let lastSenderId = null;

  return (
    <div
      className="w-full flex flex-col bg-[#0a0a0f] font-body text-white overflow-hidden"
      style={{
        position: "fixed",
        top: viewportOffset,
        left: 0,
        right: 0,
        height: viewportHeight ? `${viewportHeight}px` : "100dvh",
        paddingTop: "env(safe-area-inset-top)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between py-2 sm:py-3 shrink-0">
          <span className="font-display font-medium text-sm sm:text-base text-white/70">
            InPhase
          </span>
          <span
            className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full ${isHost ? "text-violet-400 bg-violet-500/10" : "text-white/40 bg-white/5"
              }`}
          >
            {isHost ? "Host" : "Guest"}
          </span>
        </div>

        <div className="relative rounded-xl overflow-hidden bg-black aspect-video shrink-0">
          <div id="yt-player" className="w-full h-full" />

          {!hasVideo && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 backdrop-blur-sm px-6 text-center">
              <p className="text-sm text-white/50">Paste a YouTube link to get started</p>
              {canControl && (
                <div className="flex items-center gap-2 w-full max-w-xs">
                  <input
                    type="text"
                    placeholder="youtube.com/watch?v=..."
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    className="flex-1 min-w-0 bg-white/10 rounded-lg px-3 py-2 text-base placeholder:text-white/25 focus:outline-none focus:bg-white/15"
                  />
                  <button
                    onClick={handleLoadVideo}
                    className="px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 transition-colors text-xs font-medium shrink-0"
                  >
                    Load
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {hasToggleableContent && (
          <button
            onClick={() => setControlsOpen((prev) => !prev)}
            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 rounded-lg py-2 mt-2 mb-1.5 transition-colors shrink-0"
          >
            <span className="text-xs font-medium text-white/60">
              {controlsOpen ? "Hide controls" : "Show controls"}
            </span>
            <ChevronIcon open={controlsOpen} />
          </button>
        )}

        {controlsOpen && (
          <div className="flex flex-col gap-2 pb-2 shrink-0">
            {hasVideo && canControl && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Paste a new YouTube link"
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  className="flex-1 min-w-0 bg-white/5 rounded-lg px-3 py-2 text-base placeholder:text-white/20 focus:outline-none focus:bg-white/10"
                />
                <button
                  onClick={handleLoadVideo}
                  className="px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 transition-colors text-xs font-medium shrink-0"
                >
                  Load
                </button>
              </div>
            )}

            <div className="flex items-center gap-1.5 sm:gap-2">
              {canControl && (
                <>
                  <button
                    onClick={handleRewind}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white/60 shrink-0"
                  >
                    <RewindIcon />
                  </button>
                  <button
                    onClick={handlePlay}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-500 active:scale-95 transition-all shrink-0"
                  >
                    <PlayIcon />
                  </button>
                  <button
                    onClick={handlePause}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white/60 shrink-0"
                  >
                    <PauseIcon />
                  </button>
                  <button
                    onClick={handleForward}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white/60 shrink-0"
                  >
                    <ForwardIcon />
                  </button>
                </>
              )}

              <button
                onClick={handleCopyLink}
                className="flex-1 min-w-0 h-9 sm:h-10 flex items-center justify-center gap-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-violet-300"
              >
                <CopyIcon />
                <span className="text-xs font-medium truncate">
                  {copied ? "Copied!" : roomId}
                </span>
              </button>

              <button
                onClick={handleToggleMute}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white/60 shrink-0"
              >
                {isMuted ? <MuteIcon /> : <UnmuteIcon />}
              </button>
            </div>

            {isHost && (
              <label className="flex items-center justify-between text-xs text-white/40 cursor-pointer">
                <span>Allow guests to control playback</span>
                <input
                  type="checkbox"
                  checked={allowGuestControl}
                  onChange={handleToggleGuestControl}
                  className="w-4 h-4 accent-violet-600"
                />
              </label>
            )}

            {!canControl && (
              <p className="text-xs text-white/25 text-center">The host controls playback</p>
            )}
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col bg-white/[0.03] rounded-t-xl mt-1 overflow-hidden">
          <div
            ref={messagesScrollRef}
            className="flex-1 min-h-0 overflow-y-auto px-3 py-3 flex flex-col gap-1 no-scrollbar"
            style={{ overscrollBehavior: "contain" }}
          >
            {messages.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-white/20">No messages yet — say hi</p>
              </div>
            )}

            {messages.map((msg) => {
              const isOwn = msg.senderId === myId;
              const showSender = msg.senderId !== lastSenderId;
              lastSenderId = msg.senderId;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isOwn ? "items-end" : "items-start"} ${showSender ? "mt-2" : "mt-0.5"}`}
                >
                  {showSender && !isOwn && (
                    <span className="text-[10px] text-violet-300/70 mb-0.5 px-1">
                      {msg.senderName}
                    </span>
                  )}
                  <div
                    className={`max-w-[75%] px-3 py-2 text-sm leading-snug break-words ${isOwn
                      ? "bg-violet-600 text-white rounded-2xl rounded-br-md"
                      : "bg-white/10 text-white/90 rounded-2xl rounded-bl-md"
                      }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-white/5 shrink-0">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Message"
              maxLength={1000}
              className="flex-1 min-w-0 bg-white/5 rounded-full px-4 py-2.5 text-base placeholder:text-white/25 focus:outline-none focus:bg-white/10"
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim()}
              className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-violet-600 hover:bg-violet-500 active:scale-95 transition-all disabled:opacity-30 disabled:active:scale-100"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;