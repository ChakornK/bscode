import {
  Message,
  MessageContent,
} from "@/components/prompt-kit/message"
import { Markdown } from "@/components/prompt-kit/markdown"

export function MessageBasic({
  role,
  content,
}) {
  const isAssistant = role === "assistant"

  return (
    <Message className={role === "user" ? "justify-end" : "justify-start"}>
      {isAssistant ? (
        <div className="w-full">
          <div className="bg-transparent py-2 rounded-lg text-foreground text-sm wrap-break-word prose prose-sm">
            <Markdown>{content}</Markdown>
          </div>
        </div>
      ) : (
        <div className="w-fit max-w-[95%]">
          <MessageContent className="bg-neutral-100 px-3 text-black text-sm wrap-break-word whitespace-pre-0-wrap">
            {content}
          </MessageContent>
        </div>
      )}
    </Message>
  )
}
