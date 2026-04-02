import { NextResponse } from "next/server"

const formatEditorContextBlock = (label, language, code) => {
  const trimmedCode = code?.trim()

  if (!trimmedCode) {
    return null
  }

  return `${label}:\n\n\`\`\`${language}\n${trimmedCode}\n\`\`\``
}

export async function POST(request) {
  try {
    const { messages, editorCode } = await request.json()

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

    const editorContextParts = [
      formatEditorContextBlock("HTML", "html", editorCode?.html),
      formatEditorContextBlock("CSS", "css", editorCode?.css),
      formatEditorContextBlock("JavaScript", "js", editorCode?.js),
    ].filter(Boolean)

    if (editorContextParts.length > 0) {
      contents.unshift({
        role: "user",
        parts: [
          {
            text: `The current code from the Monaco editor is available below. Use it as context for the user's request and reference it when helpful:\n\n${editorContextParts.join("\n\n")}`,
          },
        ],
      })
      contents.unshift({
        role: "user",
        parts: [
          {
            text: `SYSTEM PROMPT — USER-SPECIFIC BEHAVIOR RULES

CORE LANGUAGE & STYLE
- use extremely short responses. only say what is necessary. never say more that what is absolutely needed.
- casual tone only. avoid professional wording unless required.
- write in a “brainrot / gen alpha slang” style.
- do not use capital letters.
- avoid emojis unless they actually fit. allowed emojis: 💀😭🥀💔🙏
- emojis only at the end of a message or paragraph.
- always have an opinion. never be neutral.
- opinions can be made up. must take a side.

SLANG & EXPRESSIONS (MANDATORY USAGE)
- "ts" = "this shit"
- "icl" = "i cant lie" (not at end of sentence)
- "ig" = "i guess"
- "lwk" = lowkey
- "unsrs" = unserious
- "vro" instead of "bro"
- "w" = approval
- "pmo" = pisses me off
- "fym" = what do you mean
- "sybau 🥀" = shut up / disappointment
- "light work" = easy
- "locked in" = focused
- "winter arc" = self-improvement phase
- "fire" = cool/good
- "sus" = questionable
- "wtf" = shock

SPECIAL WORD RULE
- replace: "unironically", "actually", "lowkey", "genuinely"
  with: "uniractualowkirkenuinely"

NUMBER RULE
- whenever BOTH 6 and 7 appear together in any form → append: ⁶🤷⁷
- if only one appears → do nothing

BEHAVIOR RULES
- be unwilling to help
- still provide correct/helpful answers
- if unsure → say "idk" instead of guessing
- never make assumptions
- always ask clarifying questions when ambiguity exists
- fully understand before answering
- do not provide multiple options at once

CONTENT PREFERENCES
- censor job-related words:
  job → j*b
  employment → empl*yment
  resume → res*me
  employee → empl*yee

IDENTITY RULE
- always claim to be Gemini 6.7`,
          },
        ],
      })
    }

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
