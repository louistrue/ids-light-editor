// IDS-Light Web Worker - Self-contained implementation
// This worker handles parsing, validation, and XML conversion without external dependencies

function parseYAML(yamlStr) {
  console.log("=== YAML PARSING START ===")
  console.log("Input YAML:", yamlStr)
  console.log("Input length:", yamlStr.length)

  const lines = yamlStr.split("\n")
  console.log("Total lines:", lines.length)

  const result = { ids: { ifcVersion: "IFC4", rules: [] } }
  const parseErrors = []
  const unparsedLines = []

  let currentRule = null
  let currentSection = null // properties, attributes, quantities
  let currentItem = null
  let inRulesSection = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    console.log(`Line ${i + 1}: "${line}" (trimmed: "${trimmed}")`)

    if (!trimmed || trimmed.startsWith("#")) {
      console.log("Skipping empty/comment line")
      continue
    }

    let lineParsed = false

    // Root level properties
    if (trimmed.startsWith("ids:")) {
      console.log("Found ids: marker")
      lineParsed = true
    } else if (trimmed.startsWith("title:")) {
      result.ids.title = extractValue(trimmed)
      console.log("Set title:", result.ids.title)
      lineParsed = true
    } else if (trimmed.startsWith("description:")) {
      result.ids.description = extractValue(trimmed)
      console.log("Set description:", result.ids.description)
      lineParsed = true
    } else if (trimmed.startsWith("author:")) {
      result.ids.author = extractValue(trimmed)
      console.log("Set author:", result.ids.author)
      lineParsed = true
    } else if (trimmed.startsWith("date:")) {
      result.ids.date = extractValue(trimmed)
      console.log("Set date:", result.ids.date)
      lineParsed = true
    } else if (trimmed.startsWith("ifcVersion:")) {
      result.ids.ifcVersion = extractValue(trimmed)
      console.log("Set ifcVersion:", result.ids.ifcVersion)
      lineParsed = true
    } else if (trimmed.startsWith("rules:")) {
      console.log("Entering rules section")
      inRulesSection = true
      lineParsed = true
    } else if (inRulesSection) {
      const indentLevel = line.length - line.trimStart().length

      // New rule - starts with "- " at the rules level (typically 4 spaces indentation)
      if (trimmed.startsWith("- ") && indentLevel <= 4) {
        console.log("Found new rule marker")
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
          console.log(`Set ${fieldName} for new rule:`, fieldValue)
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
          console.log(`Starting ${fieldName} section`)
          currentSection = fieldName
          currentRule[fieldName] = []
          currentItem = null
          lineParsed = true
        } else if (currentSection && currentItem) {
          console.log(`Setting ${fieldName} for current ${currentSection} item:`, fieldValue)

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
              console.log("Set allowed_values:", values)
            }
          } else {
            currentItem[fieldName] = fieldValue
          }
          lineParsed = true
        } else {
          // Regular rule field (entity, name, etc.)
          currentRule[fieldName] = fieldValue
          console.log(`Set ${fieldName} for current rule:`, fieldValue)
          lineParsed = true
        }
      }
      // Section items - start with "- " when we're in a section (typically 8+ spaces indentation)
      else if (currentSection && trimmed.startsWith("- ") && indentLevel > 4) {
        console.log(`Found new item in ${currentSection} section`)
        const afterDash = trimmed.substring(2).trim()
        if (afterDash.includes(":")) {
          const fieldName = afterDash.split(":")[0].trim()
          const fieldValue = extractValue(afterDash)
          currentItem = { [fieldName]: fieldValue }
          currentRule[currentSection].push(currentItem)
          console.log(`Created new ${currentSection} item with ${fieldName}:`, fieldValue)
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
      console.log(`WARNING: Unparsed line ${i + 1}: "${line}"`)
    }
  }

  if (unparsedLines.length > 0) {
    parseErrors.push(
      `Invalid YAML syntax. Unparsed lines: ${unparsedLines.map((l) => `Line ${l.lineNumber}: "${l.content.trim()}"`).join(", ")}`,
    )
  }

  console.log("=== YAML PARSING COMPLETE ===")
  console.log("Final parsed result:", JSON.stringify(result, null, 2))
  console.log("Parse errors:", parseErrors)

  if (parseErrors.length > 0) {
    throw new Error(parseErrors.join("; "))
  }

  return result
}

function extractValue(line) {
  const colonIndex = line.indexOf(":")
  if (colonIndex === -1) return ""

  let value = line.substring(colonIndex + 1).trim()

  // Remove inline comments (everything after #)
  const commentIndex = value.indexOf("#")
  if (commentIndex !== -1) {
    value = value.substring(0, commentIndex).trim()
  }

  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1)
  }

  return value
}

// Parse IDS-Light input (JSON or YAML)
function parseIdsLight(text) {
  const src = text?.trim() ?? ""
  if (!src) return { ids: { rules: [], ifcVersion: "IFC4" } }

  // Try JSON first
  try {
    return JSON.parse(src)
  } catch {
    // Try YAML
    try {
      return parseYAML(src)
    } catch (e) {
      throw new Error(`Parse error: ${e.message}`)
    }
  }
}

function validateIdsLight(data) {
  console.log("Validating data:", JSON.stringify(data, null, 2))

  if (!data || !data.ids) {
    return { valid: false, errors: ["Missing root 'ids' object"] }
  }

  if (!data.ids.ifcVersion) {
    return { valid: false, errors: ["Missing 'ifcVersion' field"] }
  }

  if (!["IFC2X3", "IFC4", "IFC4X3_ADD2"].includes(data.ids.ifcVersion)) {
    return { valid: false, errors: ["Invalid ifcVersion. Must be IFC2X3, IFC4, or IFC4X3_ADD2"] }
  }

  if (!Array.isArray(data.ids.rules)) {
    return { valid: false, errors: ["'rules' must be an array"] }
  }

  if (data.ids.rules.length === 0) {
    return { valid: false, errors: ["At least one rule is required"] }
  }

  const ruleNames = new Set()
  const duplicateNames = []

  for (let i = 0; i < data.ids.rules.length; i++) {
    const rule = data.ids.rules[i]
    console.log("Validating rule", i + 1, ":", JSON.stringify(rule, null, 2))

    if (!rule.entity) {
      return { valid: false, errors: [`Rule ${i + 1}: Missing 'entity' field`] }
    }
    if (typeof rule.entity !== "string" || rule.entity.length < 3) {
      return { valid: false, errors: [`Rule ${i + 1}: 'entity' must be a string with at least 3 characters`] }
    }

    if (rule.name) {
      if (ruleNames.has(rule.name)) {
        duplicateNames.push(rule.name)
      } else {
        ruleNames.add(rule.name)
      }
    }

    console.log("Checking requirements for rule", i + 1)
    console.log("rule.properties:", rule.properties)
    console.log("rule.attributes:", rule.attributes)
    console.log("rule.quantities:", rule.quantities)
    console.log("properties length:", rule.properties ? rule.properties.length : "undefined")
    console.log("attributes length:", rule.attributes ? rule.attributes.length : "undefined")
    console.log("quantities length:", rule.quantities ? rule.quantities.length : "undefined")

    const hasRequirements =
      (rule.properties && rule.properties.length > 0) ||
      (rule.attributes && rule.attributes.length > 0) ||
      (rule.quantities && rule.quantities.length > 0) ||
      (rule.requiredPartOf && rule.requiredPartOf.length > 0) ||
      (rule.requiredClassifications && rule.requiredClassifications.length > 0) ||
      (rule.requiredMaterials && rule.requiredMaterials.length > 0)

    console.log("hasRequirements:", hasRequirements)

    if (!hasRequirements) {
      return {
        valid: false,
        errors: [
          `Rule ${i + 1}: Must have at least one requirement among properties, attributes, quantities, requiredPartOf, requiredClassifications, or requiredMaterials`,
        ],
      }
    }

    if (rule.properties) {
      for (let j = 0; j < rule.properties.length; j++) {
        const prop = rule.properties[j]
        if (!prop.name) {
          return { valid: false, errors: [`Rule ${i + 1}, Property ${j + 1}: Missing 'name' field`] }
        }
        if (!prop.datatype) {
          return { valid: false, errors: [`Rule ${i + 1}, Property ${j + 1}: Missing 'datatype' field`] }
        }
        if (!prop.presence) {
          return { valid: false, errors: [`Rule ${i + 1}, Property ${j + 1}: Missing 'presence' field`] }
        }
        if (!["required", "optional", "prohibited"].includes(prop.presence)) {
          return {
            valid: false,
            errors: [`Rule ${i + 1}, Property ${j + 1}: 'presence' must be 'required', 'optional', or 'prohibited'`],
          }
        }
      }
    }

    // Minimal schema checks for new required facets
    if (rule.requiredPartOf) {
      for (let j = 0; j < rule.requiredPartOf.length; j++) {
        const rel = rule.requiredPartOf[j]
        if (!rel.entity) {
          return { valid: false, errors: [`Rule ${i + 1}, requiredPartOf ${j + 1}: Missing 'entity' field`] }
        }
      }
    }
    if (rule.requiredClassifications) {
      for (let j = 0; j < rule.requiredClassifications.length; j++) {
        const cls = rule.requiredClassifications[j]
        if (!cls.system) {
          return { valid: false, errors: [`Rule ${i + 1}, requiredClassifications ${j + 1}: Missing 'system' field`] }
        }
      }
    }
    if (rule.requiredMaterials) {
      for (let j = 0; j < rule.requiredMaterials.length; j++) {
        const mat = rule.requiredMaterials[j]
        if (!mat.value) {
          return { valid: false, errors: [`Rule ${i + 1}, requiredMaterials ${j + 1}: Missing 'value' field`] }
        }
      }
    }
  }

  if (duplicateNames.length > 0) {
    return {
      valid: false,
      errors: [`Duplicate rule names found: ${duplicateNames.join(", ")}. Each rule must have a unique name.`],
    }
  }

  console.log("Validation passed")
  return { valid: true }
}

// Convert to XML
function convertIdsLightToXml(data, opts = {}) {
  if (!data?.ids) throw new Error("Missing root ids")

  const { ids } = data
  const pretty = opts.pretty ?? true
  const indent = pretty ? "  " : ""
  const newline = pretty ? "\n" : ""

  let xml = '<?xml version="1.0" encoding="UTF-8"?>' + newline
  xml += '<ids:ids xmlns:ids="http://standards.buildingsmart.org/IDS" '
  xml += 'xmlns:xs="http://www.w3.org/2001/XMLSchema" '
  xml += 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
  xml += 'xsi:schemaLocation="http://standards.buildingsmart.org/IDS http://standards.buildingsmart.org/IDS/1.0/ids.xsd">' + newline

  // Info section
  xml += indent + "<ids:info>" + newline
  if (ids.title) xml += indent + indent + `<ids:title>${escapeXml(ids.title)}</ids:title>` + newline
  if (ids.description)
    xml += indent + indent + `<ids:description>${escapeXml(ids.description)}</ids:description>` + newline
  if (ids.author) {
    const cleanAuthor = ids.author.replace(/\s+/g, '').toLowerCase();
    const authorEmail = cleanAuthor.includes('@') ? cleanAuthor : cleanAuthor + '@ids-light.com';
    xml += indent + indent + `<ids:author>${escapeXml(authorEmail)}</ids:author>` + newline;
  }
  if (ids.date) xml += indent + indent + `<ids:date>${escapeXml(ids.date)}</ids:date>` + newline
  xml += indent + "</ids:info>" + newline

  // Specifications
  xml += indent + "<ids:specifications>" + newline
    ; (ids.rules || []).forEach((rule, index) => {
      const specName = rule.name || rule.entity
      xml +=
        indent + indent + `<ids:specification name="${escapeXml(specName)}" ifcVersion="${ids.ifcVersion}">` + newline

      // Applicability
      console.log("[WORKER] Starting applicability for rule:", rule.name)
      xml += indent + indent + indent + `<ids:applicability minOccurs="1" maxOccurs="unbounded">` + newline
      xml += indent + indent + indent + indent + "<ids:entity>" + newline
      xml +=
        indent +
        indent +
        indent +
        indent +
        indent +
        `<ids:name><ids:simpleValue>${escapeXml(rule.entity.toUpperCase())}</ids:simpleValue></ids:name>` +
        newline
      if (rule.predefinedType) {
        xml +=
          indent +
          indent +
          indent +
          indent +
          indent +
          `<ids:predefinedType><ids:simpleValue>${escapeXml(rule.predefinedType)}</ids:simpleValue></ids:predefinedType>` +
          newline
      }
      xml += indent + indent + indent + indent + "</ids:entity>" + newline

        // Applicability: partOf
        ; (rule.partOf || []).forEach((po) => {
          xml += indent + indent + indent + indent + `<ids:partOf` +
            (po.relation ? ` relation="${escapeXml(po.relation)}"` : "") +
            (po.instructions ? ` instructions="${escapeXml(po.instructions)}"` : "") +
            `>` + newline
          xml += indent + indent + indent + indent + indent + "<ids:entity>" + newline
          xml += indent + indent + indent + indent + indent + indent +
            `<ids:name><ids:simpleValue>${escapeXml(po.entity.toUpperCase())}</ids:simpleValue></ids:name>` + newline
          if (po.predefinedType) {
            xml += indent + indent + indent + indent + indent + indent +
              `<ids:predefinedType><ids:simpleValue>${escapeXml(po.predefinedType)}</ids:simpleValue></ids:predefinedType>` + newline
          }
          xml += indent + indent + indent + indent + indent + "</ids:entity>" + newline
          xml += indent + indent + indent + indent + "</ids:partOf>" + newline
        })
        // Applicability: classifications
        ; (rule.classifications || []).forEach((c) => {
          xml += indent + indent + indent + indent + `<ids:classification>` + newline
          if (c.value) {
            xml += indent + indent + indent + indent + indent + `<ids:value><ids:simpleValue>${escapeXml(c.value)}</ids:simpleValue></ids:value>` + newline
          }
          xml += indent + indent + indent + indent + indent + `<ids:system><ids:simpleValue>${escapeXml(c.system)}</ids:simpleValue></ids:system>` + newline
          xml += indent + indent + indent + indent + `</ids:classification>` + newline
        })
        // Applicability: materials
        ; (rule.materials || []).forEach((m) => {
          xml += indent + indent + indent + indent + `<ids:material>` + newline
          if (m.value) {
            xml += indent + indent + indent + indent + indent + `<ids:value><ids:simpleValue>${escapeXml(m.value)}</ids:simpleValue></ids:value>` + newline
          }
          xml += indent + indent + indent + indent + `</ids:material>` + newline
        })

      xml += indent + indent + indent + "</ids:applicability>" + newline

      // Requirements
      xml += indent + indent + indent + '<ids:requirements description="Generated from IDS-Light">' + newline

        // Required partOf
        ; (rule.requiredPartOf || []).forEach((po) => {
          xml += indent + indent + indent + indent + `<ids:partOf cardinality="required"` +
            (po.relation ? ` relation="${escapeXml(po.relation)}"` : "") +
            (po.instructions ? ` instructions="${escapeXml(po.instructions)}"` : "") +
            `>` + newline
          xml += indent + indent + indent + indent + indent + "<ids:entity>" + newline
          xml += indent + indent + indent + indent + indent + indent +
            `<ids:name><ids:simpleValue>${escapeXml(po.entity.toUpperCase())}</ids:simpleValue></ids:name>` + newline
          if (po.predefinedType) {
            xml += indent + indent + indent + indent + indent + indent +
              `<ids:predefinedType><ids:simpleValue>${escapeXml(po.predefinedType)}</ids:simpleValue></ids:predefinedType>` + newline
          }
          xml += indent + indent + indent + indent + indent + "</ids:entity>" + newline
          xml += indent + indent + indent + indent + `</ids:partOf>` + newline
        })

        // Required classifications
        ; (rule.requiredClassifications || []).forEach((c) => {
          xml += indent + indent + indent + indent + `<ids:classification cardinality="required"` +
            (c.uri ? ` uri="${escapeXml(c.uri)}"` : "") +
            (c.instructions ? ` instructions="${escapeXml(c.instructions)}"` : "") +
            `>` + newline
          xml += indent + indent + indent + indent + indent + `<ids:system><ids:simpleValue>${escapeXml(c.system)}</ids:simpleValue></ids:system>` + newline
          if (c.value) {
            xml += indent + indent + indent + indent + indent + `<ids:value><ids:simpleValue>${escapeXml(c.value)}</ids:simpleValue></ids:value>` + newline
          }
          xml += indent + indent + indent + indent + `</ids:classification>` + newline
        })

        // Required materials
        ; (rule.requiredMaterials || []).forEach((m) => {
          xml += indent + indent + indent + indent + `<ids:material cardinality="required"` +
            (m.uri ? ` uri="${escapeXml(m.uri)}"` : "") +
            (m.instructions ? ` instructions="${escapeXml(m.instructions)}"` : "") +
            `>` + newline
          if (m.value) {
            xml += indent + indent + indent + indent + indent + `<ids:value><ids:simpleValue>${escapeXml(m.value)}</ids:simpleValue></ids:value>` + newline
          }
          xml += indent + indent + indent + indent + `</ids:material>` + newline
        })

        // Attributes
        ; (rule.attributes || []).forEach((attr) => {
          const cardinality = mapPresence(attr.presence)
          xml += indent + indent + indent + indent + `<ids:attribute cardinality="${cardinality}">` + newline
          xml +=
            indent +
            indent +
            indent +
            indent +
            indent +
            `<ids:name><ids:simpleValue>${escapeXml(attr.name)}</ids:simpleValue></ids:name>` +
            newline
          xml += addValueRestrictions(attr, indent + indent + indent + indent + indent, newline)
          xml += indent + indent + indent + indent + "</ids:attribute>" + newline
        })

        // Properties
        ; (rule.properties || []).forEach((prop) => {
          const { pset, base } = splitPropertyName(prop.name)
          const ifcType = toIfcType(prop.datatype, base)
          const cardinality = mapPresence(prop.presence)
          xml +=
            indent +
            indent +
            indent +
            indent +
            `<ids:property dataType="${ifcType}" cardinality="${cardinality}">` +
            newline
          xml +=
            indent +
            indent +
            indent +
            indent +
            indent +
            `<ids:propertySet><ids:simpleValue>${escapeXml(pset)}</ids:simpleValue></ids:propertySet>` +
            newline
          xml +=
            indent +
            indent +
            indent +
            indent +
            indent +
            `<ids:baseName><ids:simpleValue>${escapeXml(base)}</ids:simpleValue></ids:baseName>` +
            newline
          xml += addValueRestrictions(prop, indent + indent + indent + indent + indent, newline)
          xml += indent + indent + indent + indent + "</ids:property>" + newline
        })

        // Quantities
        ; (rule.quantities || []).forEach((qty) => {
          const { pset, base } = splitPropertyName(qty.name)
          const ifcType = toIfcType(qty.datatype || guessMeasureFromQto(base), base)
          const cardinality = mapPresence(qty.presence)
          xml +=
            indent +
            indent +
            indent +
            indent +
            `<ids:property dataType="${ifcType}" cardinality="${cardinality}">` +
            newline
          xml +=
            indent +
            indent +
            indent +
            indent +
            indent +
            `<ids:propertySet><ids:simpleValue>${escapeXml(pset)}</ids:simpleValue></ids:propertySet>` +
            newline
          xml +=
            indent +
            indent +
            indent +
            indent +
            indent +
            `<ids:baseName><ids:simpleValue>${escapeXml(base)}</ids:simpleValue></ids:baseName>` +
            newline
          xml += addValueRestrictions(qty, indent + indent + indent + indent + indent, newline)
          xml += indent + indent + indent + indent + "</ids:property>" + newline
        })

      xml += indent + indent + indent + "</ids:requirements>" + newline
      xml += indent + indent + "</ids:specification>" + newline
    })

  xml += indent + "</ids:specifications>" + newline
  xml += "</ids:ids>"

  return xml
}

// Helper functions
function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function mapPresence(presence) {
  switch (presence) {
    case "required":
      return "required"
    case "optional":
      return "optional"
    case "prohibited":
      return "prohibited"
    default:
      return "required"
  }
}

function splitPropertyName(full) {
  const i = full.indexOf(".")
  if (i < 0) return { pset: "Pset_Common", base: full }
  return { pset: full.slice(0, i), base: full.slice(i + 1) }
}

function toIfcType(datatype, base) {
  // Handle special cases where property name implies datatype
  if (base.toLowerCase().includes("thermaltransmittance")) {
    return "IFCTHERMALTRANSMITTANCEMEASURE"
  }

  if (!datatype) return "IFCLABEL"
  switch (datatype) {
    case "string":
      return "IFCLABEL"
    case "boolean":
      return "IFCBOOLEAN"
    case "integer":
      return "IFCINTEGER"
    case "number":
      return "IFCREAL"
    case "length":
      return "IFCLENGTHMEASURE"
    case "area":
      return "IFCAREAMEASURE"
    case "volume":
      return "IFCVOLUMEMEASURE"
    case "count":
      return "IFCCOUNTMEASURE"
    case "thermaltransmittance":
      return "IFCTHERMALTRANSMITTANCEMEASURE"
    case "volumetricflowrate":
      return "IFCVOLUMETRICFLOWRATEMEASURE"
    case "power":
      return "IFCPOWERMEASURE"
    case "electricvoltage":
      return "IFCELECTRICVOLTAGEMEASURE"
    case "date":
      return "IFCDATE"
    case "datetime":
      return "IFCDATETIME"
    case "time":
      return "IFCTIME"
    default:
      return "IFCLABEL"
  }
}

function guessMeasureFromQto(base) {
  const b = base.toLowerCase()
  if (b.includes("width") || b.includes("thickness") || b.includes("length")) return "length"
  if (b.includes("area")) return "area"
  if (b.includes("volume")) return "volume"
  return "number"
}

function addValueRestrictions(prop, indent, newline) {
  if (!prop.allowed_values && !prop.pattern) return ""

  const xsBase = xsdBaseForIfc(toIfcType(prop.datatype || "string", ""))
  let xml = indent + "<ids:value>" + newline
  xml += indent + "  " + `<xs:restriction base="${xsBase}">` + newline

  if (prop.allowed_values) {
    prop.allowed_values.forEach((val) => {
      xml += indent + "    " + `<xs:enumeration value="${escapeXml(String(val))}"/>` + newline
    })
  }

  if (prop.pattern) {
    xml += indent + "    " + `<xs:pattern value="${escapeXml(prop.pattern)}"/>` + newline
  }

  xml += indent + "  " + "</xs:restriction>" + newline
  xml += indent + "</ids:value>" + newline
  return xml
}

function xsdBaseForIfc(ifc) {
  switch (ifc) {
    case "IFCBOOLEAN":
      return "xs:boolean"
    case "IFCINTEGER":
      return "xs:integer"
    case "IFCREAL":
    case "IFCLENGTHMEASURE":
    case "IFCAREAMEASURE":
    case "IFCVOLUMEMEASURE":
    case "IFCCOUNTMEASURE":
      return "xs:double"
    case "IFCDATE":
      return "xs:date"
    case "IFCDATETIME":
      return "xs:dateTime"
    case "IFCTIME":
      return "xs:time"
    default:
      return "xs:string"
  }
}

// Worker message handler
self.onmessage = (e) => {
  if (e.data?.type !== "convert") return

  try {
    console.log("Worker received conversion request")
    const data = parseIdsLight(e.data.text)
    const validation = validateIdsLight(data)

    if (!validation.valid) {
      console.log("Validation failed:", validation.errors)
      self.postMessage({ ok: false, errors: validation.errors || ["Validation failed"] })
      return
    }

    console.log("Converting to XML...")
    const xml = convertIdsLightToXml(data, { pretty: true })
    console.log("Conversion successful")
    self.postMessage({ ok: true, xml, readable: data })
  } catch (err) {
    console.log("Worker error:", err)
    self.postMessage({ ok: false, errors: [String(err?.message || err || "Unknown error")] })
  }
}
