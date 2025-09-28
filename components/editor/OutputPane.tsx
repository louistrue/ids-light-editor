"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Copy, Download, FileWarning, Loader2 } from "lucide-react"
import { HumanReadable } from "./HumanReadable"
import { useState } from 'react';

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
  const [validationResult, setValidationResult] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleValidate = async () => {
    if (!xml || hasErrors) return;
    setIsValidating(true);
    setValidationResult(null);
    try {
      const response = await fetch('/api/validate-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xml }),
      });
      const data = await response.json();
      if (data.error) {
        setValidationResult(`Error: ${data.error}`);
      } else {
        // Parse IDS audit response for better display
        const statusMessages: { [key: number]: { text: string; color: string; icon: string } } = {
          0: { text: 'Valid IDS - No errors found', color: 'text-green-600', icon: '✅' },
          3: { text: 'Invalid Options - Configuration error', color: 'text-yellow-600', icon: '⚙️' },
          4: { text: 'Not Found - Referenced resources missing', color: 'text-orange-600', icon: '🔍' },
          5: { text: 'Structure Error - Invalid XML or missing elements', color: 'text-red-600', icon: '🏗️' },
          6: { text: 'Content Error - Violates specification rules', color: 'text-red-600', icon: '📝' },
          7: { text: 'Schema Error - Doesn\'t conform to XSD schema', color: 'text-red-600', icon: '📋' },
          8: { text: 'Unhandled Error - Unexpected validation error', color: 'text-red-600', icon: '❌' }
        };

        const statusInfo = statusMessages[data.status] || { text: `Unknown status code ${data.status}`, color: 'text-gray-600', icon: '❓' };

        let display = '';

        // Overall status
        display += `${statusInfo.icon} **${statusInfo.text}**\n\n`;

        // Parse events if available
        if (data.events && Array.isArray(data.events)) {
          const errors = data.events.filter((e: any) => e.Level === 'Error' || e.Level === 'Critical');
          const warnings = data.events.filter((e: any) => e.Level === 'Warning');
          const info = data.events.filter((e: any) => e.Level === 'Information');

          if (errors.length > 0) {
            display += `## ❌ Errors (${errors.length})\n\n`;
            errors.forEach((error: any, i: number) => {
              display += `${i + 1}. ${error.Message}\n\n`;
            });
          }

          if (warnings.length > 0) {
            display += `## ⚠️ Warnings (${warnings.length})\n\n`;
            warnings.forEach((warning: any, i: number) => {
              display += `${i + 1}. ${warning.Message}\n\n`;
            });
          }

          if (info.length > 0) {
            display += `## ℹ️ Information (${info.length})\n\n`;
            info.forEach((infoItem: any, i: number) => {
              display += `${i + 1}. ${infoItem.Message}\n\n`;
            });
          }
        } else {
          // Fallback to raw text
          display += data.text || JSON.stringify(data, null, 2);
        }

        setValidationResult(display);
      }
    } catch (err) {
      setValidationResult('Failed to connect to validation service');
    } finally {
      setIsValidating(false);
    }
  };

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
            onClick={handleValidate}
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
                <div className="text-sm font-medium mb-2">IDS Compliance Validation:</div>
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
                Click "Validate IDS" to check compliance via the API...
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
