"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Copy, Download, FileWarning } from "lucide-react"
import { HumanReadable } from "./HumanReadable"

type OutputPaneProps = {
  status: "idle" | "valid" | "invalid" | "processing"
  xml?: string
  readable?: any
  errors?: string[]
  onCopyXml?: () => void
  onDownloadXml?: () => void
}

export function OutputPane({ status, xml, readable, errors, onCopyXml, onDownloadXml }: OutputPaneProps) {
  const hasErrors = (errors?.length ?? 0) > 0

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b flex items-center justify-between min-h-[52px]">
        <div className="text-sm font-medium">Output</div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={hasErrors || !xml}
            onClick={onCopyXml}
            className="h-6 text-xs bg-transparent"
          >
            <Copy className="h-3 w-3 mr-1" /> Copy XML
          </Button>
          <Button size="sm" disabled={hasErrors || !xml} onClick={onDownloadXml} className="h-6 text-xs">
            <Download className="h-3 w-3 mr-1" /> Download .ids
          </Button>
        </div>
      </div>

      {hasErrors && (
        <div className="p-4">
          <Alert variant="destructive">
            <FileWarning className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Schema-/Parsingfehler. Bitte Eingabe prüfen.
              <ul className="list-disc ml-5 mt-2 space-y-1">
                {errors?.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <Tabs defaultValue="xml" className="flex-1 flex flex-col">
        <div className="px-4">
          <TabsList>
            <TabsTrigger value="xml">XML (.ids)</TabsTrigger>
            <TabsTrigger value="readable">Human‑readable</TabsTrigger>
          </TabsList>
        </div>
        <Separator />
        <TabsContent value="xml" className="flex-1">
          <ScrollArea className="h-[calc(100vh-220px)] px-4 py-3">
            <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
              {xml || (
                <span className="text-muted-foreground italic">
                  XML output will appear here after processing valid input...
                </span>
              )}
            </pre>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="readable" className="flex-1">
          <ScrollArea className="h-[calc(100vh-220px)] px-4 py-3">
            {!readable ? (
              <div className="text-sm text-muted-foreground italic">
                Human-readable summary will appear here after processing...
              </div>
            ) : (
              <HumanReadable data={readable} />
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
