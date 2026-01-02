import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, Clock, AlertCircle } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  variant?: "default" | "outline";
}

const statusConfig: Record<string, { color: string; icon: typeof Check; label: string }> = {
  lead: { color: "bg-info/10 text-info border-info/20", icon: Clock, label: "Lead" },
  prospect: { color: "bg-warning/10 text-warning border-warning/20", icon: Clock, label: "Prospect" },
  customer: { color: "bg-success/10 text-success border-success/20", icon: Check, label: "Customer" },
  inactive: { color: "bg-muted text-muted-foreground border-border", icon: AlertCircle, label: "Inactive" },
  pending: { color: "bg-warning/10 text-warning border-warning/20", icon: Clock, label: "Pending" },
  completed: { color: "bg-success/10 text-success border-success/20", icon: Check, label: "Completed" },
  overdue: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle, label: "Overdue" },
  low: { color: "bg-muted text-muted-foreground border-border", icon: Clock, label: "Low" },
  medium: { color: "bg-warning/10 text-warning border-warning/20", icon: Clock, label: "Medium" },
  high: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle, label: "High" },
};

export const StatusBadge = ({ status, variant = "default" }: StatusBadgeProps) => {
  const config = statusConfig[status] || statusConfig.lead;
  const Icon = config.icon;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200",
        variant === "outline" ? "border" : "",
        config.color
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </motion.span>
  );
};
