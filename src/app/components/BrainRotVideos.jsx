import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { useState } from "react";

export default function BrainRotVideos({ isOpen, onClose }) {
    // Arr for youtube video sources
    const internalVideoSources = [
        {
            label: "Subway Surfers",
            videos: ["nNGQ7kMhGuQ", "Tqne5J7XdPA", "hs7Z0JUgDeA", "iYgYfHb8gbQ"],
            width: 300,
        },
        {
            label: "Minecraft Parkour",
            videos: ["intRX7BRA90", "n_Dv4JMiwK8", "GTaXbH6iSFA", "t3SpmH9QQew"],
            width: 600,
        },
        {
            label: "Family Guy Clips",
            videos: ["y5a0ljo-ocI", "Zxl28UgHpn0", "mn-Tlb_wfjc", "fytR78K6rHs"],
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

    const labels = internalVideoSources.map(s => s.label);

    // Picks a random vid to play from videos arr
    function pickRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function handleSelectLabel(label) {
        const selected = internalVideoSources.find(s => s.label === label);
        setSource(selected);
        setVideoUrl(pickRandom(selected.videos));
    }

    // Guard for when component is not open
    if (!isOpen) return null;

    return (
        <div className="w-full">
            {/* Video */}
            <div>
                {videoUrl && (
                    <iframe
                        key={videoUrl}
                        src={`https://www.youtube.com/embed/${videoUrl}?autoplay=1`}
                        width={source.width}
                        height={source.width * 0.5625}
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                    />
                )}
            </div>

            {/* Source selector */}
            <div className="flex flex-col">
                <ButtonGroup>
                {labels.map(label => (
                    <Button key={label} onClick={() => handleSelectLabel(label)} size="sm"
                    variant={source?.label === label ? "default" : "outline"}>
                        {label}
                    </Button>
                ))}
                </ButtonGroup>
            </div>
        </div>
    );
}
