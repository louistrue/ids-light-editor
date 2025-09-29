"use client"

import { useState, ReactNode, useId } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

interface ProgressiveDisclosureProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  level?: 1 | 2 | 3
}

export function ProgressiveDisclosure({
  title,
  children,
  defaultOpen = false,
  level = 1
}: ProgressiveDisclosureProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const panelId = useId()
  const buttonId = useId()

  const levelStyles = {
    1: "text-lg font-semibold",
    2: "text-base font-medium",
    3: "text-sm font-medium"
  }

  return (
    <div className="space-y-3">
      <button
        id={buttonId}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 w-full text-left hover:text-primary transition-colors ${levelStyles[level]}`}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
        )}
        {title}
      </button>

      {isOpen && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={buttonId}
          className="ml-6 animate-in slide-in-from-top-2 duration-200"
        >
          {children}
        </div>
      )}
    </div>
  )
}

