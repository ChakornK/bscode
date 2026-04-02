"use client";

import "react-splitter-layout/lib/index.css";
import { EditorLayout } from "@/components/editor/EditorLayout";
import { ActivityBar, SidebarProvider, SidebarView, useSidebar } from "@/components/editor/EditorSidebar";
import { EditorCodeProvider } from "@/components/editor/EditorCodeContext";
import MonacoEditor from "@/components/editor/MonacoEditor";
import { ThemeProvider, useTheme } from "@/components/editor/ThemeContext";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { MdOutlineChat, MdOutlineSlowMotionVideo, MdOutlineTrain } from "react-icons/md";
import BrainRotVideos from "../components/BrainRotVideos";
import ChatPanel from "@/components/ChatPanel";
import dynamic from "next/dynamic";
import StatusBar from "@/components/editor/StatusBar";

const SplitterLayout = dynamic(() => import("react-splitter-layout"), {
  ssr: false,
});
const CAPTCHA_TEXT = "tung tung tung tung sahur";

function BrainRotTab() {
  const { activeId } = useSidebar();
  return <BrainRotVideos isOpen={activeId === "brain-rot-video"} />;
}

const editorTabs = [
  { id: "chat", title: "Chat", icon: MdOutlineChat, component: <ChatPanel /> },
  {
    id: "brain-rot-video",
    title: "Brain Rot Video",
    icon: MdOutlineSlowMotionVideo,
    component: <BrainRotTab />,
  },
  {
    id: "subway-surfers",
    title: "Subway Surfers",
    icon: MdOutlineTrain,
    component: <iframe className="h-full w-full" src="https://subwaygame.bitbucket.io/file" />,
  },
];

let fahhAudio = null;
let lastFahhhTime = 0;
const playFahhhSound = () => {
  if (typeof window === "undefined") return;

  const now = Date.now();
  if (now - lastFahhhTime < 50) return; // 0.05 seconds cooldown
  lastFahhhTime = now;

  if (!fahhAudio) {
    fahhAudio = new Audio("/fahh.mp3");
  }

  // Clone the node so rapid deletions overlap wildly instead of cutting off
  const overlapNode = fahhAudio.cloneNode();
  overlapNode.play().catch((e) => console.error("Audio playback blocked or file missing: ", e));
};

// Track accumulated characters at the bottom with physics
const fallingChars = [];
const gravity = 0.3;
const friction = 0.98;
const bounce = 0.6;
const charRadius = 12; // Approximate collision radius for characters
const igniteTimers = new Set();

// FIX: Initialize groundLevel dynamically instead of at module level
const getGroundLevel = () => {
  if (typeof window === "undefined") return 570; // fallback for SSR
  return window.innerHeight - 30;
};

const igniteSettledChar = (charObj) => {
  if (!charObj?.el || !charObj.el.isConnected) return;
  if (charObj.onFire) return;
  charObj.onFire = true;

  charObj.el.style.transition = "color 1.6s ease, text-shadow 1.6s ease, filter 1.6s ease";
  charObj.el.style.color = "#ff5a1f";
  charObj.el.style.opacity = "0.28";
  charObj.el.style.textShadow = "0 0 8px rgba(255, 120, 0, 0.9), 0 0 18px rgba(255, 80, 0, 0.65), 0 2px 3px rgba(0,0,0,0.3)";
  charObj.el.style.filter = "saturate(1.3)";

  charObj.el.animate(
    [
      { transform: "translateY(0px) scale(1)", opacity: 1 },
      { transform: "translateY(-1px) scale(1.02)", opacity: 0.95 },
      { transform: "translateY(0px) scale(1)", opacity: 1 },
    ],
    {
      duration: 850 + Math.random() * 350,
      iterations: Infinity,
      direction: "alternate",
      easing: "ease-in-out",
    },
  );

  const flame = document.createElement("div");
  flame.textContent = "🔥";
  flame.style.position = "fixed";
  flame.style.pointerEvents = "none";
  flame.style.zIndex = "100001";
  flame.style.left = `${charObj.x + 8}px`;
  flame.style.top = `${charObj.y - 2}px`;
  flame.style.transform = "translate(-50%, -50%)";
  flame.style.fontSize = `${42 + Math.random() * 22}px`;
  flame.style.opacity = "0.55";
  flame.style.transformOrigin = "bottom center";
  flame.style.filter = "drop-shadow(0 0 14px rgba(255, 120, 0, 0.95)) drop-shadow(0 0 26px rgba(255, 70, 0, 0.7))";

  document.body.appendChild(flame);
  charObj.flameEl = flame;

  flame.animate(
    [
      { transform: "translateY(8px) scale(0.38)", opacity: 0.22 },
      { transform: "translateY(-2px) scale(0.82)", opacity: 0.58, offset: 0.35 },
      { transform: "translateY(-12px) scale(1.7)", opacity: 0.96, offset: 0.72 },
      { transform: "translateY(-4px) scale(1.28)", opacity: 0.35 },
    ],
    {
      duration: 980 + Math.random() * 320,
      iterations: Infinity,
      direction: "alternate",
      easing: "cubic-bezier(0.2, 0.75, 0.2, 1)",
    },
  );
};

const scheduleIgniteSettledChar = (charObj) => {
  if (!charObj || charObj.igniteScheduled || charObj.onFire) return;
  charObj.igniteScheduled = true;
  const igniteDelay = 900 + Math.random() * 2600;
  const timerId = window.setTimeout(() => {
    igniteTimers.delete(timerId);
    if (!charObj?.el || !charObj.el.isConnected) return;
    igniteSettledChar(charObj);
  }, igniteDelay);
  igniteTimers.add(timerId);
  charObj.igniteTimerId = timerId;
};

let physicsAnimationId = null;

const updatePhysics = () => {
  if (typeof window === "undefined") return;

  const groundLevel = getGroundLevel();
  let anyMoving = false;

  // Check collisions between characters
  for (let i = 0; i < fallingChars.length; i++) {
    for (let j = i + 1; j < fallingChars.length; j++) {
      const charA = fallingChars[i];
      const charB = fallingChars[j];

      const dx = charB.x - charA.x;
      const dy = charB.y - charA.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = charRadius * 2;

      if (distance < minDistance) {
        // Collision detected - push them apart
        const angle = Math.atan2(dy, dx);
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);

        // Push them apart
        const overlap = minDistance - distance;
        const pushX = (overlap / 2) * cos;
        const pushY = (overlap / 2) * sin;

        charA.x -= pushX;
        charA.y -= pushY;
        charB.x += pushX;
        charB.y += pushY;

        // Exchange velocities (simplified collision response)
        const tempVx = charA.vx;
        const tempVy = charA.vy;
        charA.vx = charB.vx * 0.8;
        charA.vy = charB.vy * 0.8;
        charB.vx = tempVx * 0.8;
        charB.vy = tempVy * 0.8;
      }
    }
  }

  fallingChars.forEach((charObj) => {
    if (charObj.settling && Math.abs(charObj.vx) < 0.1) return;

    // Apply gravity
    charObj.vy += gravity;

    // Update position
    charObj.y += charObj.vy;
    charObj.x += charObj.vx;

    // Apply friction to horizontal movement
    charObj.vx *= friction;

    // Check ground collision
    if (charObj.y >= groundLevel) {
      charObj.y = groundLevel;
      charObj.vy *= -bounce;

      // Settle if velocity is very small
      if (Math.abs(charObj.vy) < 0.5 && Math.abs(charObj.vx) < 0.5) {
        charObj.vy = 0;
        charObj.vx = 0;
        charObj.settling = true;
        scheduleIgniteSettledChar(charObj);
      } else {
        anyMoving = true;
      }
    } else {
      anyMoving = true;
    }

    // Keep in bounds horizontally with bounce
    if (charObj.x < 0) {
      charObj.x = 0;
      charObj.vx *= -bounce;
    }
    if (charObj.x > window.innerWidth - 20) {
      charObj.x = window.innerWidth - 20;
      charObj.vx *= -bounce;
    }

    // Update DOM position
    charObj.el.style.left = `${charObj.x}px`;
    charObj.el.style.top = `${charObj.y}px`;

    if (charObj.flameEl) {
      charObj.flameEl.style.left = `${charObj.x + 8}px`;
      charObj.flameEl.style.top = `${charObj.y - 2}px`;
    }
  });

  if (anyMoving) {
    physicsAnimationId = requestAnimationFrame(updatePhysics);
  } else {
    physicsAnimationId = null;
  }
};

const spawnFallingLetters = (oldStr, newStr, cursorCoords, color = "#333333") => {
  if (typeof window === "undefined") return;
  if (!oldStr || !newStr) return;

  // Calculate which exact letters were deleted
  let start = 0;
  while (start < oldStr.length && start < newStr.length && oldStr[start] === newStr[start]) start++;
  let endOld = oldStr.length - 1;
  let endNew = newStr.length - 1;
  while (endOld >= start && endNew >= start && oldStr[endOld] === newStr[endNew]) {
    endOld--;
    endNew--;
  }

  const deleted = oldStr.slice(start, endOld + 1);
  if (!deleted) return;

  // Use cursor coordinates from editor, or fall back to center
  let startX = window.innerWidth / 2;
  let startY = window.innerHeight / 3;

  if (cursorCoords && cursorCoords.top !== undefined && cursorCoords.left !== undefined) {
    startX = cursorCoords.left;
    startY = cursorCoords.top;
  }

  // Limit to 50 particles max to prevent lagging on huge file deletions
  const charsToSpawn = deleted.replace(/\s/g, "").split("").slice(0, 50);

  charsToSpawn.forEach((char, i) => {
    setTimeout(() => {
      const el = document.createElement("div");
      el.innerText = char;
      el.style.position = "fixed";
      el.style.fontSize = `${Math.random() * 24 + 16}px`;
      el.style.fontWeight = "900";
      el.style.color = color;
      el.style.zIndex = "99999";
      el.style.pointerEvents = "none";
      el.style.fontFamily = "monospace";
      el.style.textShadow = "0px 2px 4px rgba(0,0,0,0.3)";

      const offsetX = startX + (Math.random() - 0.5) * 40;
      const offsetY = startY + (Math.random() - 0.5) * 40;

      const charObj = {
        el,
        x: offsetX,
        y: offsetY,
        vx: (Math.random() - 0.5) * 300,
        vy: (Math.random() - 0.5) * 50, // Initial slight upward/downward velocity
        settling: false,
        onFire: false,
        igniteScheduled: false,
        igniteTimerId: null,
        flameEl: null,
      };

      el.style.left = `${charObj.x}px`;
      el.style.top = `${charObj.y}px`;

      document.body.appendChild(el);
      fallingChars.push(charObj);

      // Start physics loop if not already running
      if (!physicsAnimationId) {
        physicsAnimationId = requestAnimationFrame(updatePhysics);
      }
    }, i * 15);
  });
};

const getInsertedText = (oldStr, newStr) => {
  if (!oldStr || !newStr || newStr.length <= oldStr.length) return "";

  let start = 0;
  while (start < oldStr.length && start < newStr.length && oldStr[start] === newStr[start]) {
    start++;
  }

  let endOld = oldStr.length - 1;
  let endNew = newStr.length - 1;
  while (endOld >= start && endNew >= start && oldStr[endOld] === newStr[endNew]) {
    endOld--;
    endNew--;
  }

  return newStr.slice(start, endNew + 1);
};

const spawnBrainrotFlamePoof = (cursorCoords, typedText = "") => {
  if (typeof window === "undefined") return;

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 3;

  if (cursorCoords && cursorCoords.top !== undefined && cursorCoords.left !== undefined) {
    x = cursorCoords.left;
    y = cursorCoords.top;
  }

  const visibleTypedText = typedText || "?";
  const bursts = Math.min(Math.max(visibleTypedText.length, 1), 3);

  for (let i = 0; i < bursts; i += 1) {
    const flame = document.createElement("div");
    flame.textContent = "🔥";
    flame.style.position = "fixed";
    flame.style.left = `${x + (Math.random() - 0.5) * 14}px`;
    flame.style.top = `${y + (Math.random() - 0.5) * 10}px`;
    flame.style.fontSize = `${18 + Math.random() * 12}px`;
    flame.style.zIndex = "99999";
    flame.style.pointerEvents = "none";
    flame.style.filter = "drop-shadow(0 0 8px rgba(255, 120, 0, 0.75))";
    flame.style.transformOrigin = "center";

    const poof = document.createElement("div");
    const typedChar = visibleTypedText[Math.min(i, visibleTypedText.length - 1)];
    poof.textContent = typedChar === " " ? "␠" : typedChar;
    poof.style.position = "fixed";
    poof.style.left = `${x + (Math.random() - 0.5) * 22}px`;
    poof.style.top = `${y - 10 + (Math.random() - 0.5) * 14}px`;
    poof.style.fontSize = `${11 + Math.random() * 5}px`;
    poof.style.fontWeight = "900";
    poof.style.letterSpacing = "0.08em";
    poof.style.color = "rgba(255, 120, 30, 0.95)";
    poof.style.textShadow = "0 0 8px rgba(255, 110, 0, 0.7)";
    poof.style.zIndex = "99999";
    poof.style.pointerEvents = "none";

    document.body.appendChild(flame);
    document.body.appendChild(poof);

    flame.animate(
      [
        { transform: "translateY(0px) scale(0.75)", opacity: 0.95 },
        { transform: "translateY(-10px) scale(1.05)", opacity: 0.85, offset: 0.4 },
        { transform: "translateY(-26px) scale(0.25)", opacity: 0 },
      ],
      {
        duration: 420 + Math.random() * 160,
        easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
        fill: "forwards",
      },
    );

    const poofAnim = poof.animate(
      [
        { transform: "scale(0.7)", opacity: 0 },
        { transform: "scale(1)", opacity: 1, offset: 0.15 },
        { transform: "scale(1.22)", opacity: 0 },
      ],
      {
        duration: 360 + Math.random() * 120,
        easing: "ease-out",
        fill: "forwards",
      },
    );

    poofAnim.onfinish = () => {
      flame.remove();
      poof.remove();
    };
  }
};

const spawnWritingFireImage = (imagePaths, cursorCoords) => {
  if (typeof window === "undefined") return;
  if (!Array.isArray(imagePaths) || imagePaths.length === 0) return;

  const randomPath = imagePaths[Math.floor(Math.random() * imagePaths.length)];
  if (!randomPath) return;

  const image = document.createElement("img");
  image.src = randomPath;
  image.alt = "writing fire";
  image.style.position = "fixed";
  image.style.width = "10vw";
  image.style.height = "auto";
  image.style.maxWidth = "10vw";
  image.style.zIndex = "99998";
  image.style.pointerEvents = "none";
  image.style.willChange = "transform, opacity";

  const approxSize = window.innerWidth * 0.1;
  const maxX = Math.max(window.innerWidth - approxSize, 0);
  const maxY = Math.max(window.innerHeight - approxSize, 0);

  let x = Math.random() * maxX;
  let y = Math.random() * maxY;

  if (cursorCoords && cursorCoords.left !== undefined && cursorCoords.top !== undefined) {
    const safeRadius = Math.max(approxSize * 1.6, 180);
    for (let tries = 0; tries < 20; tries += 1) {
      const candidateX = Math.random() * maxX;
      const candidateY = Math.random() * maxY;
      const centerX = candidateX + approxSize / 2;
      const centerY = candidateY + approxSize / 2;
      const dx = centerX - cursorCoords.left;
      const dy = centerY - cursorCoords.top;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > safeRadius) {
        x = candidateX;
        y = candidateY;
        break;
      }
    }
  }

  image.style.left = `${x}px`;
  image.style.top = `${y}px`;
  image.style.opacity = "0";
  image.style.transform = "scale(0.85)";

  document.body.appendChild(image);

  const anim = image.animate(
    [
      { opacity: 0, transform: "scale(0.85)" },
      { opacity: 1, transform: "scale(1)", offset: 0.2 },
      { opacity: 0, transform: "scale(1.08)" },
    ],
    {
      duration: 950,
      easing: "ease-out",
      fill: "forwards",
    },
  );

  anim.onfinish = () => {
    image.remove();
  };
};

let isDeletingKey = false;

// FIX: Initialize event listeners only on client side
const initializeKeyListeners = () => {
  if (typeof window === "undefined") return;

  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        isDeletingKey = true;
      } else {
        isDeletingKey = false;
      }
    },
    true,
  );
  window.addEventListener(
    "keyup",
    (e) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        isDeletingKey = false;
      }
    },
    true,
  );
};

export default function Editor() {
  const [html, setHtml] = useState("<h1>Hello World</h1>\n<p>Start editing to see the magic!</p>");
  const [css, setCss] = useState("h1 { color: #007acc; }\nbody { font-family: sans-serif; padding: 20px; }");
  const [js, setJs] = useState("console.log('Hello from JS!');");

  const [cursorInfo, setCursorInfo] = useState({ lineNumber: 1, column: 1 });
  const [activeLanguage, setActiveLanguage] = useState("html");

  const [eruda, setEruda] = useState("");

  // FIX: Initialize key listeners on client mount
  useEffect(() => {
    initializeKeyListeners();
  }, []);

  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/eruda")
      .then((res) => res.text())
      .then((text) => setEruda(`<script>${text}\n;self.eruda.init({tool: ['console', 'elements'], useShadowDom: true, defaults: {theme: "Light"}});</script>`));
  }, []);

  const combinedCode = useMemo(() => {
    return `
      <html>
        <head>
          <style>${css}</style>
        </head>
        <body>
          ${html}
          </body>
        ${eruda}
        <script>${js}</script>
      </html>
    `;
  }, [html, css, js, eruda]);

  const [srcDoc, setSrcDoc] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSrcDoc(combinedCode);
    }, 250);
    return () => clearTimeout(timeout);
  }, [combinedCode]);

  useEffect(() => {
    return () => {
      if (physicsAnimationId) {
        cancelAnimationFrame(physicsAnimationId);
        physicsAnimationId = null;
      }

      igniteTimers.forEach((timerId) => clearTimeout(timerId));
      igniteTimers.clear();

      fallingChars.forEach((charObj) => {
        charObj?.el?.remove?.();
        charObj?.flameEl?.remove?.();
      });
      fallingChars.length = 0;
    };
  }, []);

  return (
    <ThemeProvider>
      <EditorLayout>
        <div className="flex w-screen flex-1 overflow-hidden">
          <EditorCodeProvider value={{ html, css, js }}>
            <SidebarProvider
              initialItems={editorTabs.map((tab) => ({
                id: tab.id,
                icon: tab.icon,
                title: tab.title,
                component: tab.component,
              }))}
            >
              <EditorContent
                html={html}
                setHtml={setHtml}
                css={css}
                setCss={setCss}
                js={js}
                setJs={setJs}
                srcDoc={srcDoc}
                onCursorChange={setCursorInfo}
                onActiveLanguageChange={setActiveLanguage}
              />
            </SidebarProvider>
          </EditorCodeProvider>
        </div>
        <EditorLayout.StatusBar>
          <StatusBar cursorLine={cursorInfo.lineNumber} cursorColumn={cursorInfo.column} activeLanguage={activeLanguage} />
        </EditorLayout.StatusBar>
      </EditorLayout>
    </ThemeProvider>
  );
}

let capturedPointerId;
function EditorContent({ html, setHtml, css, setCss, js, setJs, srcDoc, onCursorChange, onActiveLanguageChange }) {
  const { activeId } = useSidebar();
  const { theme } = useTheme();
  const monacoTheme = theme === "dark" ? "vs-dark" : "vs";

  // Use persistent mutable refs to escape stale React closures
  const [errorCounts, setErrorCounts] = useState({
    html: 0,
    css: 0,
    javascript: 0,
  });
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [captchaSolved, setCaptchaSolved] = useState(false);
  const [writingFireImages, setWritingFireImages] = useState([]);
  const previousTotalErrorCountRef = useRef(0);
  const totalErrorCount = useMemo(() => errorCounts.html + errorCounts.css + errorCounts.javascript, [errorCounts]);
  const isBlocked = totalErrorCount >= 3 && !captchaSolved;

  // Use persistent mutable refs to escape stale React closures
  // trapped inside MonacoEditor's memoized onChange bindings
  const htmlRef = useRef(html);
  const cssRef = useRef(css);
  const jsRef = useRef(js);

  useEffect(() => {
    htmlRef.current = html;
    cssRef.current = css;
    jsRef.current = js;
  }, [html, css, js]);

  useEffect(() => {
    if (totalErrorCount >= 3 && previousTotalErrorCountRef.current < 3) {
      setCaptchaSolved(false);
      setCaptchaInput("");
      setCaptchaError("");
      setShowErrorPopup(true);
    }

    if (totalErrorCount < 3) {
      setShowErrorPopup(false);
      setCaptchaSolved(false);
      setCaptchaInput("");
      setCaptchaError("");
    }

    previousTotalErrorCountRef.current = totalErrorCount;
  }, [totalErrorCount]);

  useEffect(() => {
    let ignore = false;

    fetch("/api/writingfire")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load writingfire images");
        return res.json();
      })
      .then((data) => {
        if (ignore) return;
        if (Array.isArray(data?.images)) {
          setWritingFireImages(data.images);
        }
      })
      .catch(() => {
        if (!ignore) setWritingFireImages([]);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const updateLanguageErrorCount = (languageKey, count) => {
    setErrorCounts((prev) => {
      if (prev[languageKey] === count) return prev;
      return { ...prev, [languageKey]: count };
    });
  };

  const handleCaptchaSubmit = (e) => {
    e.preventDefault();
    if (captchaInput.trim().toLowerCase() === CAPTCHA_TEXT.toLowerCase()) {
      setCaptchaSolved(true);
      setCaptchaError("");
      setShowErrorPopup(false);
      return;
    }
    setCaptchaError("Incorrect text. Please try again.");
  };

  const documentPointerMoveOnceListener = ({ pointerId }) => {
    document.removeEventListener("pointermove", documentPointerMoveOnceListener);
    capturedPointerId = pointerId;
    document.documentElement.setPointerCapture(capturedPointerId);
  };
  const setDocumentPointerCapture = () => {
    document.addEventListener("pointermove", documentPointerMoveOnceListener);
  };
  const releaseDocumentPointerCapture = () => {
    if (capturedPointerId) {
      document.documentElement.releasePointerCapture(capturedPointerId);
    }
  };
  useEffect(() => {
    return () => {
      document.removeEventListener("pointermove", documentPointerMoveOnceListener);
      releaseDocumentPointerCapture();
    };
  }, []);

  return (
    <>
      <EditorLayout.ActivityBar>
        <ActivityBar />
      </EditorLayout.ActivityBar>

      <div className="relative grow">
        <SplitterLayout horizontal primaryIndex={1} secondaryInitialSize={240} secondaryMinSize={180}>
          {activeId && (
            <EditorLayout.Sidebar>
              <SidebarView />
            </EditorLayout.Sidebar>
          )}
          <EditorLayout.Main>
            <SplitterLayout
              horizontal
              primaryIndex={0}
              secondaryInitialSize={40}
              primaryMinSize={20}
              secondaryMinSize={20}
              percentage
              onDragStart={setDocumentPointerCapture}
              onDragEnd={releaseDocumentPointerCapture}
            >
              <div className="flex h-full flex-col">
                <div className="flex flex-1 overflow-hidden">
                  <SplitterLayout vertical primaryIndex={0} percentage primaryInitialSize={33} secondaryInitialSize={66}>
                    <div className="flex h-full flex-col bg-white">
                      <div className="flex h-9 shrink-0 items-center bg-neutral-50 px-4 text-[11px] font-bold uppercase text-neutral-500">HTML</div>
                      <MonacoEditor
                        language="html"
                        value={html}
                        onChange={(v, cursorCoords) => {
                          const prev = htmlRef.current;
                          const typedCharCount = Math.max(v.length - prev.length, 0);
                          if (!isDeletingKey && typedCharCount > 0) {
                            const typedText = getInsertedText(prev, v);
                            spawnBrainrotFlamePoof(cursorCoords, typedText);
                            spawnWritingFireImage(writingFireImages, cursorCoords);
                          }
                          if (isDeletingKey && v.replace(/\s/g, "").length < prev.replace(/\s/g, "").length) {
                            playFahhhSound();
                            spawnFallingLetters(prev, v, cursorCoords);
                          }
                          htmlRef.current = v; // Sync ref instantly to avoid missed multi-stroke cascades
                          setHtml(v);
                        }}
                        theme="vs"
                        totalErrorCount={totalErrorCount}
                        isBlocked={isBlocked}
                        onErrorCountChange={(count) => updateLanguageErrorCount("html", count)}
                      />
                    </div>
                    <SplitterLayout vertical primaryIndex={0} secondaryInitialSize={(typeof window !== "undefined" ? window.innerHeight : 600) / 3}>
                      <div className="flex h-full flex-col bg-white">
                        <div className="flex h-9 shrink-0 items-center bg-neutral-50 px-4 text-[11px] font-bold uppercase text-neutral-500">CSS</div>
                        <MonacoEditor
                          language="css"
                          value={css}
                          onChange={(v, cursorCoords) => {
                            const prev = cssRef.current;
                            const typedCharCount = Math.max(v.length - prev.length, 0);
                            if (!isDeletingKey && typedCharCount > 0) {
                              const typedText = getInsertedText(prev, v);
                              spawnBrainrotFlamePoof(cursorCoords, typedText);
                              spawnWritingFireImage(writingFireImages, cursorCoords);
                            }
                            if (isDeletingKey && v.replace(/\s/g, "").length < prev.replace(/\s/g, "").length) {
                              playFahhhSound();
                              spawnFallingLetters(prev, v, cursorCoords);
                            }
                            cssRef.current = v;
                            setCss(v);
                          }}
                          theme="vs"
                          totalErrorCount={totalErrorCount}
                          isBlocked={isBlocked}
                          onErrorCountChange={(count) => updateLanguageErrorCount("css", count)}
                        />
                      </div>
                      <div className="flex h-full flex-col bg-white">
                        <div className="flex h-9 shrink-0 items-center bg-neutral-50 px-4 text-[11px] font-bold uppercase text-neutral-500">JS</div>
                        <MonacoEditor
                          language="javascript"
                          value={js}
                          onChange={(v, cursorCoords) => {
                            const prev = jsRef.current;
                            const typedCharCount = Math.max(v.length - prev.length, 0);
                            if (!isDeletingKey && typedCharCount > 0) {
                              const typedText = getInsertedText(prev, v);
                              spawnBrainrotFlamePoof(cursorCoords, typedText);
                              spawnWritingFireImage(writingFireImages, cursorCoords);
                            }
                            if (isDeletingKey && v.replace(/\s/g, "").length < prev.replace(/\s/g, "").length) {
                              playFahhhSound();
                              spawnFallingLetters(prev, v, cursorCoords);
                            }
                            jsRef.current = v;
                            setJs(v);
                          }}
                          theme="vs"
                          totalErrorCount={totalErrorCount}
                          isBlocked={isBlocked}
                          onErrorCountChange={(count) => updateLanguageErrorCount("javascript", count)}
                        />
                      </div>
                    </SplitterLayout>
                  </SplitterLayout>
                </div>
              </div>
              <div className="flex h-full flex-col bg-white dark:bg-[#1e1e1e]">
                <div className="flex h-9 shrink-0 items-center bg-[#ececec] px-4 text-[11px] font-bold uppercase text-[#616161] dark:bg-[#2d2d2d] dark:text-[#969696]">
                  Output
                </div>
                <iframe srcDoc={srcDoc} title="output" width="100%" height="100%" className="bg-white" />
              </div>
            </SplitterLayout>

            <div className="absolute bottom-0 left-0 right-0 z-20 flex h-9 items-center justify-between border-t border-neutral-200 bg-neutral-50 px-4 text-xs font-semibold">
              <span className="text-neutral-700">Combined Errors (HTML + CSS + JS)</span>
              <span className={totalErrorCount >= 3 ? "text-red-600" : "text-neutral-700"}>{totalErrorCount}</span>
            </div>

            {showErrorPopup && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
                <form onSubmit={handleCaptchaSubmit} className="w-full max-w-sm rounded-md border border-red-200 bg-red-50 p-4 shadow-lg">
                  <div className="mb-2 text-sm font-semibold text-red-700">
                    ts code is so ass twin 🥀 prove ur human to continue writing ass code or use llm
                  </div>
                  <div className="mb-3 text-xs text-red-700">Combined HTML/CSS/JS errors: {totalErrorCount}.</div>

                  <img src="/tung.jpg" alt="Captcha placeholder" className="mb-3 h-40 w-full rounded border border-red-200 bg-white object-contain" />

                  <input
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    className="w-full rounded border border-red-300 bg-white px-2 py-1 text-sm text-neutral-900 outline-none focus:border-red-500"
                    placeholder="Enter captcha answer"
                    autoFocus
                  />

                  {captchaError && <div className="mt-2 text-xs font-medium text-red-700">{captchaError}</div>}

                  <div className="mt-3 flex justify-end">
                    <button className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-700" type="submit">
                      Verify & Continue
                    </button>
                  </div>
                </form>
              </div>
            )}
          </EditorLayout.Main>
        </SplitterLayout>
      </div>
    </>
  );
}
