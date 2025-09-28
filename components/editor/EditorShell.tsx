"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { Loader2 } from 'lucide-react';

type ConvertStatus = "idle" | "processing" | "valid" | "invalid"

const examples = {
  basic: {
    name: "Basic Elements",
    yaml: `ids:
  title: "Basic Building Elements (IDS-Light)"
  description: "Essential requirements for doors, spaces, and walls"
  author: "IDS Editor"
  date: "2025-01-15"
  ifcVersion: "IFC4"
  rules:
    - name: "IfcDoor – FireRating required"
      entity: "IfcDoor"
      properties:
        - name: "Pset_DoorCommon.FireRating"
          datatype: "string"
          presence: "required"
    - name: "IfcSpace – Name and Area"
      entity: "IfcSpace"
      attributes:
        - name: "Name"
          datatype: "string"
          presence: "required"
      quantities:
        - name: "Qto_SpaceBaseQuantities.NetFloorArea"
          datatype: "area"
          presence: "required"
    - name: "IfcWall – Width required"
      entity: "IfcWall"
      quantities:
        - name: "Qto_WallBaseQuantities.Width"
          datatype: "length"
          presence: "required"`,
  },
  structural: {
    name: "Structural Elements",
    yaml: `ids:
  title: "Structural Elements (IDS-Light)"
  description: "Load-bearing requirements"
  author: "Structural Engineer"
  date: "2025-01-15"
  ifcVersion: "IFC4"
  rules:
    - name: "IfcWall – Load Bearing"
      entity: "IfcWall"
      properties:
        - name: "Pset_WallCommon.LoadBearing"
          datatype: "boolean"
          presence: "required"
        - name: "Pset_WallCommon.ThermalTransmittance"
          datatype: "thermaltransmittance"
          presence: "required"
    - name: "IfcColumn – Strength Class"
      entity: "IfcColumn"
      attributes:
        - name: "Name"
          datatype: "string"
          presence: "required"
      properties:
        - name: "Pset_ConcreteElementGeneral.StrengthClass"
          datatype: "string"
          presence: "required"`,
  },
  mep: {
    name: "MEP Systems",
    yaml: `ids:
  title: "MEP Systems (IDS-Light)"
  description: "HVAC and electrical requirements"
  author: "MEP Engineer"
  date: "2025-01-15"
  ifcVersion: "IFC4"
  rules:
    - name: "IfcAirTerminal – Flow Rate"
      entity: "IfcAirTerminal"
      attributes:
        - name: "Name"
          datatype: "string"
          presence: "required"
      properties:
        - name: "Pset_AirTerminalTypeCommon.NominalAirFlowRate"
          datatype: "volumetricflowrate"
          presence: "required"
    - name: "IfcElectricAppliance – Power"
      entity: "IfcElectricAppliance"
      properties:
        - name: "Pset_ElectricApplianceTypeCommon.NominalPower"
          datatype: "power"
          presence: "required"
        - name: "Pset_ElectricApplianceTypeCommon.NominalVoltage"
          datatype: "electricvoltage"
          presence: "required"`,
  },
  architectural: {
    name: "Architectural Design",
    yaml: `ids:
  title: "Architectural Elements (IDS-Light)"
  description: "Design requirements for windows and doors"
  author: "Architect"
  date: "2025-01-15"
  ifcVersion: "IFC4"
  rules:
    - name: "IfcWindow – Thermal Performance"
      entity: "IfcWindow"
      attributes:
        - name: "Name"
          datatype: "string"
          presence: "required"
      properties:
        - name: "Pset_WindowCommon.ThermalTransmittance"
          datatype: "thermaltransmittance"
          presence: "required"
      quantities:
        - name: "Qto_WindowBaseQuantities.Area"
          datatype: "area"
          presence: "required"
    - name: "IfcDoor – Security & Fire"
      entity: "IfcDoor"
      properties:
        - name: "Pset_DoorCommon.FireRating"
          datatype: "string"
          presence: "required"
        - name: "Pset_DoorCommon.SecurityRating"
          datatype: "string"
          presence: "required"`,
  },
}

export function EditorShell() {
  const [source, setSource] = useState<string>(() =>
    typeof window === "undefined"
      ? examples.basic.yaml
      : (localStorage.getItem("idsLightSource") ?? examples.basic.yaml),
  )
  const [status, setStatus] = useState<ConvertStatus>("idle")
  const [xml, setXml] = useState<string>("")
  const [readable, setReadable] = useState<any>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [outputView, setOutputView] = useState<"xml" | "readable" | "validation">("xml")
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle")
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "downloading" | "success" | "error">("idle")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showExamples, setShowExamples] = useState(false)

  const [splitRatio, setSplitRatio] = useState(50) // percentage for left panel
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const workerRef = useRef<Worker | null>(null)

  const [validationResult, setValidationResult] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidatedXml, setLastValidatedXml] = useState<string>('');

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const shouldUseDark = savedTheme === "dark" || (!savedTheme && prefersDark)

    setIsDarkMode(shouldUseDark)
    document.documentElement.classList.toggle("dark", shouldUseDark)
  }, [])

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => {
      const newDarkMode = !prev
      document.documentElement.classList.toggle("dark", newDarkMode)
      localStorage.setItem("theme", newDarkMode ? "dark" : "light")
      return newDarkMode
    })
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+C to copy XML (was Ctrl+S)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
        e.preventDefault()
        if (xml) onCopyXml()
      }

      // Ctrl+Shift+D to download (was Ctrl+D)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "D") {
        e.preventDefault()
        if (xml) onDownloadXml()
      }

      // Ctrl+Shift+H to show shortcuts (was Ctrl+/)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "H") {
        e.preventDefault()
        setShowShortcuts(!showShortcuts)
      }

      // Ctrl+Shift+T to toggle theme (was Ctrl+T)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "T") {
        e.preventDefault()
        toggleTheme()
      }

      // Ctrl+Shift+1/2 to switch output views (was Ctrl+1/2)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "!") {
        // Shift+1 = !
        e.preventDefault()
        setOutputView("xml")
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "@") {
        // Shift+2 = @
        e.preventDefault()
        setOutputView("readable")
      }

      // Escape to close shortcuts
      if (e.key === "Escape") {
        setShowShortcuts(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [xml, showShortcuts, toggleTheme]) // Added toggleTheme to dependency array

  useEffect(() => {
    console.log("[v0] Initializing worker...")
    const w = new Worker(new URL("/workers/idsWorker.js", window.location.origin))
    workerRef.current = w
    w.onmessage = (e: MessageEvent<{ ok: boolean; xml?: string; readable?: any; errors?: string[] }>) => {
      console.log("[v0] Worker response:", e.data)
      if (!e.data.ok) {
        setStatus("invalid")
        setErrors(e.data.errors ?? ["Unknown error"])
        setXml("")
        setReadable(null)
      } else {
        setStatus("valid")
        setErrors([])
        setXml(e.data.xml || "")
        setReadable(e.data.readable || null)
      }
    }
    console.log("[v0] Sending initial conversion...")
    w.postMessage({ type: "convert", text: source })
    return () => {
      w.terminate()
      workerRef.current = null
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("idsLightSource", source)
    setLastSaved(new Date())
  }, [source])

  useEffect(() => {
    setStatus((s) => (s === "idle" ? "idle" : "processing"))
    const t = setTimeout(() => {
      setStatus("processing")
      console.log("[v0] Sending conversion request...")
      workerRef.current?.postMessage({ type: "convert", text: source })
    }, 250)
    return () => clearTimeout(t)
  }, [source])

  // Auto-validate when switching to validation tab
  useEffect(() => {
    if (outputView === "validation" && xml && xml !== lastValidatedXml && !isValidating) {
      handleValidate()
    }
  }, [outputView, xml, lastValidatedXml, isValidating])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newRatio = ((e.clientX - containerRect.left) / containerRect.width) * 100

      // Constrain between 20% and 80%
      const constrainedRatio = Math.min(Math.max(newRatio, 20), 80)
      setSplitRatio(constrainedRatio)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isDragging])

  const onCopyXml = async () => {
    if (!xml) return

    try {
      await navigator.clipboard.writeText(xml)
      setCopyStatus("success")
      setTimeout(() => setCopyStatus("idle"), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
      setCopyStatus("error")
      setTimeout(() => setCopyStatus("idle"), 3000)

      try {
        const textArea = document.createElement("textarea")
        textArea.value = xml
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
        setCopyStatus("success")
        setTimeout(() => setCopyStatus("idle"), 2000)
      } catch (fallbackErr) {
        console.error("Fallback copy also failed:", fallbackErr)
      }
    }
  }

  const onDownloadXml = async () => {
    if (!xml) return

    setDownloadStatus("downloading")

    try {
      const blob = new Blob(["\ufeff" + xml], {
        type: "application/xml;charset=utf-8",
      })

      if (window.navigator && (window.navigator as any).msSaveBlob) {
        ; (window.navigator as any).msSaveBlob(blob, "output.ids")
      } else {
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "output.ids"
        link.style.display = "none"

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        setTimeout(() => URL.revokeObjectURL(url), 100)
      }

      setDownloadStatus("success")
      setTimeout(() => setDownloadStatus("idle"), 2000)
    } catch (err) {
      console.error("Download failed:", err)
      setDownloadStatus("error")
      setTimeout(() => setDownloadStatus("idle"), 3000)
    }
  }

  const handleValidate = async () => {
    if (!xml) return;
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
        setLastValidatedXml(xml); // Mark this XML as validated
      }
    } catch (err) {
      setValidationResult('Failed to connect to validation service');
    } finally {
      setIsValidating(false);
    }
  };

  const loadExample = (exampleKey: keyof typeof examples) => {
    setSource(examples[exampleKey].yaml)
    setShowExamples(false)
  }

  const getCopyButtonContent = () => {
    switch (copyStatus) {
      case "success":
        return (
          <>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Copied!
          </>
        )
      case "error":
        return (
          <>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Failed
          </>
        )
      default:
        return (
          <>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy XML
          </>
        )
    }
  }

  const getDownloadButtonContent = () => {
    switch (downloadStatus) {
      case "downloading":
        return (
          <>
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Downloading...
          </>
        )
      case "success":
        return (
          <>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Downloaded!
          </>
        )
      case "error":
        return (
          <>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Failed
          </>
        )
      default:
        return (
          <>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10,9 9,9 8,9" />
            </svg>
            Download
          </>
        )
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExamples && !(event.target as Element).closest(".relative")) {
        setShowExamples(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showExamples])

  return (
    <div className="h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <header className="px-4 py-3 border-b flex items-center justify-between bg-card border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10,9 9,9 8,9" />
            </svg>
            <span className="font-semibold tracking-tight">IDS-Light Editor</span>
          </div>
          {lastSaved && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Auto-saved {lastSaved.toLocaleTimeString()}
            </div>
          )}
          <div className="relative">
            <button
              onClick={() => setShowExamples(!showExamples)}
              className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors flex items-center gap-1"
              title="Load example templates"
            >
              Examples
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showExamples && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-md shadow-lg z-10 min-w-[200px] animate-in slide-in-from-top-2 duration-200">
                {Object.entries(examples).map(([key, example]) => (
                  <button
                    key={key}
                    onClick={() => loadExample(key as keyof typeof examples)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors first:rounded-t-md last:rounded-b-md"
                  >
                    <div className="font-medium">{example.name}</div>
                    <div className="text-muted-foreground text-[10px] mt-0.5 line-clamp-2">
                      {example.yaml
                        .split("\n")
                        .find((line) => line.includes("description:"))
                        ?.split('"')[1] || "IDS specification example"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 animate-in slide-in-from-bottom-4 duration-300">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <line x1="6" y1="10" x2="6" y2="10" />
                <line x1="10" y1="10" x2="10" y2="10" />
                <line x1="14" y1="10" x2="14" y2="10" />
                <line x1="18" y1="10" x2="18" y2="10" />
                <line x1="6" y1="14" x2="14" y2="14" />
                <line x1="18" y1="14" x2="18" y2="14" />
              </svg>
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Copy XML</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Shift+C</kbd>
              </div>
              <div className="flex justify-between">
                <span>Download</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Shift+D</kbd>
              </div>
              <div className="flex justify-between">
                <span>Toggle Theme</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Shift+T</kbd>
              </div>
              <div className="flex justify-between">
                <span>XML View</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Shift+1</kbd>
              </div>
              <div className="flex justify-between">
                <span>Structure View</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Shift+2</kbd>
              </div>
              <div className="flex justify-between">
                <span>Show Shortcuts</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Shift+H</kbd>
              </div>
            </div>
            <button
              onClick={() => setShowShortcuts(false)}
              className="mt-4 w-full px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden" ref={containerRef}>
        <div style={{ width: `${splitRatio}%` }} className="border-r border-border">
          <div className="h-full flex flex-col">
            <div className="px-4 py-2 border-b border-border bg-card">
              <div className="flex items-center justify-between min-h-[32px]">
                <span className="text-sm font-medium">Input (YAML/JSON)</span>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <textarea
                ref={textareaRef}
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full h-full p-4 font-mono text-sm resize-none border-0 outline-none bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all duration-200 scrollbar-thin"
                placeholder="Enter your IDS-Light YAML or JSON here..."
                aria-label="IDS-Light source code input"
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        <div
          className={`w-1 bg-border hover:bg-primary/30 cursor-col-resize flex items-center justify-center transition-all duration-200 ${isDragging ? "bg-primary w-2" : ""
            }`}
          onMouseDown={handleMouseDown}
          role="separator"
          aria-label="Resize panels"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") {
              setSplitRatio(Math.max(20, splitRatio - 5))
            } else if (e.key === "ArrowRight") {
              setSplitRatio(Math.min(80, splitRatio + 5))
            }
          }}
        >
          <div
            className={`w-0.5 h-8 bg-muted-foreground rounded-full transition-all duration-200 ${isDragging ? "bg-primary h-12" : ""
              }`}
          />
        </div>

        <div style={{ width: `${100 - splitRatio}%` }}>
          <div className="h-full flex flex-col">
            <div className="px-4 py-2 border-b border-border bg-card">
              <div className="flex items-center justify-between min-h-[32px]">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Output</span>
                  <div className="flex bg-muted rounded-md p-1">
                    <button
                      onClick={() => setOutputView("xml")}
                      className={`px-3 py-1 text-xs rounded transition-all duration-200 ${outputView === "xml"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                      aria-pressed={outputView === "xml"}
                    >
                      XML
                    </button>
                    <button
                      onClick={() => setOutputView("readable")}
                      className={`px-3 py-1 text-xs rounded transition-all duration-200 ${outputView === "readable"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                      aria-pressed={outputView === "readable"}
                    >
                      Structure
                    </button>
                    <button
                      onClick={() => setOutputView("validation")}
                      className={`px-3 py-1 text-xs rounded transition-all duration-200 ${outputView === "validation"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                      aria-pressed={outputView === "validation"}
                    >
                      Validation
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onCopyXml}
                    disabled={!xml || copyStatus === "success"}
                    className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5 font-medium focus:ring-2 focus:ring-primary/20 ${copyStatus === "success"
                      ? "bg-green-500 text-white"
                      : copyStatus === "error"
                        ? "bg-destructive text-destructive-foreground"
                        : downloadStatus === "downloading"
                          ? "bg-green-400 text-white cursor-wait"
                          : !xml
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80"
                      }`}
                    title="Copy XML (Ctrl+Shift+C)"
                    aria-label="Copy generated XML to clipboard"
                  >
                    {getCopyButtonContent()}
                  </button>
                  <button
                    onClick={onDownloadXml}
                    disabled={!xml || downloadStatus === "downloading" || downloadStatus === "success"}
                    className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5 font-medium focus:ring-2 focus:ring-primary/20 ${downloadStatus === "success"
                      ? "bg-green-500 text-white"
                      : downloadStatus === "error"
                        ? "bg-destructive text-destructive-foreground"
                        : downloadStatus === "downloading"
                          ? "bg-green-400 text-white cursor-wait"
                          : !xml
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : "bg-green-500 text-white hover:bg-green-600 active:bg-green-700"
                      }`}
                    title="Download XML (Ctrl+Shift+D)"
                    aria-label="Download generated XML file"
                  >
                    {getDownloadButtonContent()}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto scrollbar-thin">
              <div className="p-4">
                {errors.length > 0 && (
                  <div className="mb-4 animate-in slide-in-from-top-2 duration-300">
                    <h3 className="text-sm font-medium text-destructive mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      Validation Errors:
                    </h3>
                    <ul className="text-sm space-y-1">
                      {errors.map((error, i) => (
                        <li
                          key={i}
                          className="bg-destructive/10 text-destructive p-3 rounded-md border border-destructive/20 animate-in slide-in-from-left-2 duration-300"
                          style={{ animationDelay: `${i * 50}ms` }}
                        >
                          • {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {outputView === "xml" && xml && (
                  <div className="animate-in fade-in duration-300">
                    <h3 className="text-sm font-medium mb-2 text-foreground">Generated IDS XML:</h3>
                    <pre className="text-xs bg-muted p-4 rounded-md border border-border font-mono leading-relaxed text-foreground scrollbar-thin whitespace-pre-wrap">
                      {xml}
                    </pre>
                  </div>
                )}

                {outputView === "readable" && readable && (
                  <div className="animate-in fade-in duration-300">
                    <h3 className="text-sm font-medium mb-2 text-foreground">Parsed Structure:</h3>
                    <div className="text-xs bg-primary/5 p-4 rounded-md border border-primary/20">
                      <div className="space-y-3">
                        <div>
                          <div className="font-semibold text-primary mb-1">Document Info:</div>
                          <div className="ml-2 space-y-1">
                            <div>
                              <span className="font-medium">Title:</span> {readable.ids?.title || "Not specified"}
                            </div>
                            <div>
                              <span className="font-medium">Description:</span>{" "}
                              {readable.ids?.description || "Not specified"}
                            </div>
                            <div>
                              <span className="font-medium">Author:</span> {readable.ids?.author || "Not specified"}
                            </div>
                            <div>
                              <span className="font-medium">Date:</span> {readable.ids?.date || "Not specified"}
                            </div>
                            <div>
                              <span className="font-medium">IFC Version:</span>{" "}
                              {readable.ids?.ifcVersion || "Not specified"}
                            </div>
                          </div>
                        </div>

                        {readable.ids?.rules && readable.ids.rules.length > 0 && (
                          <div>
                            <div className="font-semibold text-primary mb-1">Rules ({readable.ids.rules.length}):</div>
                            <div className="ml-2 space-y-2">
                              {readable.ids.rules.map((rule: any, i: number) => (
                                <div
                                  key={i}
                                  className="bg-card p-3 rounded-md border border-border animate-in slide-in-from-bottom-2 duration-300"
                                  style={{ animationDelay: `${i * 100}ms` }}
                                >
                                  <div className="font-medium text-foreground">
                                    {i + 1}. {rule.name || "Unnamed Rule"}
                                  </div>
                                  <div className="text-muted-foreground text-xs mt-1">
                                    <span className="font-medium">Entity:</span> {rule.entity}
                                  </div>
                                  {rule.attributes && rule.attributes.length > 0 && (
                                    <div className="mt-1">
                                      <span className="font-medium text-xs">Attributes:</span>
                                      <ul className="ml-2 text-xs">
                                        {rule.attributes.map((attr: any, j: number) => (
                                          <li key={j}>
                                            • {attr.name} ({attr.datatype}, {attr.presence})
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {rule.properties && rule.properties.length > 0 && (
                                    <div className="mt-1">
                                      <span className="font-medium text-xs">Properties:</span>
                                      <ul className="ml-2 text-xs">
                                        {rule.properties.map((prop: any, j: number) => (
                                          <li key={j}>
                                            • {prop.name} ({prop.datatype}, {prop.presence})
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {rule.quantities && rule.quantities.length > 0 && (
                                    <div className="mt-1">
                                      <span className="font-medium text-xs">Quantities:</span>
                                      <ul className="ml-2 text-xs">
                                        {rule.quantities.map((qty: any, j: number) => (
                                          <li key={j}>
                                            • {qty.name} ({qty.datatype}, {qty.presence})
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {outputView === "validation" && (
                  <div className="animate-in fade-in duration-300">
                    <h3 className="text-sm font-medium mb-2 text-foreground">Validation Results:</h3>
                    {isValidating ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : validationResult ? (
                      <pre className="text-xs bg-muted p-4 rounded-md border border-border font-mono leading-relaxed text-foreground scrollbar-thin whitespace-pre-wrap">
                        {validationResult}
                      </pre>
                    ) : (
                      <div className="text-sm text-muted-foreground flex items-center justify-center h-32">
                        Click Validate to check XML
                      </div>
                    )}
                  </div>
                )}

                {!xml && !readable && status === "valid" && (
                  <div className="text-muted-foreground text-sm flex items-center justify-center h-32">
                    No output generated yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="px-4 py-3 border-t border-border bg-card">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>IDS-Light to IDS XML Converter</div>
          <div>Made with ❤️ by Louis Trümpler</div>
        </div>
      </footer>
    </div>
  )
}
