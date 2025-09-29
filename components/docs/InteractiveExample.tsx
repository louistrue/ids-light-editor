"use client"

import { useState } from "react"
import { Play, Eye, EyeOff, Lightbulb } from "lucide-react"
import { CodeBlock } from "./CodeBlock"

interface HighlightGroup {
  lines: string[]
  color: 'blue' | 'green' | 'amber' | 'purple' | 'red'
  label: string
  description: string
}

interface InteractiveExampleProps {
  title: string
  description: string
  code: string
  explanation?: string
  highlights?: (HighlightGroup | string)[] // Support both old and new format
  tips?: string[]
}

export function InteractiveExample({ 
  title, 
  description, 
  code, 
  explanation,
  highlights = [],
  tips = []
}: InteractiveExampleProps) {
  const [showExplanation, setShowExplanation] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null)

  // Flatten all highlight lines for the CodeBlock (with backward compatibility)
  const allHighlightLines = highlights.flatMap(group => {
    // Handle both old format (string[]) and new format (HighlightGroup[])
    if (typeof group === 'string') {
      return [{ line: group, color: 'amber' as const }]
    }
    return group.lines?.map(line => ({ line, color: group.color })) || []
  })

  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700',
    green: 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700', 
    amber: 'bg-amber-100 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700',
    purple: 'bg-purple-100 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700',
    red: 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700'
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          
          <div className="flex gap-2">
            {explanation && (
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className={`p-2 rounded-md transition-colors ${
                  showExplanation 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-background hover:bg-accent'
                }`}
                title="Toggle explanation"
              >
                {showExplanation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
            
            {tips.length > 0 && (
              <button
                onClick={() => setShowTips(!showTips)}
                className={`p-2 rounded-md transition-colors ${
                  showTips 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-background hover:bg-accent'
                }`}
                title="Toggle tips"
              >
                <Lightbulb className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Highlights */}
      {highlights.length > 0 && (
        <div className="border-b border-border bg-muted/20 p-4">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Interactive Highlights</h4>
          <div className="flex flex-wrap gap-2">
            {highlights.filter(group => typeof group !== 'string').map((group, index) => {
              const highlightGroup = group as HighlightGroup
              return (
                <button
                  key={index}
                  onClick={() => setActiveHighlight(activeHighlight === highlightGroup.label ? null : highlightGroup.label)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                    activeHighlight === highlightGroup.label 
                      ? colorClasses[highlightGroup.color] + ' shadow-sm'
                      : 'bg-background hover:bg-muted border-border'
                  }`}
                >
                  {highlightGroup.label}
                </button>
              )
            })}
            <button
              onClick={() => setActiveHighlight(null)}
              className="px-3 py-1.5 text-xs rounded-full border border-border bg-background hover:bg-muted text-muted-foreground"
            >
              Clear
            </button>
          </div>
          
          {activeHighlight && (
            <div className="mt-3 p-3 rounded-lg bg-background border border-border">
              <p className="text-sm">
                {highlights.find(h => typeof h !== 'string' && h.label === activeHighlight)?.description}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Code Block */}
      <div className="p-4">
        <CodeBlock 
          code={code} 
          language="yaml" 
          highlight={activeHighlight ? 
            (() => {
              const group = highlights.find(h => typeof h !== 'string' && h.label === activeHighlight) as HighlightGroup | undefined
              return group?.lines.map(line => ({ line, color: group.color })) || []
            })() :
            []
          }
          showCopy={true}
        />
      </div>

      {/* Explanation */}
      {explanation && showExplanation && (
        <div className="border-t border-border bg-blue-50/50 dark:bg-blue-950/20 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">How it works</h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">{explanation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      {tips.length > 0 && showTips && (
        <div className="border-t border-border bg-amber-50/50 dark:bg-amber-950/20 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-amber-900 dark:text-amber-100">Pro Tips</h4>
              <ul className="space-y-1">
                {tips.map((tip, index) => (
                  <li key={index} className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
