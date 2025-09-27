"use client"

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { EditorPane } from "./EditorPane"
import { OutputPane } from "./OutputPane"
import { ThemeToggle } from "@/components/theme-toggle"
import { Github, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

type ConvertStatus = "idle" | "valid" | "invalid" | "processing"

type ShellProps = {
  source: string
  status: ConvertStatus
  errors?: string[]
  xml?: string
  readable?: any
  onSourceChange?: (v: string) => void
  onCopyXml?: () => void
  onDownloadXml?: () => void
}

export function EditorShell(props: ShellProps) {
  return (
    <div className="h-dvh flex flex-col">
      <header className="px-4 py-3 border-b flex items-center justify-between">
        <div className="font-semibold tracking-tight">IDS-Light Editor</div>
        <ThemeToggle />
      </header>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={50} minSize={35}>
          <EditorPane source={props.source} onChange={props.onSourceChange} status={props.status} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} minSize={35}>
          <OutputPane
            status={props.status}
            xml={props.xml}
            readable={props.readable}
            errors={props.errors}
            onCopyXml={props.onCopyXml}
            onDownloadXml={props.onDownloadXml}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      <footer className="px-4 py-3 border-t bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" asChild>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <Github className="h-3 w-3" />
                GitHub
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </Button>
            <span>Made by Louis Trümpler</span>
          </div>

          <div className="flex items-center">
            <span>© 2025 AGPL-3.0 License</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
