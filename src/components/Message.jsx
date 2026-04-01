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
        <div className="w-fit max-w-[95%] sm:max-w-[90%] lg:max-w-[88%]">
          <div className="bg-secondary p-2 rounded-lg text-foreground text-sm wrap-break-word prose prose-sm">
            <Markdown>{content}</Markdown>
          </div>
        </div>
      ) : (
        <div className="w-fit max-w-[80%] sm:max-w-[70%] lg:max-w-[60%]">
          <MessageContent className="bg-primary text-primary-foreground text-sm wrap-break-word whitespace-pre-wrap">
            {content}
          </MessageContent>
        </div>
      )}
    </Message>
  )
}
