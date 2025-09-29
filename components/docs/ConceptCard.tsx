"use client"

import { ReactNode } from "react"
import { LucideIcon } from "lucide-react"

interface ConceptCardProps {
  icon: LucideIcon
  title: string
  description: string
  children: ReactNode
  variant?: "default" | "primary" | "success" | "warning" | "danger"
}

const variantStyles = {
  default: {
    container: "bg-card border-border",
    header: "bg-muted/30",
    icon: "bg-muted text-muted-foreground",
    title: "text-foreground"
  },
  primary: {
    container: "bg-card border-primary/20",
    header: "bg-primary/5",
    icon: "bg-primary/10 text-primary",
    title: "text-foreground"
  },
  success: {
    container: "bg-card border-green-200 dark:border-green-800",
    header: "bg-green-50/50 dark:bg-green-950/20",
    icon: "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400",
    title: "text-green-900 dark:text-green-100"
  },
  warning: {
    container: "bg-card border-amber-200 dark:border-amber-800",
    header: "bg-amber-50/50 dark:bg-amber-950/20",
    icon: "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400",
    title: "text-amber-900 dark:text-amber-100"
  },
  danger: {
    container: "bg-card border-red-200 dark:border-red-800",
    header: "bg-red-50/50 dark:bg-red-950/20",
    icon: "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400",
    title: "text-red-900 dark:text-red-100"
  }
}

export function ConceptCard({ 
  icon: Icon, 
  title, 
  description, 
  children, 
  variant = "default" 
}: ConceptCardProps) {
  const styles = variantStyles[variant]

  return (
    <div className={`rounded-lg border overflow-hidden ${styles.container}`}>
      {/* Header */}
      <div className={`p-4 border-b border-border ${styles.header}`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${styles.icon}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className={`font-semibold ${styles.title}`}>{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

