"use client";

import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/prompt-kit/chat-container"
import { Markdown } from "@/components/prompt-kit/markdown"
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/prompt-kit/message"
import { ChatInput } from "@/components/ChatInput"
import { useEffect, useRef, useState } from "react"

export default function ChatPanel() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "user",
      content: "Hello! Can you help me with a coding question?",
    },
    {
      id: 2,
      role: "assistant",
      content:
        "Of course! I'd be happy to help with your coding question. What would you like to know?",
    },
    {
      id: 3,
      role: "user",
      content: "How do I create a responsive layout with CSS Grid?",
    },
    {
      id: 4,
      role: "assistant",
      content:
        "Creating a responsive layout with CSS Grid is straightforward. Here's a basic example:\n\n```css\n.container {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\n  gap: 1rem;\n}\n```\n\nThis creates a grid where:\n- Columns automatically fit as many as possible\n- Each column is at least 250px wide\n- Columns expand to fill available space\n- There's a 1rem gap between items\n\nWould you like me to explain more about how this works?",
    },
  ])

  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const streamAbortControllerRef = useRef(null)

  const updateAssistantMessage = (messageId, updater) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId ? updater(message) : message
      )
    )
  }

  const appendAssistantText = (messageId, chunk) => {
    if (!chunk) return

    updateAssistantMessage(messageId, (message) => ({
      ...message,
      content: `${message.content || ""}${chunk}`,
    }))
  }

  const readStream = async (response, messageId) => {
    if (!response.body) {
      throw new Error("Missing streamed response body")
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n")

        const events = buffer.split("\n\n")
        buffer = events.pop() ?? ""

        for (const event of events) {
          const data = event
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.replace(/^data:\s?/, ""))
            .join("\n")
            .trim()

          if (!data || data === "[DONE]") {
            continue
          }

          try {
            const parsed = JSON.parse(data)
            const chunk =
              parsed?.candidates?.[0]?.content?.parts
                ?.map((part) => part?.text || "")
                .join("") || ""

            appendAssistantText(messageId, chunk)
          } catch {
            continue
          }
        }
      }

      const remaining = buffer.trim()

      if (remaining.startsWith("data:")) {
        const data = remaining
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.replace(/^data:\s?/, ""))
          .join("\n")
          .trim()

        if (data && data !== "[DONE]") {
          try {
            const parsed = JSON.parse(data)
            const chunk =
              parsed?.candidates?.[0]?.content?.parts
                ?.map((part) => part?.text || "")
                .join("") || ""

            appendAssistantText(messageId, chunk)
          } catch {
            // Ignore trailing partial event parse failures.
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  const handleSubmit = async () => {
    if (isStreaming) return

    const trimmedInput = input.trim()

    if (!trimmedInput) return

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: trimmedInput,
    }
    const assistantMessageId = Date.now() + 1

    const nextMessages = [...messages, userMessage]
    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      },
    ])
    setInput("")
    setIsStreaming(true)

    const controller = new AbortController()
    streamAbortControllerRef.current = controller

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || "Failed to fetch Gemini response")
      }

      await readStream(response, assistantMessageId)
    } catch (error) {
      const errorMessage =
        error?.name === "AbortError"
          ? "Generation stopped."
          : `Error: ${error.message || "Unknown error"}`

      updateAssistantMessage(assistantMessageId, (message) => ({
        ...message,
        content: errorMessage,
      }))
    } finally {
      if (streamAbortControllerRef.current === controller) {
        streamAbortControllerRef.current = null
      }

      setIsStreaming(false)
    }
  }

  useEffect(() => {
    return () => {
      if (streamAbortControllerRef.current) {
        streamAbortControllerRef.current.abort()
      }
    }
  }, [])

  return (
    <div className="flex flex-col w-full h-full min-h-0 overflow-hidden">
      <div className="flex justify-between items-center p-3 border-b shrink-0">
        <div />
        <div className="text-muted-foreground text-sm">
          {isStreaming ? "Streaming..." : "Ready"}
        </div>
      </div>

      <ChatContainerRoot className="flex-1 min-h-0 overflow-y-auto">
        <ChatContainerContent className="space-y-4 p-4 min-h-full">
          {messages.map((message) => {
            const isAssistant = message.role === "assistant"

            return (
              <Message
                key={message.id}
                className={
                  message.role === "user" ? "justify-end" : "justify-start"
                }
              >
                {isAssistant && (
                  <MessageAvatar
                    src="/avatars/ai.png"
                    alt="AI Assistant"
                    fallback="AI"
                  />
                )}
                <div className="flex-1 max-w-[85%] sm:max-w-[75%]">
                  {isAssistant ? (
                    <div className="bg-secondary p-2 rounded-lg text-foreground prose">
                      <Markdown>{message.content}</Markdown>
                    </div>
                  ) : (
                    <MessageContent className="bg-primary text-primary-foreground">
                      {message.content}
                    </MessageContent>
                  )}
                </div>
              </Message>
            )
          })}
        </ChatContainerContent>
      </ChatContainerRoot>

      <div className="bg-background p-3 border-t shrink-0">
        <ChatInput
          value={input}
          onValueChange={setInput}
          isLoading={isStreaming}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}
