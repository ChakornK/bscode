"use client";

import { createContext, useContext, useState } from "react";

const SidebarContext = createContext(null);

export function SidebarProvider({ children, initialItems = [] }) {
  const [items, setItems] = useState(initialItems);
  const [activeId, setActiveId] = useState(initialItems[0]?.id || null);

  const registerItem = (item) => {
    setItems((prev) => [...prev, item]);
  };

  const activeItem = items.find((item) => item.id === activeId);

  return <SidebarContext.Provider value={{ items, activeId, setActiveId, activeItem, registerItem }}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

export function ActivityBar() {
  const { items, activeId, setActiveId } = useSidebar();

  return (
    <div className="flex h-full w-full flex-col items-center gap-1">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveId(activeId === item.id ? null : item.id)}
          className={`group relative cursor-pointer p-3 transition-colors duration-200 ${
            activeId === item.id
              ? "text-[#424242] dark:text-[#cccccc]"
              : "text-[#616161] dark:text-[#858585] hover:text-[#424242] dark:hover:text-[#cccccc]"
          }`}
          title={item.title}
        >
          {activeId === item.id && <div className="absolute bottom-0 left-0 top-0 w-[2px] bg-[#424242] dark:bg-[#cccccc]" />}
          <div className="flex h-6 w-6 items-center justify-center">
            <item.icon size={24} />
          </div>
        </button>
      ))}
      <div className="mb-4 mt-auto flex flex-col items-center gap-4">{/* Settings icon could go here */}</div>
    </div>
  );
}

export function SidebarView() {
  const { activeItem } = useSidebar();

  if (!activeItem) return null;

  return (
    <div className="flex h-full flex-col bg-[#f3f3f3] dark:bg-[#252526]">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="select-none text-[11px] font-bold uppercase tracking-wider text-[#616161] dark:text-[#bbbbbb]">{activeItem.title}</h2>
      </div>
      <div className="flex-1 overflow-hidden">{activeItem.component}</div>
    </div>
  );
}
