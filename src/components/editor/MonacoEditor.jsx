"use client";

import React, { useEffect, useRef, useState } from "react";

export default function MonacoEditor({ language, value, onChange, theme = "vs", totalErrorCount = 0, isBlocked = false, onErrorCountChange }) {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const onErrorCountChangeRef = useRef(onErrorCountChange);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onErrorCountChangeRef.current = onErrorCountChange;
  }, [onErrorCountChange]);

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
          readOnly: isBlocked,
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

        const updateErrorCount = () => {
          const model = editorRef.current?.getModel();
          if (!model) {
            setErrorCount(0);
            onErrorCountChangeRef.current?.(0);
            return;
          }

          const markers = monaco.editor.getModelMarkers({ resource: model.uri });
          const errors = markers.filter((marker) => marker.severity === monaco.MarkerSeverity.Error);
          const nextCount = errors.length;
          setErrorCount(nextCount);
          onErrorCountChangeRef.current?.(nextCount);
        };

        editorRef.current.onDidChangeModelContent(() => {
          if (onChangeRef.current) {
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
            
            onChangeRef.current(editorRef.current.getValue(), cursorCoords);
          }
          updateErrorCount();
        });

        updateErrorCount();

        const markerSubscription = monaco.editor.onDidChangeMarkers(() => {
          updateErrorCount();
        });

        const modelChangeSubscription = editorRef.current.onDidChangeModel(() => {
          updateErrorCount();
        });

        editorRef.current.__markerSubscription = markerSubscription;
        editorRef.current.__modelChangeSubscription = modelChangeSubscription;
      }
    };

    initMonaco();

    return () => {
      mounted = false;
      onErrorCountChangeRef.current?.(0);
      if (editorRef.current) {
        editorRef.current.__markerSubscription?.dispose?.();
        editorRef.current.__modelChangeSubscription?.dispose?.();
        editorRef.current.dispose();
      }
    };
  }, [language, theme]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly: isBlocked });
    }
  }, [isBlocked]);

  // Keep value in sync if it changes externally
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  return (
    <div className="relative flex min-h-0 grow flex-col">
      <div ref={containerRef} className="min-h-0 grow" />

      <div className="flex h-8 shrink-0 items-center justify-between border-t border-neutral-200 bg-neutral-50 px-3 text-xs font-medium text-neutral-700">
        <span>Errors (All Editors)</span>
        <span className={totalErrorCount >= 3 ? "font-semibold text-red-600" : "text-neutral-700"}>{totalErrorCount}</span>
      </div>
    </div>
  );
}
