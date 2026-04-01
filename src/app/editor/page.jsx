"use client";

import React, { useState, useEffect, useMemo } from "react";
import SplitterLayout from "react-splitter-layout";
import "react-splitter-layout/lib/index.css";
import { PiSparkle } from "react-icons/pi";
import { EditorLayout } from "@/components/editor/EditorLayout";
import { SidebarProvider, ActivityBar, SidebarView, useSidebar } from "@/components/editor/EditorSidebar";
import MonacoEditor from "@/components/editor/MonacoEditor";
import ChatPanel from "@/components/ChatPanel";

const editorTabs = [{ id: "chat", title: "Chat", icon: PiSparkle, component: <ChatPanel /> }];

let fahhAudio = null;
let lastFahhhTime = 0;
const playFahhhSound = () => {
  if (typeof window === 'undefined') return;
  
  const now = Date.now();
  if (now - lastFahhhTime < 50) return; // 0.05 seconds cooldown
  lastFahhhTime = now;
  
  if (!fahhAudio) {
    fahhAudio = new Audio('/fahh.mp3');
  }
  
  // Clone the node so rapid deletions overlap wildly instead of cutting off
  const overlapNode = fahhAudio.cloneNode();
  overlapNode.play().catch(e => console.error('Audio playback blocked or file missing: ', e));
};

export default function Editor() {
  const [html, setHtml] = useState("<h1>Hello World</h1>\n<p>Start editing to see the magic!</p>");
  const [css, setCss] = useState("h1 { color: #007acc; }\nbody { font-family: sans-serif; padding: 20px; }");
  const [js, setJs] = useState("console.log('Hello from JS!');");

  const combinedCode = useMemo(() => {
    return `
      <html>
        <head>
          <style>${css}</style>
        </head>
        <body>
          ${html}
          <script>${js}</script>
        </body>
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
      <div className="flex w-screen flex-1 overflow-hidden">
        <SidebarProvider initialItems={editorTabs}>
          <EditorContent html={html} setHtml={setHtml} css={css} setCss={setCss} js={js} setJs={setJs} srcDoc={srcDoc} />
        </SidebarProvider>
      </div>
    </EditorLayout>
  );
}

let capturedPointerId;
function EditorContent({ html, setHtml, css, setCss, js, setJs, srcDoc }) {
  const { activeId } = useSidebar();

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
                      <MonacoEditor language="html" value={html} onChange={(v) => {
                        if (v.length < html.length) playFahhhSound();
                        setHtml(v);
                      }} theme="vs" />
                    </div>
                    <SplitterLayout vertical primaryIndex={0} secondaryInitialSize={window.innerHeight / 3}>
                      <div className="flex h-full flex-col bg-white">
                        <div className="flex h-9 shrink-0 items-center bg-neutral-50 px-4 text-[11px] font-bold uppercase text-neutral-500">CSS</div>
                        <MonacoEditor language="css" value={css} onChange={(v) => {
                          if (v.length < css.length) playFahhhSound();
                          setCss(v);
                        }} theme="vs" />
                      </div>
                      <div className="flex h-full flex-col bg-white">
                        <div className="flex h-9 shrink-0 items-center bg-neutral-50 px-4 text-[11px] font-bold uppercase text-neutral-500">JS</div>
                        <MonacoEditor language="javascript" value={js} onChange={(v) => {
                          if (v.length < js.length) playFahhhSound();
                          setJs(v);
                        }} theme="vs" />
                      </div>
                    </SplitterLayout>
                  </SplitterLayout>
                </div>
              </div>
              <div className="flex h-full flex-col bg-white">
                <div className="flex h-9 shrink-0 items-center bg-neutral-50 px-4 text-[11px] font-bold uppercase text-neutral-500">Output</div>
                <iframe srcDoc={srcDoc} title="output" sandbox="allow-scripts" width="100%" height="100%" className="bg-white" />
              </div>
            </SplitterLayout>
          </EditorLayout.Main>
        </SplitterLayout>
      </div>
    </>
  );
}
