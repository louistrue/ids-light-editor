// Custom YAML parser for IDS-Light
// This parser is specifically designed for the IDS-Light YAML format
// and handles all the facets including the new ones (partOf, classifications, materials)

export interface ParseResult {
    ids: {
        title?: string
        description?: string
        author?: string
        date?: string
        ifcVersion: "IFC2X3" | "IFC4" | "IFC4X3_ADD2"
        rules: any[]
    }
}

export function parseYAML(yamlStr: string, enableLogging = false): ParseResult {
    const log = enableLogging ? console.log : () => { }

    log("[v0] === YAML PARSING START ===")
    log("[v0] Input YAML:", yamlStr)
    log("[v0] Input length:", yamlStr.length)

    const lines = yamlStr.split("\n")
    log("[v0] Total lines:", lines.length)

    const result: ParseResult = { ids: { ifcVersion: "IFC4", rules: [] } }
    const parseErrors: string[] = []
    const unparsedLines: Array<{ lineNumber: number; content: string }> = []

    let currentRule: any = null
    let currentSection: string | null = null // properties, attributes, quantities, etc.
    let currentItem: any = null
    let inRulesSection = false

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trim()

        log(`[v0] Line ${i + 1}: "${line}" (trimmed: "${trimmed}")`)

        if (!trimmed || trimmed.startsWith("#")) {
            log("[v0] Skipping empty/comment line")
            continue
        }

        let lineParsed = false

        // Root level properties
        if (trimmed.startsWith("ids:")) {
            log("[v0] Found ids: marker")
            lineParsed = true
        } else if (trimmed.startsWith("title:")) {
            result.ids.title = extractValue(trimmed)
            log("[v0] Set title:", result.ids.title)
            lineParsed = true
        } else if (trimmed.startsWith("description:")) {
            result.ids.description = extractValue(trimmed)
            log("[v0] Set description:", result.ids.description)
            lineParsed = true
        } else if (trimmed.startsWith("author:")) {
            result.ids.author = extractValue(trimmed)
            log("[v0] Set author:", result.ids.author)
            lineParsed = true
        } else if (trimmed.startsWith("date:")) {
            result.ids.date = extractValue(trimmed)
            log("[v0] Set date:", result.ids.date)
            lineParsed = true
        } else if (trimmed.startsWith("ifcVersion:")) {
            result.ids.ifcVersion = extractValue(trimmed) as any
            log("[v0] Set ifcVersion:", result.ids.ifcVersion)
            lineParsed = true
        } else if (trimmed.startsWith("rules:")) {
            log("[v0] Entering rules section")
            inRulesSection = true
            lineParsed = true
        } else if (inRulesSection) {
            const indentLevel = line.length - line.trimStart().length

            // New rule - starts with "- " at the rules level (typically 4 spaces indentation)
            if (trimmed.startsWith("- ") && indentLevel <= 4) {
                log("[v0] Found new rule marker")
                currentRule = {}
                result.ids.rules.push(currentRule)
                currentSection = null // Reset section when starting new rule
                currentItem = null

                // Check if this line also contains a field (like "- name: value")
                const afterDash = trimmed.substring(2).trim()
                if (afterDash.includes(":")) {
                    const fieldName = afterDash.split(":")[0].trim()
                    const fieldValue = extractValue(afterDash)
                    currentRule[fieldName] = fieldValue
                    log(`[v0] Set ${fieldName} for new rule:`, fieldValue)
                }
                lineParsed = true
            }
            // Rule-level fields or section headers
            else if (currentRule && trimmed.includes(":") && !trimmed.startsWith("- ")) {
                const fieldName = trimmed.split(":")[0].trim()
                const fieldValue = extractValue(trimmed)

                // Check if this is a section (properties, attributes, quantities, or new facets)
                if (fieldName === "attributes" || fieldName === "properties" || fieldName === "quantities" ||
                    fieldName === "requiredPartOf" || fieldName === "partOf" || fieldName === "classifications" ||
                    fieldName === "materials" || fieldName === "requiredClassifications" || fieldName === "requiredMaterials") {
                    log(`[v0] Starting ${fieldName} section`)
                    currentSection = fieldName
                    currentRule[fieldName] = []
                    currentItem = null
                    lineParsed = true
                } else if (currentSection && currentItem) {
                    log(`[v0] Setting ${fieldName} for current ${currentSection} item:`, fieldValue)

                    if (fieldName === "allowed_values") {
                        // Parse array values
                        if (fieldValue.startsWith("[") && fieldValue.endsWith("]")) {
                            const values = fieldValue
                                .slice(1, -1)
                                .split(",")
                                .map((v) => {
                                    const trimmedV = v.trim()
                                    if (trimmedV.startsWith('"') && trimmedV.endsWith('"')) {
                                        return trimmedV.slice(1, -1)
                                    }
                                    return trimmedV
                                })
                            currentItem.allowed_values = values
                            log("[v0] Set allowed_values:", values)
                        }
                    } else {
                        currentItem[fieldName] = fieldValue
                    }
                    lineParsed = true
                } else {
                    // Regular rule field (entity, name, etc.)
                    currentRule[fieldName] = fieldValue
                    log(`[v0] Set ${fieldName} for current rule:`, fieldValue)
                    lineParsed = true
                }
            }
            // Section items - start with "- " when we're in a section (typically 8+ spaces indentation)
            else if (currentSection && trimmed.startsWith("- ") && indentLevel > 4) {
                log(`[v0] Found new item in ${currentSection} section`)
                const afterDash = trimmed.substring(2).trim()
                if (afterDash.includes(":")) {
                    const fieldName = afterDash.split(":")[0].trim()
                    const fieldValue = extractValue(afterDash)
                    currentItem = { [fieldName]: fieldValue }
                    currentRule[currentSection].push(currentItem)
                    log(`[v0] Created new ${currentSection} item with ${fieldName}:`, fieldValue)
                    lineParsed = true
                } else {
                    // Item without immediate field, just create empty item
                    currentItem = {}
                    currentRule[currentSection].push(currentItem)
                    lineParsed = true
                }
            }
        }

        if (!lineParsed) {
            unparsedLines.push({ lineNumber: i + 1, content: line })
            log(`[v0] WARNING: Unparsed line ${i + 1}: "${line}"`)
        }
    }

    if (unparsedLines.length > 0) {
        parseErrors.push(
            `Invalid YAML syntax. Unparsed lines: ${unparsedLines.map((l) => `Line ${l.lineNumber}: "${l.content.trim()}"`).join(", ")}`,
        )
    }

    log("[v0] === YAML PARSING COMPLETE ===")
    log("[v0] Final parsed result:", JSON.stringify(result, null, 2))
    log("[v0] Parse errors:", parseErrors)

    if (parseErrors.length > 0) {
        throw new Error(parseErrors.join("; "))
    }

    return result
}

function extractValue(line: string): string {
    const colonIndex = line.indexOf(":")
    if (colonIndex === -1) return ""

    let value = line.substring(colonIndex + 1).trim()

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
    }

    return value
}

// Parse IDS-Light input (JSON or YAML)
export function parseIdsLight(text: string): ParseResult {
    const src = text?.trim() ?? ""
    if (!src) return { ids: { rules: [], ifcVersion: "IFC4" } }

    // Try JSON first
    try {
        return JSON.parse(src)
    } catch {
        // Try YAML
        try {
            return parseYAML(src)
        } catch (e: any) {
            throw new Error(`Parse error: ${e.message}`)
        }
    }
}
