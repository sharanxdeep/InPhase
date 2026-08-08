# InPhase

**Watch together, in phase.** InPhase is a real-time synchronized video platform where you create a room, share one link, and watch any YouTube video perfectly in sync with everyone who joins — with live chat alongside.

🔗 **Live app:** https://in-phase-nine.vercel.app
🔗 **Backend:** https://inphase-kymu.onrender.com
🔗 **Repo:** https://github.com/sharanxdeep/InPhase

> Note: the backend runs on Render's free tier, which sleeps after ~15 minutes of inactivity. The first request after a period of inactivity may take 30–60 seconds while the server wakes up.

---

## Features

- **Real-time playback sync** — play, pause, seek, and video changes broadcast instantly to every participant via Socket.io
- **Drift correction** — the host periodically broadcasts the true playback position; any client that's drifted more than ~1.5s automatically corrects, keeping everyone aligned without constant, jarring re-syncs
- **Host/guest roles** — the room creator is the host by default; playback control can optionally be extended to guests via a live toggle, enforced both client- and server-side
- **Dynamic video loading** — paste any YouTube link mid-session to switch what the room is watching, no restart needed
- **Late-join sync** — guests joining an in-progress session automatically request and receive the current video, timestamp, and play state from the host
- **Live chat** — persistent, room-scoped chat with sender identification, stored per-room and auto-expiring with the room
- **Auto-expiring rooms** — rooms (and their chat history) are automatically deleted 24 hours after creation via a MongoDB TTL index — no manual cleanup needed
- **Mobile-first, responsive UI** — built around a fixed-viewport layout using the `visualViewport` API so the interface correctly adapts when the on-screen keyboard opens, with safe-area support for notches/home indicators

## Tech Stack

**Frontend:** React (Vite), Tailwind CSS, Socket.io-client, React Router
**Backend:** Node.js, Express, Socket.io
**Database:** MongoDB (Mongoose) — hosted on MongoDB Atlas
**Video:** YouTube IFrame Player API
**Deployment:** Vercel (frontend), Render (backend)

## Architecture Notes

- **Sync model:** the host is the source of truth for playback state. Play/pause/seek/video-load actions emit from the acting client, get validated server-side (host, or guest if permitted), and broadcast to the rest of the room.
- **Suppression flags:** since applying a remote action (e.g. `playVideo()`) triggers the same `onStateChange` event as a local user click, a short-lived ref-based flag distinguishes "this state change was caused by a remote command" from "this state change is a genuine local action," preventing feedback loops between clients.
- **Chat:** messages are stored as an embedded array on each Room document (not a separate collection), since they're never queried independently of their room — this also means the TTL index that expires rooms after 24h cleans up their chat history automatically, with no separate cleanup logic needed.

## Known Limitations

- **Mobile background/minimized-tab playback:** browsers restrict background audio for embedded video; this is a platform-level restriction (YouTube/OS), not a bug — the honest UX here is "keep the tab open for uninterrupted playback."
- **Autoplay policies:** some browsers (notably Chrome) block programmatic unmuted playback without prior user interaction on that page. Videos loaded remotely start muted by default to comply with this, with a one-tap unmute available.
- **No host migration:** if the host disconnects, there's currently no automatic handoff of host privileges to another participant.
- **No user accounts:** identity is currently device/session-based (a generated ID stored in `localStorage` for hosts, `sessionStorage` for guests) rather than authenticated accounts — a deliberate scope decision for this version.

## Local Development

**Backend:**
```bash
cd backend
npm install
# create a .env file with MONGO_URI, PORT, CLIENT_URL
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
# create a .env file with VITE_BACKEND_URL
npm run dev
```

## Author

Built by Sharandeep Singh — MCA student, MANIT.
