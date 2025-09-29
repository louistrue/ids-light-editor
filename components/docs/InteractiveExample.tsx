"use client"

import { useState } from "react"
import { Play, Eye, EyeOff, Lightbulb } from "lucide-react"
import { CodeBlock } from "./CodeBlock"

interface HighlightGroup {
  lines: string[]
  color: 'blue' | 'green' | 'amber' | 'purple' | 'red' | 'teal'
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
  const [activeHighlights, setActiveHighlights] = useState<string[]>([])

  const handleHighlightToggle = (label: string) => {
    setActiveHighlights(prev =>
      prev.includes(label)
        ? prev.filter(l => l !== label)
        : [...prev, label]
    )
  }

  // Flatten all highlight lines for the CodeBlock (with backward compatibility)
  const allHighlightLines = highlights.flatMap(group => {
    // Handle both old format (string[]) and new format (HighlightGroup[])
    if (typeof group === 'string') {
      return [{ line: group, color: 'amber' as const }]
    }
    return group.lines?.map(line => ({ line, color: group.color })) || []
  })

  const colorVariants = {
    blue: {
      active: 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200 shadow-sm font-semibold',
      inactive: 'text-blue-600 dark:text-blue-400 border-blue-300/50 dark:border-blue-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20'
    },
    green: {
      active: 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600 text-green-800 dark:text-green-200 shadow-sm font-semibold',
      inactive: 'text-green-600 dark:text-green-400 border-green-300/50 dark:border-green-700/50 hover:bg-green-50 dark:hover:bg-green-900/20'
    },
    amber: {
      active: 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-200 shadow-sm font-semibold',
      inactive: 'text-amber-600 dark:text-amber-400 border-amber-300/50 dark:border-amber-700/50 hover:bg-amber-50 dark:hover:bg-amber-900/20'
    },
    purple: {
      active: 'bg-purple-100 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600 text-purple-800 dark:text-purple-200 shadow-sm font-semibold',
      inactive: 'text-purple-600 dark:text-purple-400 border-purple-300/50 dark:border-purple-700/50 hover:bg-purple-50 dark:hover:bg-purple-900/20'
    },
    red: {
      active: 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600 text-red-800 dark:text-red-200 shadow-sm font-semibold',
      inactive: 'text-red-600 dark:text-red-400 border-red-300/50 dark:border-red-700/50 hover:bg-red-50 dark:hover:bg-red-900/20'
    },
    teal: {
      active: 'bg-teal-100 dark:bg-teal-900/30 border-teal-400 dark:border-teal-600 text-teal-800 dark:text-teal-200 shadow-sm font-semibold',
      inactive: 'text-teal-600 dark:text-teal-400 border-teal-300/50 dark:border-teal-700/50 hover:bg-teal-50 dark:hover:bg-teal-900/20'
    }
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
                className={`p-2 rounded-md transition-colors ${showExplanation
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
                className={`p-2 rounded-md transition-colors ${showTips
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
              const color = highlightGroup.color
              const isActive = activeHighlights.includes(highlightGroup.label)
              return (
                <button
                  key={index}
                  onClick={() => handleHighlightToggle(highlightGroup.label)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${isActive ? colorVariants[color].active : colorVariants[color].inactive
                    }`}
                >
                  {highlightGroup.label}
                </button>
              )
            })}
            <button
              onClick={() => setActiveHighlights([])}
              className="px-3 py-1.5 text-xs rounded-full border border-border bg-background hover:bg-muted text-muted-foreground"
            >
              Clear
            </button>
          </div>

          {activeHighlights.length === 1 && (
            <div className="mt-3 p-3 rounded-lg bg-background border border-border">
              <p className="text-sm">
                {highlights.find(h => typeof h !== 'string' && h.label === activeHighlights[0])?.description}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Explanation */}
      {explanation && showExplanation && (
        <div className="border-b border-border bg-blue-50/50 dark:bg-blue-950/20 p-4">
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
        <div className="border-b border-border bg-amber-50/50 dark:bg-amber-950/20 p-4">
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

      {/* Code Block */}
      <div className="p-4">
        <CodeBlock
          code={code}
          language="yaml"
          highlight={
            highlights
              .filter((h): h is HighlightGroup => typeof h !== 'string' && activeHighlights.includes(h.label))
              .flatMap(group => group.lines.map(line => ({ line, color: group.color })))
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
