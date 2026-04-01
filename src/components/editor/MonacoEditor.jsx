"use client";

import React, { useEffect, useRef } from "react";

export default function MonacoEditor({ language, value, onChange, theme = "vs" }) {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const initMonaco = async () => {
      const monaco = await import("monaco-editor");
      monacoRef.current = monaco;

      if (mounted && containerRef.current) {
        editorRef.current = monaco.editor.create(containerRef.current, {
          value,
          language,
          theme,
          automaticLayout: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: "on",
          roundedSelection: false,
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
          },
        });

        editorRef.current.onDidChangeModelContent(() => {
          if (onChange) {
            const cursorPos = editorRef.current.getPosition();
            const layoutInfo = editorRef.current.getLayoutInfo();
            const topOffset = editorRef.current.getTopForLineNumber(cursorPos.lineNumber);
            
            // Get the approximate x position (left of editor + some offset for the column)
            const containerRect = containerRef.current.getBoundingClientRect();
            const lineNumberWidth = layoutInfo.lineNumbersWidth;
            const charWidth = layoutInfo.averageCharacterWidth || 8;
            
            const cursorCoords = {
              top: containerRect.top + topOffset,
              left: containerRect.left + lineNumberWidth + (cursorPos.column * charWidth)
            };
            
            onChange(editorRef.current.getValue(), cursorCoords);
          }
        });
      }
    };

    initMonaco();

    return () => {
      mounted = false;
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, [language, theme]);

  // Keep value in sync if it changes externally
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  return <div ref={containerRef} className="min-h-0 grow" />;
}
