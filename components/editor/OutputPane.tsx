"use client"

import { useIdsValidation } from "@/hooks/use-ids-validation"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Copy, Download, FileWarning, Loader2 } from "lucide-react"
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
  const hasErrors = (errors?.length ?? 0) > 0;
  const { validationResult, isValidating, validate: handleValidate } = useIdsValidation(hasErrors ? undefined : xml);



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
          <Button
            size="sm"
            disabled={hasErrors || !xml || isValidating}
            onClick={() => handleValidate()}
            className="h-6 text-xs"
          >
            {isValidating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null} Validate IDS
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
            <TabsTrigger value="validation">Validation</TabsTrigger>
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
        <TabsContent value="validation" className="flex-1">
          <ScrollArea className="h-[calc(100vh-220px)] px-4 py-3">
            {isValidating ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : validationResult ? (
              <div className="prose prose-sm max-w-none">
                <div className="text-sm font-medium mb-2">IDS Document Audit:</div>
                <div className="bg-muted p-4 rounded-md whitespace-pre-line">
                  {validationResult.split('\n').map((line, i) => {
                    if (line.startsWith('✅') || line.startsWith('⚙️') || line.startsWith('🔍') || line.startsWith('🏗️') || line.startsWith('📝') || line.startsWith('📋') || line.startsWith('❌')) {
                      return <div key={i} className="font-semibold text-lg mb-2">{line}</div>;
                    }
                    if (line.startsWith('## ')) {
                      const isError = line.includes('❌');
                      const isWarning = line.includes('⚠️');
                      const className = isError ? 'text-red-600 font-medium' : isWarning ? 'text-yellow-600 font-medium' : 'text-blue-600 font-medium';
                      return <div key={i} className={`${className} mt-3 mb-1`}>{line.replace('## ', '')}</div>;
                    }
                    return <div key={i}>{line}</div>;
                  })}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                Click "Validate IDS" to audit the IDS document...
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
