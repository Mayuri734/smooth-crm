import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  content: string;
  isOutgoing: boolean;
  timestamp: string;
  status?: "sent" | "delivered" | "read" | "failed";
  delay?: number;
}

export const ChatBubble = ({ content, isOutgoing, timestamp, status, delay = 0 }: ChatBubbleProps) => {
  const statusIcons = {
    sent: "✓",
    delivered: "✓✓",
    read: "✓✓",
    failed: "!",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className={cn("flex", isOutgoing ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "relative max-w-[70%] px-4 py-2 rounded-2xl",
          isOutgoing
            ? "bg-chat-sent text-chat-sent-foreground rounded-br-md"
            : "bg-chat-received text-chat-received-foreground rounded-bl-md"
        )}
      >
        <p className="text-sm leading-relaxed">{content}</p>
        <div
          className={cn(
            "flex items-center gap-1 mt-1",
            isOutgoing ? "justify-end" : "justify-start"
          )}
        >
          <span className="text-[10px] opacity-70">{timestamp}</span>
          {isOutgoing && status && (
            <span
              className={cn(
                "text-[10px]",
                status === "read" ? "text-info" : "opacity-70",
                status === "failed" && "text-destructive"
              )}
            >
              {statusIcons[status]}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
