"use client";

import "react-splitter-layout/lib/index.css";
import { EditorLayout } from "@/components/editor/EditorLayout";
import { ActivityBar, SidebarProvider, SidebarView, useSidebar } from "@/components/editor/EditorSidebar";
import { EditorCodeProvider } from "@/components/editor/EditorCodeContext";
import MonacoEditor from "@/components/editor/MonacoEditor";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { MdOutlineChat, MdOutlineSlowMotionVideo } from "react-icons/md";
import BrainRotVideos from "../components/BrainRotVideos";
import ChatPanel from "@/components/ChatPanel";
import dynamic from "next/dynamic";

const SplitterLayout = dynamic(() => import("react-splitter-layout"), { ssr: false });

function BrainRotTab() {
  const { activeId } = useSidebar();
  return <BrainRotVideos isOpen={activeId === "brain-rot-video"} />;
}

const editorTabs = [
  { id: "chat", title: "Chat", icon: MdOutlineChat, component: <ChatPanel /> },
  { id: "brain-rot-video", title: "Brain Rot Video", icon: MdOutlineSlowMotionVideo, component: <BrainRotTab /> },
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
const groundLevel = window.innerHeight - 30;
const charRadius = 12; // Approximate collision radius for characters

let physicsAnimationId = null;

const updatePhysics = () => {
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
  });

  if (anyMoving) {
    physicsAnimationId = requestAnimationFrame(updatePhysics);
  } else {
    physicsAnimationId = null;
  }
};

const spawnFallingLetters = (oldStr, newStr, cursorCoords) => {
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
      el.style.color = "#333333";
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

let isDeletingKey = false;
if (typeof window !== "undefined") {
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
}

export default function Editor() {
  const [html, setHtml] = useState("<h1>Hello World</h1>\n<p>Start editing to see the magic!</p>");
  const [css, setCss] = useState("h1 { color: #007acc; }\nbody { font-family: sans-serif; padding: 20px; }");
  const [js, setJs] = useState("console.log('Hello from JS!');");

  const [eruda, setEruda] = useState("");
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
  }, [html, css, js]);

  const [srcDoc, setSrcDoc] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSrcDoc(combinedCode);
    }, 250);
    return () => clearTimeout(timeout);
  }, [combinedCode]);

  return (
    <EditorLayout>
      <div className="flex flex-1 w-screen overflow-hidden">
        <EditorCodeProvider value={{ html, css, js }}>
          <SidebarProvider
            initialItems={editorTabs.map((tab) => ({
              id: tab.id,
              icon: tab.icon,
              title: tab.title,
              component: tab.component,
            }))}
          >
            <EditorContent html={html} setHtml={setHtml} css={css} setCss={setCss} js={js} setJs={setJs} srcDoc={srcDoc} />
          </SidebarProvider>
        </EditorCodeProvider>
      </div>
    </EditorLayout>
  );
}

let capturedPointerId;
function EditorContent({ html, setHtml, css, setCss, js, setJs, srcDoc }) {
  const { activeId } = useSidebar();

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
              <div className="flex flex-col h-full">
                <div className="flex flex-1 overflow-hidden">
                  <SplitterLayout vertical primaryIndex={0} percentage primaryInitialSize={33} secondaryInitialSize={66}>
                    <div className="flex flex-col bg-white h-full">
                      <div className="flex items-center bg-neutral-50 px-4 h-9 font-bold text-[11px] text-neutral-500 uppercase shrink-0">HTML</div>
                      <MonacoEditor
                        language="html"
                        value={html}
                        onChange={(v, cursorCoords) => {
                          if (isDeletingKey && v.replace(/\s/g, "").length < htmlRef.current.replace(/\s/g, "").length) {
                            playFahhhSound();
                            spawnFallingLetters(htmlRef.current, v, cursorCoords);
                          }
                          htmlRef.current = v; // Sync ref instantly to avoid missed multi-stroke cascades
                          setHtml(v);
                        }}
                        theme="vs"
                      />
                    </div>
                    <SplitterLayout vertical primaryIndex={0} secondaryInitialSize={(window?.innerHeight ?? 0) / 3}>
                      <div className="flex flex-col bg-white h-full">
                        <div className="flex items-center bg-neutral-50 px-4 h-9 font-bold text-[11px] text-neutral-500 uppercase shrink-0">CSS</div>
                        <MonacoEditor
                          language="css"
                          value={css}
                          onChange={(v, cursorCoords) => {
                            if (isDeletingKey && v.replace(/\s/g, "").length < cssRef.current.replace(/\s/g, "").length) {
                              playFahhhSound();
                              spawnFallingLetters(cssRef.current, v, cursorCoords);
                            }
                            cssRef.current = v;
                            setCss(v);
                          }}
                          theme="vs"
                        />
                      </div>
                      <div className="flex flex-col bg-white h-full">
                        <div className="flex items-center bg-neutral-50 px-4 h-9 font-bold text-[11px] text-neutral-500 uppercase shrink-0">JS</div>
                        <MonacoEditor
                          language="javascript"
                          value={js}
                          onChange={(v, cursorCoords) => {
                            if (isDeletingKey && v.replace(/\s/g, "").length < jsRef.current.replace(/\s/g, "").length) {
                              playFahhhSound();
                              spawnFallingLetters(jsRef.current, v, cursorCoords);
                            }
                            jsRef.current = v;
                            setJs(v);
                          }}
                          theme="vs"
                        />
                      </div>
                    </SplitterLayout>
                  </SplitterLayout>
                </div>
              </div>
              <div className="flex flex-col bg-white h-full">
                <div className="flex items-center bg-neutral-50 px-4 h-9 font-bold text-[11px] text-neutral-500 uppercase shrink-0">Output</div>
                <iframe srcDoc={srcDoc} title="output" width="100%" height="100%" className="bg-white" />
              </div>
            </SplitterLayout>
          </EditorLayout.Main>
        </SplitterLayout>
      </div>
    </>
  );
}
