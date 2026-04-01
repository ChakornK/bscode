"use client";

import React, { createContext, useContext } from "react";

const LayoutContext = createContext(null);

export function EditorLayout({ children }) {
  return (
    <LayoutContext.Provider value={{}}>
      <div className="flex h-screen w-screen select-none flex-col overflow-hidden bg-white font-sans text-[#333333] selection:bg-[#add6ff]">{children}</div>
    </LayoutContext.Provider>
  );
}

EditorLayout.ActivityBar = function ActivityBar({ children }) {
  return <aside className="z-10 flex h-full w-12 shrink-0 flex-col items-center gap-4 bg-neutral-100 py-4">{children}</aside>;
};

EditorLayout.Sidebar = function Sidebar({ children, title, width = "260px" }) {
  return (
    <div className="flex h-full shrink-0 flex-col overflow-hidden border-r border-neutral-200 bg-neutral-50" style={{ width }}>
      {title && <div className="select-none border-b border-neutral-200 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#6f6f6f]">{title}</div>}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
};

EditorLayout.Main = function Main({ children }) {
  return <main className="relative flex h-full flex-1 flex-col overflow-hidden bg-white">{children}</main>;
};
