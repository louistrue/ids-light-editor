"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type EditorPaneProps = {
  source: string
  onChange?: (v: string) => void
  status: "idle" | "valid" | "invalid" | "processing"
}

export function EditorPane({ source, onChange, status }: EditorPaneProps) {
  const getStatusVariant = () => {
    switch (status) {
      case "valid":
        return "default"
      case "invalid":
        return "destructive"
      case "processing":
        return "secondary"
      default:
        return "secondary"
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 flex items-center gap-2 border-b min-h-[52px]">
        <div className="text-sm font-medium">Source (YAML/JSON)</div>
        <Badge variant={getStatusVariant()}>{status}</Badge>
      </div>
      <Card className="m-4 h-[calc(100%-64px)] p-0 overflow-hidden">
        {/* Monaco placeholder surface; keep as plain div now */}
        <div className="h-full bg-muted/30 border-border/60 border rounded-md">
          {/* Replace with <Monaco /> later; for now allow simple textarea: */}
          <textarea
            className="w-full h-full bg-transparent p-3 outline-none resize-none text-sm font-mono leading-relaxed"
            defaultValue={source}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="Enter your IDS-Light YAML or JSON configuration here..."
          />
        </div>
      </Card>
    </div>
  )
}
