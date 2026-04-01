import { useState } from "react";

export default function BrainRotVideos({ isOpen }) {
  // Arr for youtube video sources
  const internalVideoSources = [
    {
      label: "Subway Surfers",
      videos: ["nNGQ7kMhGuQ", "Tqne5J7XdPA", "hs7Z0JUgDeA"],
      width: 300,
      portrait: true,
    },
    {
      label: "Minecraft Parkour",
      videos: ["intRX7BRA90", "n_Dv4JMiwK8", "GTaXbH6iSFA"],
      width: 600,
    },
    {
      label: "Family Guy Clips",
      videos: ["Zxl28UgHpn0", "mn-Tlb_wfjc"],
      width: 600,
    },
    {
      label: "Better Call Saul Clips",
      videos: ["P0Gl0Sd7K3k", "ySs3T3tc_bQ", "XQQI72wQjEA", "gsAeYmTNL80"],
      width: 600,
    },
    {
      label: "Mental Outlaw",
      videos: ["Sk2O6aOEPLM", "Lk_v6Q0YsNo", "3oPeIbpA5x8", "GR_U0G-QGA0"],
      width: 600,
    },
    {
      label: "CS:GO Surfing",
      videos: ["Lixl3-jz7k8", "3GWPJtSGm8c", "I-VQuQu2_lc"],
      width: 600,
    },
    {
      label: "Satisfying Videos",
      videos: ["zPhjxwTDdLY", "etp46Aca_UM", "wjQq0nSGS28", "mQGT4BzeUUc"],
      width: 600,
    },
  ];

  const [source, setSource] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);

  const labels = internalVideoSources.map((s) => s.label);

  // Picks a random vid to play from videos arr
  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function handleSelectLabel(label) {
    const selected = internalVideoSources.find((s) => s.label === label);
    setSource(selected);
    setVideoUrl(pickRandom(selected.videos));
  }

  // Guard for when component is not open
  if (!isOpen) return null;

  return (
    <div className="w-full">
      {/* Video */}
      {videoUrl && (
        <div className="relative w-full" style={{ paddingBottom: source?.portrait ? "177.78%" : "56.25%" }}>
          <iframe
            key={videoUrl}
            src={`https://www.youtube-nocookie.com/embed/${videoUrl}?controls=0&disablekb=1&autoplay=1&mute=1&loop=1&playlist=${videoUrl}`}
            allow="autoplay; encrypted-media"
            className="absolute inset-0 h-full w-full"
          />
          <div className="absolute inset-0" />
        </div>
      )}

      {/* Source selector */}
      <div className="flex flex-col overflow-y-auto">
        {labels.map((label) => (
          <button
            key={label}
            onClick={() => handleSelectLabel(label)}
            className={`relative px-3 py-1.5 text-left text-xs transition-colors duration-100 ${
              source?.label === label ? "bg-neutral-100 font-medium text-neutral-900" : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
            }`}
          >
            {source?.label === label && <div className="absolute bottom-0 left-0 top-0 w-[2px] bg-neutral-900" />}
            <span className="pl-1">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
