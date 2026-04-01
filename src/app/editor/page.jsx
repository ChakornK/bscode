"use client";

import React, { useState, useEffect, useMemo } from "react";
import SplitterLayout from "react-splitter-layout";
import "react-splitter-layout/lib/index.css";
import { PiFlask } from "react-icons/pi";
import { EditorLayout } from "@/components/editor/EditorLayout";
import { SidebarProvider, ActivityBar, SidebarView } from "@/components/editor/EditorSidebar";
import MonacoEditor from "@/components/editor/MonacoEditor";

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

  const editorTabs = [{ id: "test", title: "Test", icon: PiFlask }];

  return (
    <EditorLayout>
      <div className="flex flex-1 overflow-hidden">
        <SidebarProvider
          initialItems={editorTabs.map((tab) => ({
            id: tab.id,
            icon: tab.icon,
            title: tab.title,
            component: <div>Test</div>,
          }))}
        >
          <EditorLayout.ActivityBar>
            <ActivityBar />
          </EditorLayout.ActivityBar>
          <EditorLayout.Main>
            <SplitterLayout horizontal primaryIndex={0} secondaryInitialSize={40} percentage>
              <div className="flex h-full flex-col">
                <div className="flex flex-1 overflow-hidden">
                  <SplitterLayout vertical primaryIndex={0} percentage primaryInitialSize={33} secondaryInitialSize={66}>
                    <div className="flex h-full flex-col bg-white">
                      <div className="flex h-9 shrink-0 items-center bg-neutral-50 px-4 text-[11px] font-bold uppercase text-neutral-500">HTML</div>
                      <MonacoEditor language="html" value={html} onChange={setHtml} theme="vs" />
                    </div>
                    <SplitterLayout vertical primaryIndex={0}>
                      <div className="flex h-full flex-col bg-white">
                        <div className="flex h-9 shrink-0 items-center bg-neutral-50 px-4 text-[11px] font-bold uppercase text-neutral-500">CSS</div>
                        <MonacoEditor language="css" value={css} onChange={setCss} theme="vs" />
                      </div>
                      <div className="flex h-full flex-col bg-white">
                        <div className="flex h-9 shrink-0 items-center bg-neutral-50 px-4 text-[11px] font-bold uppercase text-neutral-500">JS</div>
                        <MonacoEditor language="javascript" value={js} onChange={setJs} theme="vs" />
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
        </SidebarProvider>
      </div>
    </EditorLayout>
  );
}
