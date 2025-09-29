"use client"

import { useState, useEffect } from "react"
import { Copy, Check } from "lucide-react"
// Using built-in syntax highlighting instead of external component

interface HighlightLine {
  line: string
  color: 'blue' | 'green' | 'amber' | 'purple' | 'red' | 'teal'
}

interface CodeBlockProps {
  code: string
  language?: string
  title?: string
  showCopy?: boolean
  highlight?: HighlightLine[]
}

export function CodeBlock({ code, language = "yaml", title, showCopy = true, highlight = [] }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  // Enhanced syntax highlighting for YAML
  const highlightYaml = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        const lineNumber = index + 1
        const isHighlighted = highlight.some(h => h.line === lineNumber.toString())

        // Parse YAML line into segments
        const segments: Array<{ text: string; className?: string }> = []
        let remainingLine = line
        let currentIndex = 0

        // Helper function to add a segment
        const addSegment = (text: string, className?: string) => {
          if (text) {
            segments.push({ text, className })
          }
        }

        // Process the line character by character to build segments
        const processLine = (line: string) => {
          // Check for comment
          const commentMatch = line.match(/(.*?)(#.*)$/)
          if (commentMatch) {
            processNonComment(commentMatch[1])
            addSegment(commentMatch[2], 'text-green-600 dark:text-green-400 italic')
            return
          }

          processNonComment(line)
        }

        const processNonComment = (line: string) => {
          // Check for key: value pattern
          const keyMatch = line.match(/^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:(.*)$/)
          if (keyMatch) {
            addSegment(keyMatch[1]) // indentation
            addSegment(keyMatch[2], 'text-blue-600 dark:text-blue-400 font-medium') // key
            addSegment(':')
            processValue(keyMatch[3])
            return
          }

          // Check for array item
          const arrayMatch = line.match(/^(\s*)-(\s.*)$/)
          if (arrayMatch) {
            addSegment(arrayMatch[1]) // indentation
            addSegment('-', 'text-purple-600 dark:text-purple-400')
            processValue(arrayMatch[2])
            return
          }

          // No special pattern, process as value
          processValue(line)
        }

        const processValue = (value: string) => {
          let remaining = value

          // Process quoted strings
          const quotedStringRegex = /"([^"]*)"/g
          let lastIndex = 0
          let match

          while ((match = quotedStringRegex.exec(value)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
              const beforeText = value.substring(lastIndex, match.index)
              processSpecialValues(beforeText)
            }

            // Add the quoted string
            addSegment(`"${match[1]}"`, 'text-amber-600 dark:text-amber-400')
            lastIndex = match.index + match[0].length
          }

          // Add remaining text after last match
          if (lastIndex < value.length) {
            const remainingText = value.substring(lastIndex)
            processSpecialValues(remainingText)
          }
        }

        const processSpecialValues = (text: string) => {
          const specialRegex = /\b(Ifc[A-Z][a-zA-Z]*|IFCREL[A-Z]+|required|optional|prohibited|IFC[0-9X_]+)\b/g
          let lastIndex = 0
          let match

          while ((match = specialRegex.exec(text)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
              addSegment(text.substring(lastIndex, match.index))
            }

            // Add the special value
            addSegment(match[0], 'text-indigo-600 dark:text-indigo-400 font-medium')
            lastIndex = match.index + match[0].length
          }

          // Add remaining text
          if (lastIndex < text.length) {
            addSegment(text.substring(lastIndex))
          }
        }

        processLine(line)

        // Find highlight info for this line
        const highlightInfo = highlight.find(h => h.line === lineNumber.toString())
        const highlightColorClasses = {
          blue: 'bg-blue-100 dark:bg-blue-900/20 border-l-2 border-blue-400',
          green: 'bg-green-100 dark:bg-green-900/20 border-l-2 border-green-400',
          amber: 'bg-amber-100 dark:bg-amber-900/20 border-l-2 border-amber-400',
          purple: 'bg-purple-100 dark:bg-purple-900/20 border-l-2 border-purple-400',
          red: 'bg-red-100 dark:bg-red-900/20 border-l-2 border-red-400',
          teal: 'bg-teal-100 dark:bg-teal-900/20 border-l-2 border-teal-400'
        }

        return (
          <div
            key={index}
            className={`flex h-[1.5em] ${highlightInfo
              ? `${highlightColorClasses[highlightInfo.color]} -mx-2 px-2 py-0.5`
              : 'bg-transparent'
              }`}
          >
            <span className="text-gray-400 text-xs mr-3 select-none w-6 text-right flex-shrink-0">
              {lineNumber}
            </span>
            <span className="flex-1 min-w-0 h-[1.5em] flex items-center">
              {segments.map((segment, segIndex) => (
                <span
                  key={segIndex}
                  className={segment.className || ''}
                >
                  {segment.text}
                </span>
              ))}
            </span>
          </div>
        )
      })
  }

  return (
    <div className="relative group">
      {title && (
        <div className="flex items-center justify-between bg-muted/50 px-4 py-2 border-b border-border rounded-t-lg">
          <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">{language}</span>
        </div>
      )}

      <div className="relative bg-muted/30 rounded-lg overflow-hidden">
        {showCopy && (
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 p-2 bg-background/80 hover:bg-background border border-border rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
            title="Copy code"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-600" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        )}

        <div className="relative">
          {/* Highlight overlay for specific lines */}
          {highlight.length > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="p-4 text-xs leading-normal">
                {code.split('\n').map((line, index) => {
                  const lineNumber = index + 1
                  const highlightInfo = highlight.find(h => h.line === lineNumber.toString())
                  const highlightColorClasses = {
                    blue: 'bg-blue-100 dark:bg-blue-900/20 border-l-2 border-blue-400',
                    green: 'bg-green-100 dark:bg-green-900/20 border-l-2 border-green-400',
                    amber: 'bg-amber-100 dark:bg-amber-900/20 border-l-2 border-amber-400',
                    purple: 'bg-purple-100 dark:bg-purple-900/20 border-l-2 border-purple-400',
                    red: 'bg-red-100 dark:bg-red-900/20 border-l-2 border-red-400',
                    teal: 'bg-teal-100 dark:bg-teal-900/20 border-l-2 border-teal-400'
                  }
                  return (
                    <div
                      key={index}
                      className={`flex h-[1.5em] ${highlightInfo
                        ? `${highlightColorClasses[highlightInfo.color]} -mx-2 px-2`
                        : 'bg-transparent'
                        }`}
                    >
                      <span className="w-6 mr-3 flex-shrink-0"></span>
                      <span className="flex-1 min-w-0"></span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Syntax highlighted code */}
          <div className="relative z-10">
            <pre className="p-4 text-xs leading-relaxed overflow-x-auto scrollbar-thin">
              <code className="block">
                <div className="leading-normal">
                  {isClient && language === 'yaml' ? highlightYaml(code) : (
                    code.split('\n').map((line, index) => (
                      <div key={index} className="flex h-[1.5em]">
                        <span className="text-gray-400 text-xs mr-3 select-none w-6 text-right flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="flex-1 min-w-0 h-[1.5em] flex items-center">
                          {line}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
