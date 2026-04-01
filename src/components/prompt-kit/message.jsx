import { Avatar, AvatarFallback, AvatarImage } from "@/components/prompt-kit/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/prompt-kit/tooltip"
import { cn } from "@/lib/utils"
import { Markdown } from "./markdown"

const Message = ({
  children,
  className,
  ...props
}) => (
  <div className={cn("flex gap-3", className)} {...props}>
    {children}
  </div>
)

const MessageAvatar = ({
  src,
  alt,
  fallback,
  delayMs,
  className
}) => {
  return (
    <Avatar className={cn("w-8 h-8 shrink-0", className)}>
      <AvatarImage src={src} alt={alt} />
      {fallback && (
        <AvatarFallback delayMs={delayMs}>{fallback}</AvatarFallback>
      )}
    </Avatar>
  );
}

const MessageContent = ({
  children,
  markdown = false,
  className,
  ...props
}) => {
  const classNames = cn(
    "bg-secondary p-2 rounded-lg text-foreground break-words whitespace-normal prose",
    className
  )

  return markdown ? (
    <Markdown className={classNames} {...props}>
      {children}
    </Markdown>
  ) : (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
}

const MessageActions = ({
  children,
  className,
  ...props
}) => (
  <div
    className={cn("flex items-center gap-2 text-muted-foreground", className)}
    {...props}>
    {children}
  </div>
)

const MessageAction = ({
  tooltip,
  children,
  className,
  side = "top",
  ...props
}) => {
  return (
    <TooltipProvider>
      <Tooltip {...props}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className={className}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export { Message, MessageAvatar, MessageContent, MessageActions, MessageAction }
