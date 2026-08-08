import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Home = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");

  const handleCreateRoom = async () => {
    if (!name.trim()) {
      setNameError("Enter your name to create a room");
      return;
    }

    try {
      let hostId = localStorage.getItem("hostId");
      if (!hostId) {
        hostId = crypto.randomUUID();
        localStorage.setItem("hostId", hostId);
      }
      localStorage.setItem("hostName", name.trim());

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostId, hostName: name.trim(), videoId: null }),
      });

      const room = await res.json();
      navigate(`/room/${room.roomId}`);
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0f] font-body text-white flex flex-col">
      <div className="px-6 py-6">
        <span className="font-display font-medium text-sm tracking-wide text-white/70">
          InPhase
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display font-medium text-4xl sm:text-5xl leading-tight mb-4 max-w-xs sm:max-w-none">
          Watch together,
          <br />
          <span className="text-violet-400">in phase.</span>
        </h1>

        <p className="text-sm text-white/40 mb-8 max-w-[280px]">
          One room. One link. Every screen moves together.
        </p>

        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError("");
          }}
          maxLength={30}
          onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
          className="w-full max-w-[260px] bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm text-center placeholder:text-white/25 focus:outline-none focus:bg-white/10"
        />
        {nameError && (
          <p className="text-xs text-red-400 mt-2 mb-1">{nameError}</p>
        )}

        <button
          onClick={handleCreateRoom}
          className={`px-8 py-3.5 rounded-full bg-white text-black font-medium text-sm active:scale-[0.97] transition-transform ${nameError ? "mt-1" : "mt-4"}`}
        >
          Create a room
        </button>
      </div>

      <div className="px-6 py-6 text-center">
        <p className="text-[11px] text-white/20">No account needed</p>
      </div>
    </div>
  );
};

export default Home;