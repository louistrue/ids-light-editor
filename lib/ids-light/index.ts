import Ajv, { type ErrorObject } from "ajv"
import addFormats from "ajv-formats"
import { parseIdsLight as customParseIdsLight } from "../yaml-parser"
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
  | "thermaltransmittance"
  | "volumetricflowrate"
  | "power"
  | "electricvoltage"

export type RuleRequirement = {
  name: string // e.g. "Pset_DoorCommon.FireRating" or "Name" or "Qto_SpaceBaseQuantities.NetFloorArea"
  datatype?: SimpleDatatype // e.g. "string" | "length" | "area"
  presence?: Presence // default = "required"
  allowed_values?: (string | number | boolean)[]
  pattern?: string
  uri?: string // optional bSDD/URI
  instructions?: string // optional author instructions
}

export type PartOfFacet = {
  entity: string // IFC entity name (e.g., "IFCBUILDING", "IFCSPACE")
  predefinedType?: string // optional predefined type
  relation?: "IFCRELAGGREGATES" | "IFCRELASSIGNSTOGROUP" | "IFCRELCONTAINEDINSPATIALSTRUCTURE" | "IFCRELNESTS" | "IFCRELVOIDSELEMENT IFCRELFILLSELEMENT"
  instructions?: string // optional author instructions
}

export type ClassificationFacet = {
  system: string // classification system (e.g., "eBKP", "Uniclass", "OmniClass")
  value?: string // optional classification value/code
  uri?: string // optional URI reference
  instructions?: string // optional author instructions
}

export type MaterialFacet = {
  value?: string // optional material specification
  uri?: string // optional URI reference
  instructions?: string // optional author instructions
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

  // Applicability facets (what elements this rule applies to)
  partOf?: PartOfFacet[]
  classifications?: ClassificationFacet[]
  materials?: MaterialFacet[]

  // Requirement facets (what requirements apply to matching elements)
  attributes?: RuleRequirement[]
  properties?: RuleRequirement[]
  quantities?: RuleRequirement[]
  requiredPartOf?: PartOfFacet[]
  requiredClassifications?: ClassificationFacet[]
  requiredMaterials?: MaterialFacet[]

  // Legacy classification field for backward compatibility
  classification?: Classification
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
  $schema: "http://json-schema.org/draft-07/schema#",
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

              // Applicability facets
              partOf: { $ref: "#/definitions/partOfList" },
              classifications: { $ref: "#/definitions/classificationList" },
              materials: { $ref: "#/definitions/materialList" },

              // Requirements facets
              attributes: { $ref: "#/definitions/reqList" },
              properties: { $ref: "#/definitions/reqList" },
              quantities: { $ref: "#/definitions/reqList" },
              requiredPartOf: { $ref: "#/definitions/partOfList" },
              requiredClassifications: { $ref: "#/definitions/classificationList" },
              requiredMaterials: { $ref: "#/definitions/materialList" },

              // Legacy classification field for backward compatibility
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
            },
            additionalProperties: false,
          },
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
  definitions: {
    reqList: {
      type: "array",
      minItems: 1,
      items: { $ref: "#/definitions/reqItem" },
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
            "thermaltransmittance",
            "volumetricflowrate",
            "power",
            "electricvoltage",
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
        instructions: { type: "string" },
      },
      additionalProperties: false,
    },
    partOfFacet: {
      type: "object",
      required: ["entity"],
      properties: {
        entity: { type: "string", minLength: 3 },
        predefinedType: { type: "string" },
        relation: {
          enum: [
            "IFCRELAGGREGATES",
            "IFCRELASSIGNSTOGROUP",
            "IFCRELCONTAINEDINSPATIALSTRUCTURE",
            "IFCRELNESTS",
            "IFCRELVOIDSELEMENT IFCRELFILLSELEMENT"
          ]
        },
        instructions: { type: "string" },
      },
      additionalProperties: false,
    },
    classificationFacet: {
      type: "object",
      required: ["system"],
      properties: {
        system: { type: "string" },
        value: { type: "string" },
        uri: { type: "string", format: "uri" },
        instructions: { type: "string" },
      },
      additionalProperties: false,
    },
    materialFacet: {
      type: "object",
      properties: {
        value: { type: "string" },
        uri: { type: "string", format: "uri" },
        instructions: { type: "string" },
      },
      additionalProperties: false,
    },
    partOfList: {
      type: "array",
      minItems: 1,
      items: { $ref: "#/definitions/partOfFacet" },
    },
    classificationList: {
      type: "array",
      minItems: 1,
      items: { $ref: "#/definitions/classificationFacet" },
    },
    materialList: {
      type: "array",
      minItems: 1,
      items: { $ref: "#/definitions/materialFacet" },
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
  return customParseIdsLight(text) as IdsLight
}

export function validateIdsLight(data: unknown): { valid: boolean; errors?: string[] } {
  const ok = validateFn(data)
  if (ok) return { valid: true }
  const errs = (validateFn.errors || []).map(prettyAjvError)
  return { valid: false, errors: errs }
}

function prettyAjvError(e: ErrorObject): string {
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
    "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    "xsi:schemaLocation": "http://standards.buildingsmart.org/IDS http://standards.buildingsmart.org/IDS/1.0/ids.xsd",
  })

  // info
  const info = root.ele("ids:info")
  if (data.ids.title) info.ele("ids:title").txt(data.ids.title)
  if (data.ids.description) info.ele("ids:description").txt(data.ids.description)
  if (data.ids.author) {
    const cleanAuthor = data.ids.author.replace(/\s+/g, '').toLowerCase();
    const authorEmail = cleanAuthor.includes('@') ? cleanAuthor : `${cleanAuthor}@ids-light.com`;
    info.ele("ids:author").txt(authorEmail);
  }
  if (data.ids.date) info.ele("ids:date").txt(data.ids.date)

  const specs = root.ele("ids:specifications")

  for (const rule of data.ids.rules || []) {
    const spec = specs.ele("ids:specification", {
      name: rule.name ?? rule.entity,
      ifcVersion: data.ids.ifcVersion,
    })

    // ---- Applicability
    const appl = spec.ele("ids:applicability", { minOccurs: "1", maxOccurs: "unbounded" })
    const ent = appl.ele("ids:entity")
    idsSimple(ent, "ids:name", rule.entity.toUpperCase())
    if (rule.predefinedType) idsSimple(ent, "ids:predefinedType", rule.predefinedType)

    // Add partOf relationships
    for (const partOf of rule.partOf || []) {
      const partOfNode = appl.ele("ids:partOf")
      if (partOf.relation) partOfNode.att("relation", partOf.relation)
      if (partOf.instructions) partOfNode.att("instructions", partOf.instructions)

      const partOfEntity = partOfNode.ele("ids:entity")
      idsSimple(partOfEntity, "ids:name", partOf.entity.toUpperCase())
      if (partOf.predefinedType) idsSimple(partOfEntity, "ids:predefinedType", partOf.predefinedType)
    }

    // Add classification constraints
    for (const classification of rule.classifications || []) {
      const classNode = appl.ele("ids:classification")
      idsSimple(classNode, "ids:system", classification.system)
      if (classification.value) idsSimple(classNode, "ids:value", classification.value)
    }

    // Add material constraints
    for (const material of rule.materials || []) {
      const matNode = appl.ele("ids:material")
      if (material.value) idsSimple(matNode, "ids:value", material.value)
    }

    // ---- Requirements
    const reqs = spec.ele("ids:requirements", { description: "Generated from IDS-Light" })

    // Required partOf relationships
    for (const partOf of rule.requiredPartOf || []) {
      const partOfNode = reqs.ele("ids:partOf", {
        cardinality: "required",
      })
      if (partOf.relation) partOfNode.att("relation", partOf.relation)
      if (partOf.instructions) partOfNode.att("instructions", partOf.instructions)

      const partOfEntity = partOfNode.ele("ids:entity")
      idsSimple(partOfEntity, "ids:name", partOf.entity.toUpperCase())
      if (partOf.predefinedType) idsSimple(partOfEntity, "ids:predefinedType", partOf.predefinedType)
    }

    // Required classifications
    for (const classification of rule.requiredClassifications || []) {
      const classNode = reqs.ele("ids:classification", {
        cardinality: "required",
      })
      if (classification.uri) classNode.att("uri", classification.uri)
      if (classification.instructions) classNode.att("instructions", classification.instructions)

      idsSimple(classNode, "ids:system", classification.system)
      if (classification.value) idsSimple(classNode, "ids:value", classification.value)
    }

    // Required materials
    for (const material of rule.requiredMaterials || []) {
      const matNode = reqs.ele("ids:material", {
        cardinality: "required",
      })
      if (material.uri) matNode.att("uri", material.uri)
      if (material.instructions) matNode.att("instructions", material.instructions)

      if (material.value) idsSimple(matNode, "ids:value", material.value)
    }

    // Attributes
    for (const a of rule.attributes || []) {
      const node = reqs.ele("ids:attribute", {
        cardinality: presenceToCard(a.presence),
      })
      if (a.instructions) node.att("instructions", a.instructions)
      idsSimple(node, "ids:name", a.name)
      facetValue(node, a.datatype, a.allowed_values, a.pattern)
    }

    // Properties
    for (const p of rule.properties || []) {
      const { pset, base } = splitPropertyName(p.name)
      const ifcType = toIfcType(p.datatype, base)
      const node = reqs.ele("ids:property", {
        dataType: ifcType,
        cardinality: presenceToCard(p.presence),
      })
      if (p.uri) node.att("uri", p.uri)
      if (p.instructions) node.att("instructions", p.instructions)
      idsSimple(node, "ids:propertySet", pset)
      idsSimple(node, "ids:baseName", base)
      facetValue(node, p.datatype, p.allowed_values, p.pattern)
    }

    // Quantities (treated as properties with Qto_* Pset)
    for (const q of rule.quantities || []) {
      const { pset, base } = splitPropertyName(q.name)
      const ifcType = toIfcType(q.datatype ?? guessMeasureFromQto(base), base)
      const node = reqs.ele("ids:property", {
        dataType: ifcType,
        cardinality: presenceToCard(q.presence),
      })
      if (q.uri) node.att("uri", q.uri)
      if (q.instructions) node.att("instructions", q.instructions)
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
function toIfcType(datatype: SimpleDatatype | undefined, base: string): string {
  if (!datatype) return "IFCLABEL"
  switch (datatype) {
    case "string":
      // Special cases for specific properties
      if (base.toLowerCase().includes("thermaltransmittance")) return "IFCTHERMALTRANSMITTANCEMEASURE"
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
