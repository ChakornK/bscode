"use client"

import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input"
import { Button } from "@/components/ui/button"
import { ArrowUp, Square } from "lucide-react"

export function ChatInput({
  value,
  onValueChange,
  isLoading = false,
  onSubmit,
  className = "",
}) {
  const handleSubmit = () => {
    if (isLoading) return
    onSubmit?.()
  }

  return (
    <PromptInput
      value={value}
      onValueChange={onValueChange}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      className={`w-full ${className}`}
    >
      <PromptInputTextarea placeholder="Ask me anything..." />
      <PromptInputActions className="justify-end pt-2">
        <PromptInputAction
          tooltip={isLoading ? "Stop generation" : "Send message"}
        >
          <Button
            variant="default"
            size="icon"
            className="rounded-full w-8 h-8"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <Square className="fill-current size-5" />
            ) : (
              <ArrowUp className="size-5" />
            )}
          </Button>
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  )
}

export default ChatInput
