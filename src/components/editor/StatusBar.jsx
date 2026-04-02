"use client";

import React from "react";
import { VscSourceControl, VscError, VscWarning } from "react-icons/vsc";

const languageNames = {
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
};

function StatusBarItem({ children }) {
  return (
    <button className="flex cursor-pointer items-center gap-1 px-1.5 leading-[22px] hover:bg-white/10">
      {children}
    </button>
  );
}

export default function StatusBar({ cursorLine = 1, cursorColumn = 1, activeLanguage = "html" }) {
  return (
    <>
      <div className="flex items-center">
        <StatusBarItem>
          <VscSourceControl size={14} />
          main
        </StatusBarItem>
        <StatusBarItem>
          <VscError size={13} />
          0
          <VscWarning size={13} />
          0
        </StatusBarItem>
      </div>
      <div className="flex items-center">
        <StatusBarItem>Ln {cursorLine}, Col {cursorColumn}</StatusBarItem>
        <StatusBarItem>Spaces: 2</StatusBarItem>
        <StatusBarItem>UTF-8</StatusBarItem>
        <StatusBarItem>LF</StatusBarItem>
        <StatusBarItem>{languageNames[activeLanguage] ?? activeLanguage}</StatusBarItem>
      </div>
    </>
  );
}
