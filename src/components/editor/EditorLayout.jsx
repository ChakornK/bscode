"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { createContext, useState } from "react";
import { PaywallDialog } from "./PaywallDialog";
import { useTheme } from "./ThemeContext";

import { Switch } from "@/components/ui/switch";

const LayoutContext = createContext(null);

export function EditorLayout({ children }) {
  return (
    <LayoutContext.Provider value={{}}>
      <div className="flex h-screen w-screen select-none flex-col overflow-hidden bg-white dark:bg-[#1e1e1e] font-sans text-[#333333] dark:text-[#cccccc] selection:bg-[#add6ff]">
        <EditorLayout.TitleBar />
        {children}
      </div>
    </LayoutContext.Provider>
  );
}

EditorLayout.TitleBar = function TitleBar() {
  const [hovering, setHovering] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [themePaywallOpen, setThemePaywallOpen] = useState(false);
  const [closed, setClosed] = useState(false);
  const [darkUnlocked, setDarkUnlocked] = useState(false);
  const { theme, setTheme } = useTheme();

  function handleClose() {
    setPaywallOpen(true);
  }

  function handleThemeToggle(checked) {
    if (checked) {
      if (darkUnlocked) {
        setTheme("dark");
      } else {
        setThemePaywallOpen(true);
      }
    } else {
      setTheme("light");
    }
  }

  function handleThemeUnlocked() {
    setDarkUnlocked(true);
    setTheme("dark");
  }

  function handleMinimize() {
    document.documentElement.style.transform = "scale(0.95)";
    document.documentElement.style.opacity = "0";
    document.documentElement.style.transition = "transform 0.2s, opacity 0.2s";
    setTimeout(() => {
      document.documentElement.style.transform = "";
      document.documentElement.style.opacity = "";
    }, 200);
  }

  function handleMaximize() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  if (closed) {
    return <div className="fixed inset-0 z-[9999] bg-black" />;
  }

  return (
    <header className="relative flex h-7 shrink-0 items-center bg-[#dddddd] dark:bg-[#1e1e1e] px-3 text-[#333333] dark:text-[#cccccc]">
      {/* Traffic lights */}
      <div
        className="flex items-center gap-[6px]"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <button
          onClick={handleClose}
          className="flex h-3 w-3 items-center justify-center rounded-full bg-[#ff5f57] hover:brightness-90 focus:outline-none"
          title="Close"
        >
          {hovering && <span className="text-[8px] font-bold leading-none text-[#4d0000]">×</span>}
        </button>
        <button
          onClick={handleMinimize}
          className="flex h-3 w-3 items-center justify-center rounded-full bg-[#febc2e] hover:brightness-90 focus:outline-none"
          title="Minimize"
        >
          {hovering && <span className="text-[8px] font-bold leading-none text-[#4d3300]">−</span>}
        </button>
        <button
          onClick={handleMaximize}
          className="flex h-3 w-3 items-center justify-center rounded-full bg-[#28c840] hover:brightness-90 focus:outline-none"
          title="Maximize"
        >
          {hovering && <span className="text-[8px] font-bold leading-none text-[#003300]">+</span>}
        </button>
      </div>

      {/* Centered title */}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13px] text-[#333333]/80 dark:text-[#cccccc]/80">
        BSCode
      </span>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-0.5">
        <div className="flex items-center gap-2">
          <SunIcon className="size-4" />
          <Switch checked={theme === "dark"} onCheckedChange={handleThemeToggle} />
          <MoonIcon className="size-4 text-muted-foreground" />
        </div>
      </div>

      <PaywallDialog open={paywallOpen} onOpenChange={setPaywallOpen} onSuccess={() => setClosed(true)} />
      <PaywallDialog
        open={themePaywallOpen}
        onOpenChange={setThemePaywallOpen}
        onSuccess={handleThemeUnlocked}
        title="BSCode Dark Mode"
        description="Dark mode is a premium feature. Enter your license to unlock it."
      />
    </header>
  );
};

EditorLayout.ActivityBar = function ActivityBar({ children }) {
  return <aside className="z-10 flex h-full w-12 shrink-0 flex-col items-center gap-4 bg-[#f3f3f3] dark:bg-[#333333] py-4">{children}</aside>;
};

EditorLayout.Sidebar = function Sidebar({ children, title }) {
  return (
    <div className="flex h-full w-full shrink-0 flex-col overflow-hidden border-r border-[#e5e5e5] dark:border-[#414141] bg-[#f3f3f3] dark:bg-[#252526]">
      {title && (
        <div className="select-none border-b border-[#e5e5e5] dark:border-[#414141] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#616161] dark:text-[#bbbbbb]">{title}</div>
      )}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
};

EditorLayout.Main = function Main({ children }) {
  return <main className="relative flex h-full flex-1 flex-col overflow-hidden bg-white dark:bg-[#1e1e1e]">{children}</main>;
};

EditorLayout.StatusBar = function StatusBar({ children }) {
  return (
    <footer className="flex h-[22px] shrink-0 items-center justify-between bg-[#007ACC] px-2 text-[12px] text-white">
      {children}
    </footer>
  );
};
