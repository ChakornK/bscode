import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const { messages } = await request.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages is required" },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      )
    }

    const contents = messages
      .filter((message) => message?.content)
      .map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: String(message.content) }],
      }))

    if (contents.length === 0) {
      return NextResponse.json(
        { error: "No valid message content provided" },
        { status: 400 }
      )
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    )

    if (!geminiResponse.ok) {
      const data = await geminiResponse.json().catch(() => null)

      return NextResponse.json(
        { error: data?.error?.message || "Gemini request failed" },
        { status: geminiResponse.status }
      )
    }

    if (!geminiResponse.body) {
      return NextResponse.json(
        { error: "Gemini response did not include a stream" },
        { status: 500 }
      )
    }

    return new Response(geminiResponse.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
