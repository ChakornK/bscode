"use client";

import { createContext, useContext } from "react"

const EditorCodeContext = createContext(null)

export function EditorCodeProvider({ value, children }) {
  return (
    <EditorCodeContext.Provider value={value}>
      {children}
    </EditorCodeContext.Provider>
  )
}

export function useEditorCode() {
  return useContext(EditorCodeContext)
}
