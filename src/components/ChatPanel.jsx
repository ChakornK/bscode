"use client";

import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/prompt-kit/chat-container"
import { ChatInput } from "@/components/ChatInput"
import { MessageBasic } from "@/components/Message"
import { useEditorCode } from "@/components/editor/EditorCodeContext"
import { useEffect, useRef, useState } from "react"

export default function ChatPanel() {
  const editorCode = useEditorCode()
  const [messages, setMessages] = useState([])

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
          editorCode,
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
      <div className="flex justify-start items-center gap-2 p-3 border-b shrink-0">
        <div className="text-muted-foreground text-sm">
          {isStreaming ? "Streaming..." : "Ready"}
        </div>
        <div
          className={`h-2.5 w-2.5 rounded-full ${
            isStreaming ? "bg-orange-500" : "bg-green-500"
          }`}
          aria-label={isStreaming ? "Streaming status" : "Ready status"}
          role="status"
        />
      </div>

      <ChatContainerRoot className="flex-1 min-h-0 overflow-y-auto">
        <ChatContainerContent className="space-y-4 p-4 min-h-full">
          {messages.map((message) => {
            return (
              <MessageBasic
                key={message.id}
                role={message.role}
                content={message.content}
              />
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
