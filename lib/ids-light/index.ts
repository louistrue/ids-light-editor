import YAML from "yaml"
import Ajv, { type DefinedError } from "ajv"
import addFormats from "ajv-formats"
import { create } from "xmlbuilder2"

export type Presence = "required" | "optional" | "prohibited"
export type SimpleDatatype =
  | "string"
  | "boolean"
  | "integer"
  | "number"
  | "length"
  | "area"
  | "volume"
  | "count"
  | "date"
  | "datetime"
  | "time"

export type RuleRequirement = {
  name: string // e.g. "Pset_DoorCommon.FireRating" or "Name" or "Qto_SpaceBaseQuantities.NetFloorArea"
  datatype?: SimpleDatatype // e.g. "string" | "length" | "area"
  presence?: Presence // default = "required"
  allowed_values?: (string | number | boolean)[]
  pattern?: string
  uri?: string // optional bSDD/URI
}

export type Classification = {
  system: string // e.g. "eBKP" | "Uniclass" | "OmniClass"
  value?: string
  uri?: string
}

export type Rule = {
  name?: string
  entity: string // e.g. "IfcDoor"
  predefinedType?: string // e.g. "DOOR"
  classification?: Classification
  attributes?: RuleRequirement[]
  properties?: RuleRequirement[]
  quantities?: RuleRequirement[]
}

export type IdsLight = {
  ids: {
    title?: string
    description?: string
    author?: string
    date?: string // ISO date string
    ifcVersion: "IFC2X3" | "IFC4" | "IFC4X3_ADD2"
    rules: Rule[]
  }
}

// ---------------------------
// JSON Schema (kept compact)
// ---------------------------
export const IDS_LIGHT_JSON_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "ids-light.schema.json",
  type: "object",
  required: ["ids"],
  properties: {
    ids: {
      type: "object",
      required: ["rules", "ifcVersion"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        author: { type: "string" },
        date: { type: "string", format: "date" },
        ifcVersion: { enum: ["IFC2X3", "IFC4", "IFC4X3_ADD2"] },
        rules: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["entity"],
            properties: {
              name: { type: "string" },
              entity: { type: "string", minLength: 3 },
              predefinedType: { type: "string" },
              classification: {
                type: "object",
                required: ["system"],
                properties: {
                  system: { type: "string" },
                  value: { type: "string" },
                  uri: { type: "string", format: "uri" },
                },
                additionalProperties: false,
              },
              attributes: { $ref: "#/$defs/reqList" },
              properties: { $ref: "#/$defs/reqList" },
              quantities: { $ref: "#/$defs/reqList" },
            },
            additionalProperties: false,
          },
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
  $defs: {
    reqList: {
      type: "array",
      minItems: 1,
      items: { $ref: "#/$defs/reqItem" },
    },
    reqItem: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string", minLength: 1 },
        datatype: {
          enum: [
            "string",
            "boolean",
            "integer",
            "number",
            "length",
            "area",
            "volume",
            "count",
            "date",
            "datetime",
            "time",
          ],
        },
        presence: { enum: ["required", "optional", "prohibited"] },
        allowed_values: {
          type: "array",
          minItems: 1,
          items: { anyOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }] },
        },
        pattern: { type: "string" },
        uri: { type: "string", format: "uri" },
      },
      additionalProperties: false,
    },
  },
} as const

// ---------------------------
// Public API
// ---------------------------
const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)
const validateFn = ajv.compile(IDS_LIGHT_JSON_SCHEMA)

export function parseIdsLight(text: string): IdsLight {
  const src = text?.trim() ?? ""
  if (!src) return { ids: { rules: [], ifcVersion: "IFC4" } } as any

  // Try JSON first, then YAML
  try {
    return JSON.parse(src)
  } catch {}
  try {
    return YAML.parse(src)
  } catch (e: any) {
    const msg = e?.message ? String(e.message) : "YAML parse error"
    throw new Error(msg)
  }
}

export function validateIdsLight(data: unknown): { valid: boolean; errors?: string[] } {
  const ok = validateFn(data)
  if (ok) return { valid: true }
  const errs = (validateFn.errors || []).map(prettyAjvError)
  return { valid: false, errors: errs }
}

function prettyAjvError(e: DefinedError): string {
  const path = e.instancePath || "(root)"
  return `${path} ${e.message ?? ""}`.trim()
}

// ---------------------------
// Conversion to IDS 1.0 XML
// ---------------------------
type ConvertOptions = { pretty?: boolean }

export function convertIdsLightToXml(data: IdsLight, opts: ConvertOptions = {}): string {
  if (!data?.ids) throw new Error("Missing root ids")

  const root = create({ version: "1.0", encoding: "UTF-8" }).ele("ids:ids", {
    "xmlns:ids": "http://standards.buildingsmart.org/IDS",
    "xmlns:xs": "http://www.w3.org/2001/XMLSchema",
  })

  // info
  const info = root.ele("ids:info")
  if (data.ids.title) info.ele("ids:title").txt(data.ids.title)
  if (data.ids.description) info.ele("ids:description").txt(data.ids.description)
  if (data.ids.author) info.ele("ids:author").txt(data.ids.author)
  if (data.ids.date) info.ele("ids:date").txt(data.ids.date)

  const specs = root.ele("ids:specifications")

  for (const rule of data.ids.rules || []) {
    const spec = specs.ele("ids:specification", {
      name: rule.name ?? rule.entity,
      ifcVersion: data.ids.ifcVersion,
    })

    // ---- Applicability
    const appl = spec.ele("ids:applicability")
    const ent = appl.ele("ids:entity")
    idsSimple(ent, "ids:name", rule.entity)
    if (rule.predefinedType) idsSimple(ent, "ids:predefinedType", rule.predefinedType)

    if (rule.classification) {
      const cls = appl.ele("ids:classification")
      if (rule.classification.value) idsSimple(cls, "ids:value", rule.classification.value)
      idsSimple(cls, "ids:system", rule.classification.system)
    }

    // ---- Requirements
    const reqs = spec.ele("ids:requirements", { description: "Generated from IDS-Light" })

    // Attributes
    for (const a of rule.attributes || []) {
      const node = reqs.ele("ids:attribute", {
        cardinality: presenceToCard(a.presence),
      })
      idsSimple(node, "ids:name", a.name)
      facetValue(node, a.datatype, a.allowed_values, a.pattern)
    }

    // Properties
    for (const p of rule.properties || []) {
      const { pset, base } = splitPropertyName(p.name)
      const ifcType = toIfcType(p.datatype, pset)
      const node = reqs.ele("ids:property", {
        dataType: ifcType,
        cardinality: presenceToCard(p.presence),
      })
      idsSimple(node, "ids:propertySet", pset)
      idsSimple(node, "ids:baseName", base)
      facetValue(node, p.datatype, p.allowed_values, p.pattern)
    }

    // Quantities (treated as properties with Qto_* Pset)
    for (const q of rule.quantities || []) {
      const { pset, base } = splitPropertyName(q.name)
      const ifcType = toIfcType(q.datatype ?? guessMeasureFromQto(base), pset)
      const node = reqs.ele("ids:property", {
        dataType: ifcType,
        cardinality: presenceToCard(q.presence),
      })
      idsSimple(node, "ids:propertySet", pset)
      idsSimple(node, "ids:baseName", base)
      facetValue(node, q.datatype ?? guessMeasureFromQto(base), q.allowed_values, q.pattern)
    }
  }

  return root.end({ prettyPrint: opts.pretty ?? true })
}

// ------------- helpers -------------
function idsSimple(parent: any, tag: string, text: string) {
  parent.ele(tag).ele("ids:simpleValue").txt(text)
}

function presenceToCard(p?: Presence): "required" | "optional" | "prohibited" {
  return (p ?? "required") as any
}

function splitPropertyName(full: string): { pset: string; base: string } {
  const i = full.indexOf(".")
  if (i < 0) return { pset: "Pset_Common", base: full } // fallback for loose inputs
  return { pset: full.slice(0, i), base: full.slice(i + 1) }
}

// Map simple datatypes → IFC defined types
function toIfcType(datatype: SimpleDatatype | undefined, pset: string): string {
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
    case "date":
      return "IFCDATE"
    case "datetime":
      return "IFCDATETIME"
    case "time":
      return "IFCTIME"
  }
  return "IFCLABEL"
}

// Guess measure datatype from common Qto names if not provided
function guessMeasureFromQto(base: string): SimpleDatatype {
  const b = base.toLowerCase()
  if (b.includes("width") || b.includes("thickness") || b.includes("length")) return "length"
  if (b.includes("area")) return "area"
  if (b.includes("volume")) return "volume"
  return "number"
}

// Build <ids:value> facet with xs:restriction + enumerations/pattern
function facetValue(
  node: any,
  dt: SimpleDatatype | undefined,
  allowed: (string | number | boolean)[] | undefined,
  pattern?: string,
) {
  if (!allowed && !pattern) return
  const xsBase = xsdBaseForIfc(toIfcType(dt ?? "string", ""))
  const v = node.ele("ids:value")
  const r = v.ele("xs:restriction", { base: xsBase })
  if (allowed) for (const val of allowed) r.ele("xs:enumeration", { value: String(val) })
  if (pattern) r.ele("xs:pattern", { value: pattern })
}

function xsdBaseForIfc(ifc: string): string {
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
