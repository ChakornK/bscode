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
            onChange(editorRef.current.getValue());
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

  return <div ref={containerRef} className="h-full w-full" />;
}
