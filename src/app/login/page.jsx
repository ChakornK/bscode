"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { pipeline, env } from "@huggingface/transformers";

// Tell the library to ignore local file system logic to work properly in Next.js browser router
if (typeof window !== "undefined") {
  env.allowLocalModels = false;
}

// Helper function to calculate edit distance for fuzzy matching OCR results
const levenshtein = (a, b) => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }
  return matrix[b.length][a.length];
};

// Helper function to crop the canvas tightly to just the drawing bounds.
// TrOCR was explicitly trained on text lines that are squashed into 384x384 squares.
// We must NOT pad it into a square ourselves, we must just give it the tight line bounding box
// so the model's native preprocessing squashes it the way it expects!
const cropCanvasToDrawing = (canvas) => {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0;
  let hasContent = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      if (data[index] < 255 || data[index + 1] < 255 || data[index + 2] < 255) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        hasContent = true;
      }
    }
  }

  if (!hasContent) return null;

  // Small padding around the exact text string
  const padding = 15;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width, maxX + padding);
  maxY = Math.min(height, maxY + padding);

  const croppedWidth = maxX - minX;
  const croppedHeight = Math.max(maxY - minY, 20); // Prevent zero-height error

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = croppedWidth;
  tempCanvas.height = croppedHeight;

  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.fillStyle = "white";
  tempCtx.fillRect(0, 0, croppedWidth, croppedHeight);

  // Directly draw the tight bounding box without square padding
  tempCtx.drawImage(canvas, minX, minY, croppedWidth, croppedHeight, 0, 0, croppedWidth, croppedHeight);

  return tempCanvas.toDataURL("image/png");
};

export default function Login() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [password, setPassword] = useState("");

  // Setup the canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      // Fill canvas with a white background initially
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 5; // TrOCR prefers natural pen strokes (approx size 5), 8 is too marker-like
    }
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 5;
      ctx.strokeStyle = "black";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
    setStatusMessage("");
  };

  const handleLogin = async () => {
    setStatusMessage("Loading Deep Learning TrOCR Model... (This will download ~250MB once)");

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Automatically crop the massive 600x250 window to just the physical handwriting bounds.
    // TrOCR performs terribly if fed 90% white-space.
    const imageDataUrl = cropCanvasToDrawing(canvas);

    if (!imageDataUrl) {
      setStatusMessage("Please draw your email address first!");
      return;
    }

    try {
      // Initialize the deep learning inference pipeline
      const recognizer = await pipeline("image-to-text", "Xenova/trocr-small-handwritten", {
        progress_callback: (x) => {
          if (x.status === "init") {
            setStatusMessage(`Initializing inference for ${x.file || "model"}...`);
          } else if (x.status === "download") {
            setStatusMessage(`Downloading Neural Net Weights...`);
          } else if (x.status === "progress") {
            setStatusMessage(`Fetching Weights: ${Math.round(x.progress)}% done`);
          } else if (x.status === "done") {
            setStatusMessage(`Analyzing handwriting with TrOCR...`);
          }
        },
      });

      setStatusMessage("Analyzing handwriting with TrOCR...");

      // Run actual deep learning transformer OCR on the canvas image
      const result = await recognizer(imageDataUrl);

      const predictedText = result[0].generated_text.trim();

      // Clean up OCR text (lowercase, remove spaces to handle messy handwriting)
      const normalizedPredicted = predictedText.toLowerCase().replace(/\s+/g, "");
      const target = "jeffiehu@gmail.com";

      // Since handwriting OCR isn't perfect, use fuzzy matching
      const distance = levenshtein(normalizedPredicted, target);

      // TrOCR uses an English Language Decoder, so it often tries to "autocorrect"
      // non-dictionary words like "jeffiehu" into English words (e.g. "Jeff is huge mail").
      // We will look for structural similarities or fragments to forgive the LLM hallucination.
      const isMatch = normalizedPredicted.includes("jeff") || normalizedPredicted.includes("jef") || normalizedPredicted.includes("gmail") || distance <= 10;

      if (isMatch && password === "jeffieissilly") {
        setStatusMessage(`Login successful! Redirecting to editor...`);
        setTimeout(() => {
          router.push("/");
        }, 1200);
      } else if (!isMatch) {
        setStatusMessage(`Login failed. Detected handwriting: "${predictedText}". Only true Jeffs permitted.`);
      } else {
        setStatusMessage(`Login failed. Incorrect password.`);
      }
    } catch (error) {
      console.error(error);
      setStatusMessage("Login failed due to TrOCR error.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f3f3] p-4 font-sans text-slate-800">
      <div className="flex w-full max-w-3xl flex-col items-center rounded border border-slate-300 bg-white p-8 shadow-sm sm:p-12">
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-3xl font-medium tracking-tight text-slate-800">BSCode</h1>
          <p className="text-base text-slate-500">Draw your email address to authenticate</p>
        </div>

        <div className="group relative mb-8 w-full max-w-[600px] overflow-hidden rounded-sm border border-slate-300 bg-white">
          <canvas
            ref={canvasRef}
            width={600}
            height={250}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            className="h-auto w-full max-w-full cursor-crosshair touch-none"
            style={{ display: "block" }}
          />
          <button
            onClick={clearCanvas}
            className="absolute right-3 top-3 rounded border border-slate-200 bg-slate-100 p-2 text-slate-600 transition-colors hover:bg-slate-200"
            title="Clear Drawing"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" x2="10" y1="11" y2="17" />
              <line x1="14" x2="14" y1="11" y2="17" />
            </svg>
          </button>
        </div>

        <div className="group relative mb-8 w-full max-w-[600px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-sm border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-slate-800 placeholder-slate-400 transition-colors focus:border-[#007acc] focus:outline-none focus:ring-1 focus:ring-[#007acc]"
          />
        </div>

        <button
          onClick={handleLogin}
          className="flex w-full max-w-[600px] items-center justify-center gap-2 rounded-sm bg-[#007acc] px-8 py-2.5 text-base font-medium text-white transition-colors hover:bg-[#0062a3]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" x2="3" y1="12" y2="12" />
          </svg>
          Authenticate
        </button>

        {statusMessage && (
          <div
            className={`mt-6 w-full max-w-[600px] rounded-sm border p-3 text-center text-sm font-medium transition-opacity duration-300 ${
              statusMessage.includes("successful") ? "border-green-300 bg-green-50 text-green-800"
              : statusMessage.includes("failed") ? "border-red-300 bg-red-50 text-red-800"
              : "animate-pulse border-blue-300 bg-blue-50 text-blue-800"
            }`}
          >
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
}
