"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { Loader2, Github } from 'lucide-react';
import { EditorPane } from "./EditorPane";
import { XmlViewer } from "./XmlViewer";

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
    - name: "IfcDoor - In Wall with FireRating"
      entity: "IfcDoor"
      requiredPartOf: # Requirement: must be contained in a wall
        - entity: "IfcWall"
      properties:
        - name: "Pset_DoorCommon.FireRating"
          datatype: "string"
          presence: "required"
    - name: "IfcSpace - Name and Area"
      entity: "IfcSpace"
      attributes:
        - name: "Name"
          datatype: "string"
          presence: "required"
      quantities:
        - name: "Qto_SpaceBaseQuantities.NetFloorArea"
          datatype: "area"
          presence: "required"
    - name: "IfcWall - Width required"
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
    - name: "IfcWall - Load Bearing"
      entity: "IfcWall"
      properties:
        - name: "Pset_WallCommon.LoadBearing"
          datatype: "boolean"
          presence: "required"
        - name: "Pset_WallCommon.ThermalTransmittance"
          datatype: "number"
          presence: "required"
    - name: "IfcColumn - Strength Class"
      entity: "IfcColumn"
      requiredMaterials: # Requirement: must be concrete
        - value: "Concrete"
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
    - name: "IfcAirTerminal - In Spaces"
      entity: "IfcAirTerminal"
      partOf: # Applicability: only terminals inside an IfcSpace
        - entity: "IfcSpace"
      attributes:
        - name: "Name"
          datatype: "string"
          presence: "required"
      properties:
        - name: "Pset_AirTerminalTypeCommon.DischargeDirection"
          datatype: "string"
          presence: "required"
          allowed_values: ["HORIZONTAL", "VERTICAL", "ADJUSTABLE"]
          instructions: "Air discharge direction specification"
        - name: "Pset_AirTerminalTypeCommon.FlowControlType"
          datatype: "string"
          presence: "required"
          instructions: "Flow control mechanism type"
    - name: "IfcElectricAppliance - Status Tracking"
      entity: "IfcElectricAppliance"
      attributes:
        - name: "Name"
          datatype: "string"
          presence: "required"
      properties:
        - name: "Pset_ElectricApplianceTypeCommon.Status"
          datatype: "string"
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
    - name: "IfcWindow - Thermal Performance"
      entity: "IfcWindow"
      attributes:
        - name: "Name"
          datatype: "string"
          presence: "required"
      properties:
        - name: "Pset_WindowCommon.ThermalTransmittance"
          datatype: "number"
          presence: "required"
      quantities:
        - name: "Qto_WindowBaseQuantities.Area"
          datatype: "area"
          presence: "required"
    - name: "IfcDoor - Security & Fire (Internal)"
      entity: "IfcDoor"
      classifications: # Applicability: only internal doors
        - system: "Uniclass"
          value: "EF_25_30_40_40" # Internal doorsets
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
  const [xml, setXml] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('idsLightXml') ?? '';
  });
  const [readable, setReadable] = useState<any>(() => {
    if (typeof window === 'undefined') return null;
    const stored = sessionStorage.getItem('idsLightReadable');
    try {
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error("Failed to parse readable from sessionStorage", e);
      return null;
    }
  });
  const [errors, setErrors] = useState<string[]>([])
  const [outputView, setOutputView] = useState<"xml" | "readable" | "validation">("xml")
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle")
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "downloading" | "success" | "error">("idle")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showExamples, setShowExamples] = useState(false)
  const [hydrated, setHydrated] = useState(false);

  const [splitRatio, setSplitRatio] = useState(50) // percentage for left panel
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const workerRef = useRef<Worker | null>(null)

  const [validationResult, setValidationResult] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidatedXml, setLastValidatedXml] = useState<string>('');

  useEffect(() => {
    setHydrated(true);
  }, []);

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
    console.log("Initializing worker...")
    const w = new Worker(new URL("/workers/idsWorker.js", window.location.origin))
    workerRef.current = w

    w.onmessage = (e: MessageEvent<{ ok: boolean; xml?: string; readable?: any; errors?: string[] }>) => {
      console.log("Worker response:", e.data)
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

    return () => {
      if (workerRef.current) {
        console.log("Terminating worker...")
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, []) // Empty dependency array ensures this runs only on mount and unmount

  useEffect(() => {
    // This effect handles the initial conversion and any subsequent changes to the source.
    if (hydrated && source && workerRef.current) {
      setStatus((s) => (s === "idle" ? "idle" : "processing"))
      const t = setTimeout(() => {
        setStatus("processing")
        console.log("Sending conversion request...")
        workerRef.current?.postMessage({ type: "convert", text: source })
      }, 250)
      return () => clearTimeout(t)
    }
  }, [source, hydrated]) // It runs whenever the source code changes.

  useEffect(() => {
    localStorage.setItem("idsLightSource", source)
    setLastSaved(new Date())
  }, [source])

  useEffect(() => {
    if (xml) {
      sessionStorage.setItem("idsLightXml", xml)
    } else {
      sessionStorage.removeItem("idsLightXml")
    }
    if (readable) {
      sessionStorage.setItem("idsLightReadable", JSON.stringify(readable))
    } else {
      sessionStorage.removeItem("idsLightReadable")
    }
  }, [xml, readable])

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
        <div className="flex items-center gap-4">
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
          <a
            href="/docs"
            className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors flex items-center gap-1.5"
            title="View documentation"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Docs
          </a>
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
          <EditorPane
            source={source}
            onChange={setSource}
            status={status}
          />
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
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-all duration-200 ${outputView === "xml"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 shadow-sm"
                        : "text-muted-foreground hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                        }`}
                      aria-pressed={outputView === "xml"}
                    >
                      XML
                    </button>
                    <button
                      onClick={() => setOutputView("readable")}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-all duration-200 ${outputView === "readable"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 shadow-sm"
                        : "text-muted-foreground hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20 dark:hover:text-green-300"
                        }`}
                      aria-pressed={outputView === "readable"}
                    >
                      Structure
                    </button>
                    <button
                      onClick={() => setOutputView("validation")}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-all duration-200 ${outputView === "validation"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 shadow-sm"
                        : "text-muted-foreground hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-900/20 dark:hover:text-amber-300"
                        }`}
                      aria-pressed={outputView === "validation"}
                    >
                      Validation
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto scrollbar-thin">
              <div className="p-4">
                {!hydrated && (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}

                {hydrated && errors.length > 0 && (
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

                {hydrated && outputView === "xml" && (
                  <div className="animate-in fade-in duration-300 -m-4 h-[calc(100vh-200px)]">
                    <XmlViewer
                      xml={xml}
                      onCopy={onCopyXml}
                      onDownload={onDownloadXml}
                      copyStatus={copyStatus}
                      downloadStatus={downloadStatus}
                    />
                  </div>
                )}

                {hydrated && outputView === "readable" && readable && (
                  <div className="animate-in fade-in duration-300 h-full flex flex-col">
                    <h3 className="text-sm font-medium mb-4 text-foreground flex items-center gap-2 flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Parsed Structure
                    </h3>
                    <div className="space-y-4 flex-1 overflow-auto scrollbar-thin pr-2">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Document Info
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-purple-600 dark:text-purple-400 min-w-0 flex-shrink-0">Title:</span>
                            <span className="text-gray-800 dark:text-gray-200 font-medium">{readable.ids?.title || "Not specified"}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-purple-600 dark:text-purple-400 min-w-0 flex-shrink-0">Author:</span>
                            <span className="text-gray-800 dark:text-gray-200">{readable.ids?.author || "Not specified"}</span>
                          </div>
                          <div className="flex items-start gap-2 md:col-span-2">
                            <span className="font-medium text-purple-600 dark:text-purple-400 min-w-0 flex-shrink-0">Description:</span>
                            <span className="text-gray-800 dark:text-gray-200">{readable.ids?.description || "Not specified"}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-purple-600 dark:text-purple-400 min-w-0 flex-shrink-0">Date:</span>
                            <span className="text-gray-800 dark:text-gray-200">{readable.ids?.date || "Not specified"}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-purple-600 dark:text-purple-400 min-w-0 flex-shrink-0">IFC Version:</span>
                            <span className="text-orange-600 dark:text-orange-400 font-medium">{readable.ids?.ifcVersion || "Not specified"}</span>
                          </div>
                        </div>
                      </div>

                      {readable.ids?.rules && readable.ids.rules.length > 0 && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="font-semibold text-green-700 dark:text-green-300 mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Rules ({readable.ids.rules.length})
                          </div>
                          <div className="space-y-4">
                            {readable.ids.rules.map((rule: any, i: number) => (
                              <div
                                key={i}
                                className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm animate-in slide-in-from-bottom-2 duration-300"
                                style={{ animationDelay: `${i * 100}ms` }}
                              >
                                <div className="flex items-start gap-3 mb-3">
                                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">
                                    {i + 1}
                                  </span>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                      {rule.name || "Unnamed Rule"}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Entity:</span>
                                      <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full font-medium">
                                        {rule.entity}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  {rule.requiredPartOf && rule.requiredPartOf.length > 0 && (
                                    <div>
                                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mb-2">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                        </svg>
                                        Required Part Of:
                                      </span>
                                      <div className="flex flex-wrap gap-1">
                                        {rule.requiredPartOf.map((part: any, j: number) => (
                                          <span key={j} className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-md">
                                            {part.entity}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {rule.requiredMaterials && rule.requiredMaterials.length > 0 && (
                                    <div>
                                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-2">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                        </svg>
                                        Required Materials:
                                      </span>
                                      <div className="flex flex-wrap gap-1">
                                        {rule.requiredMaterials.map((mat: any, j: number) => (
                                          <span key={j} className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-md">
                                            {mat.value}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {rule.partOf && rule.partOf.length > 0 && (
                                    <div>
                                      <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 mb-2">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                        </svg>
                                        Part Of:
                                      </span>
                                      <div className="flex flex-wrap gap-1">
                                        {rule.partOf.map((part: any, j: number) => (
                                          <span key={j} className="text-xs bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 px-2 py-1 rounded-md">
                                            {part.entity}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {rule.classifications && rule.classifications.length > 0 && (
                                    <div>
                                      <span className="text-xs font-semibold text-pink-600 dark:text-pink-400 flex items-center gap-1 mb-2">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        Classifications:
                                      </span>
                                      <div className="space-y-1">
                                        {rule.classifications.map((classif: any, j: number) => (
                                          <div key={j} className="text-xs bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 px-2 py-1 rounded-md">
                                            <span className="font-medium text-pink-700 dark:text-pink-300">{classif.system}:</span>
                                            <span className="text-pink-600 dark:text-pink-400 ml-1">{classif.value}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {rule.attributes && rule.attributes.length > 0 && (
                                    <div>
                                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-2">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Attributes:
                                      </span>
                                      <div className="space-y-1">
                                        {rule.attributes.map((attr: any, j: number) => (
                                          <div key={j} className="text-xs bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-2 py-1 rounded-md flex items-center justify-between">
                                            <span className="font-medium text-emerald-700 dark:text-emerald-300">{attr.name}</span>
                                            <div className="flex gap-1">
                                              <span className="bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 px-1 py-0.5 rounded text-xs">{attr.datatype}</span>
                                              <span className="bg-emerald-300 dark:bg-emerald-700 text-emerald-900 dark:text-emerald-100 px-1 py-0.5 rounded text-xs">{attr.presence}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {rule.properties && rule.properties.length > 0 && (
                                    <div>
                                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 mb-2">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Properties:
                                      </span>
                                      <div className="space-y-1">
                                        {rule.properties.map((prop: any, j: number) => (
                                          <div key={j} className="text-xs bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-2 py-1 rounded-md flex items-center justify-between">
                                            <span className="font-medium text-blue-700 dark:text-blue-300">{prop.name}</span>
                                            <div className="flex gap-1">
                                              <span className="bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded text-xs">{prop.datatype}</span>
                                              <span className="bg-blue-300 dark:bg-blue-700 text-blue-900 dark:text-blue-100 px-1 py-0.5 rounded text-xs">{prop.presence}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {rule.quantities && rule.quantities.length > 0 && (
                                    <div>
                                      <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1 mb-2">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        Quantities:
                                      </span>
                                      <div className="space-y-1">
                                        {rule.quantities.map((qty: any, j: number) => (
                                          <div key={j} className="text-xs bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 px-2 py-1 rounded-md flex items-center justify-between">
                                            <span className="font-medium text-violet-700 dark:text-violet-300">{qty.name}</span>
                                            <div className="flex gap-1">
                                              <span className="bg-violet-200 dark:bg-violet-800 text-violet-800 dark:text-violet-200 px-1 py-0.5 rounded text-xs">{qty.datatype}</span>
                                              <span className="bg-violet-300 dark:bg-violet-700 text-violet-900 dark:text-violet-100 px-1 py-0.5 rounded text-xs">{qty.presence}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {hydrated && outputView === "validation" && (
                  <div className="animate-in fade-in duration-300 h-full flex flex-col">
                    <h3 className="text-sm font-medium mb-2 text-foreground flex-shrink-0">Validation Results:</h3>
                    <div className="flex-1 overflow-auto scrollbar-thin">
                      {isValidating ? (
                        <div className="flex items-center justify-center h-32">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : validationResult ? (
                        <pre className="text-xs bg-muted p-4 rounded-md border border-border font-mono leading-relaxed text-foreground scrollbar-thin whitespace-pre overflow-auto max-w-full">
                          {validationResult}
                        </pre>
                      ) : (
                        <div className="text-sm text-muted-foreground flex items-center justify-center h-32">
                          Open this tab to run validation. Results will appear here.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {hydrated && !xml && !readable && status === "valid" && (
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
          <div className="flex items-center gap-4">
            <span>IDS-Light to IDS XML Converter</span>
            <a
              href="https://github.com/louistrue/ids-light-editor"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground"
            >
              <Github className="w-4 h-4" />
              Source
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://www.gnu.org/licenses/agpl-3.0.en.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              AGPL-3.0
            </a>
            <span>
              Made with ❤️ by{" "}
              <a
                href="https://www.lt.plus"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                Louis Trümpler
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
