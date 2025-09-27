# IDS-Light Converter Implementation Guide

Perfect — here's everything your dev needs to **wire the converter** into the existing Next.js/shadcn UI. It's copy-paste ready and keeps all heavy work in a **Web Worker**. The logic matches the Week-3 tasks (Doors/Spaces/Walls) and the follow-up coding labs, so students can round-trip their IDS-Light YAML to official IDS 1.0 XML and back to a human-readable view.

---

## 1) Install deps

\`\`\`bash
npm i yaml ajv ajv-formats xmlbuilder2
\`\`\`

*(Monaco is optional; the worker/logic works fine with your current textarea editor.)*

---

## 2) Create the converter module

> **Path:** `lib/ids-light/index.ts` (exports parse → validate → convert)
> **Also contains:** JSON Schema + small helpers (datatype map, value facets, etc.)

\`\`\`ts
// lib/ids-light/index.ts
import YAML from "yaml";
import Ajv, { DefinedError } from "ajv";
import addFormats from "ajv-formats";
import { create } from "xmlbuilder2";

export type Presence = "required" | "optional" | "prohibited";
export type Datatype = "string" | "boolean" | "integer" | "number" | "length" | "area" | "volume" | "count" | "date" | "datetime" | "time";

export interface IdsLightProperty {
  name: string;
  datatype?: Datatype;
  presence?: Presence;
  allowed_values?: string[];
  pattern?: string;
}

export interface IdsLightRule {
  name?: string;
  entity: string;
  attributes?: IdsLightProperty[];
  properties?: IdsLightProperty[];
  quantities?: IdsLightProperty[];
}

export interface IdsLight {
  ids: {
    title?: string;
    description?: string;
    author?: string;
    date?: string;
    ifcVersion: "IFC2X3" | "IFC4" | "IFC4X3";
    rules: IdsLightRule[];
  };
}

// JSON Schema for validation
export const IDS_LIGHT_JSON_SCHEMA = {
  type: "object",
  properties: {
    ids: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        author: { type: "string" },
        date: { type: "string" },
        ifcVersion: { type: "string", enum: ["IFC2X3", "IFC4", "IFC4X3"] },
        rules: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              entity: { type: "string" },
              attributes: { type: "array", items: { $ref: "#/$defs/property" } },
              properties: { type: "array", items: { $ref: "#/$defs/property" } },
              quantities: { type: "array", items: { $ref: "#/$defs/property" } }
            },
            required: ["entity"],
            additionalProperties: false
          }
        }
      },
      required: ["ifcVersion", "rules"],
      additionalProperties: false
    }
  },
  required: ["ids"],
  additionalProperties: false,
  $defs: {
    property: {
      type: "object",
      properties: {
        name: { type: "string" },
        datatype: { type: "string", enum: ["string", "boolean", "integer", "number", "length", "area", "volume", "count", "date", "datetime", "time"] },
        presence: { type: "string", enum: ["required", "optional", "prohibited"] },
        allowed_values: { type: "array", items: { type: "string" } },
        pattern: { type: "string" }
      },
      required: ["name"],
      additionalProperties: false
    }
  }
};

// Parse YAML or JSON input
export function parseIdsLight(input: string): IdsLight {
  if (!input.trim()) {
    return { ids: { ifcVersion: "IFC4", rules: [] } };
  }
  
  try {
    return JSON.parse(input);
  } catch {
    return YAML.parse(input);
  }
}

// Validate against JSON Schema
export function validateIdsLight(data: any): { valid: boolean; errors?: string[] } {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  
  const validate = ajv.compile(IDS_LIGHT_JSON_SCHEMA);
  const valid = validate(data);
  
  if (!valid && validate.errors) {
    const errors = validate.errors.map((err: DefinedError) => 
      `${err.instancePath || 'root'}: ${err.message}`
    );
    return { valid: false, errors };
  }
  
  return { valid: true };
}

// Convert to IDS XML
export function convertIdsLightToXml(data: IdsLight): string {
  if (!data.ids) {
    throw new Error("Missing root ids");
  }
  
  const { ids } = data;
  
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('ids:ids', {
      'xmlns:ids': 'http://standards.buildingsmart.org/IDS',
      'xmlns:xs': 'http://www.w3.org/2001/XMLSchema',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation': 'http://standards.buildingsmart.org/IDS http://standards.buildingsmart.org/IDS/1.0/ids.xsd'
    });

  // Info section
  const info = root.ele('ids:info');
  if (ids.title) info.ele('ids:title').txt(ids.title);
  if (ids.description) info.ele('ids:description').txt(ids.description);
  if (ids.author) info.ele('ids:author').txt(ids.author);
  if (ids.date) info.ele('ids:date').txt(ids.date);

  // Specifications
  const specifications = root.ele('ids:specifications');
  
  ids.rules.forEach((rule, index) => {
    const spec = specifications.ele('ids:specification', {
      name: rule.name || `Rule ${index + 1}`,
      ifcVersion: ids.ifcVersion,
      minOccurs: '0',
      maxOccurs: 'unbounded'
    });

    // Applicability
    const applicability = spec.ele('ids:applicability');
    applicability.ele('ids:entity').ele('ids:name').ele('ids:simpleValue').txt(rule.entity);

    // Requirements
    const requirements = spec.ele('ids:requirements');

    // Handle attributes
    rule.attributes?.forEach(attr => {
      const req = requirements.ele('ids:attribute', {
        cardinality: mapPresence(attr.presence)
      });
      req.ele('ids:name').ele('ids:simpleValue').txt(attr.name);
      if (attr.datatype) {
        req.att('dataType', mapDatatype(attr.datatype));
      }
      if (attr.allowed_values || attr.pattern) {
        addValueRestrictions(req, attr);
      }
    });

    // Handle properties and quantities (both map to ids:property)
    [...(rule.properties || []), ...(rule.quantities || [])].forEach(prop => {
      const req = requirements.ele('ids:property', {
        cardinality: mapPresence(prop.presence),
        dataType: mapDatatype(prop.datatype || guessDatatype(prop.name))
      });
      
      const [psetName, propName] = parsePropertyName(prop.name);
      req.ele('ids:propertySet').ele('ids:simpleValue').txt(psetName);
      req.ele('ids:baseName').ele('ids:simpleValue').txt(propName);
      
      if (prop.allowed_values || prop.pattern) {
        addValueRestrictions(req, prop);
      }
    });
  });

  return root.end({ prettyPrint: true });
}

// Helper functions
function mapPresence(presence?: Presence): string {
  switch (presence) {
    case "required": return "required";
    case "optional": return "optional";
    case "prohibited": return "prohibited";
    default: return "optional";
  }
}

function mapDatatype(datatype?: Datatype): string {
  switch (datatype) {
    case "string": return "IFCLABEL";
    case "boolean": return "IFCBOOLEAN";
    case "integer": return "IFCINTEGER";
    case "number": return "IFCREAL";
    case "length": return "IFCLENGTHMEASURE";
    case "area": return "IFCAREAMEASURE";
    case "volume": return "IFCVOLUMEMEASURE";
    case "count": return "IFCCOUNTMEASURE";
    case "date": return "IFCDATE";
    case "datetime": return "IFCDATETIME";
    case "time": return "IFCTIME";
    default: return "IFCLABEL";
  }
}

function parsePropertyName(name: string): [string, string] {
  const parts = name.split('.');
  if (parts.length >= 2) {
    return [parts[0], parts.slice(1).join('.')];
  }
  return ["Pset_Common", name];
}

function guessDatatype(name: string): Datatype {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('area')) return 'area';
  if (lowerName.includes('volume')) return 'volume';
  if (lowerName.includes('width') || lowerName.includes('height') || lowerName.includes('length')) return 'length';
  if (lowerName.includes('count')) return 'count';
  return 'string';
}

function addValueRestrictions(element: any, prop: IdsLightProperty) {
  const value = element.ele('ids:value');
  
  if (prop.allowed_values) {
    const restriction = value.ele('xs:restriction', { base: 'xs:string' });
    prop.allowed_values.forEach(val => {
      restriction.ele('xs:enumeration', { value: val });
    });
  } else if (prop.pattern) {
    const restriction = value.ele('xs:restriction', { base: 'xs:string' });
    restriction.ele('xs:pattern', { value: prop.pattern });
  }
}

function mapXsDatatype(ifcType: string): string {
  switch (ifcType) {
    case "IFCBOOLEAN": return "xs:boolean";
    case "IFCINTEGER": return "xs:integer";
    case "IFCREAL":
    case "IFCLENGTHMEASURE":
    case "IFCAREAMEASURE":
    case "IFCVOLUMEMEASURE":
    case "IFCCOUNTMEASURE": return "xs:double";
    case "IFCDATE": return "xs:date";
    case "IFCDATETIME": return "xs:dateTime";
    case "IFCTIME": return "xs:time";
    default: return "xs:string";
  }
}
\`\`\`

**Why this mapping?**

* Doors: `Pset_DoorCommon.FireRating` → text/string required. Matches Week-3 Group A. 
* Spaces: `Name` (Attribut), `Pset_SpaceCommon.OccupancyType` (string), `Qto_SpaceBaseQuantities.NetFloorArea` (area). Matches Group B. 
* Walls: `Qto_WallBaseQuantities.Width` → length; material layers optional. Matches Group C.
  These simplifications were introduced didaktisch in Week-3 input and are used again in Week-4/6 coding.

---

## 3) Add the Web Worker

> **Path:** `workers/idsWorker.ts`
> **Role:** parse → validate (Ajv) → if valid: convert to IDS XML. Returns both XML and parsed object.

\`\`\`ts
/// <reference lib="webworker" />
import { parseIdsLight, validateIdsLight, convertIdsLightToXml } from "@/lib/ids-light";

type MsgIn = { type: "convert"; text: string };
type MsgOut =
  | { ok: true; xml: string; readable: any }
  | { ok: false; errors: string[] };

self.onmessage = (e: MessageEvent<MsgIn>) => {
  if (e.data?.type !== "convert") return;
  
  try {
    const data = parseIdsLight(e.data.text);
    const validation = validateIdsLight(data);
    
    if (!validation.valid) {
      postMessage({ ok: false, errors: validation.errors || ["Validation failed"] } as MsgOut);
      return;
    }
    
    const xml = convertIdsLightToXml(data);
    postMessage({ ok: true, xml, readable: data } as MsgOut);
  } catch (err: any) {
    postMessage({ ok: false, errors: [String(err?.message || err || "Unknown error")] } as MsgOut);
  }
};

export {};
\`\`\`

---

## Course Scenarios

The editor supports the standard course scenarios:

**Group A - Doors (FireRating)**
\`\`\`yaml
ids:
  ifcVersion: "IFC4"
  rules:
    - entity: "IfcDoor"
      properties:
        - name: "Pset_DoorCommon.FireRating"
          datatype: "string"
          presence: "required"
          allowed_values: ["EI30", "EI60", "EI90"]
\`\`\`

**Group B - Spaces (Name, Occupancy, Area)**
\`\`\`yaml
ids:
  ifcVersion: "IFC4"
  rules:
    - entity: "IfcSpace"
      attributes:
        - name: "Name"
          datatype: "string"
          presence: "required"
      properties:
        - name: "Pset_SpaceCommon.OccupancyType"
          datatype: "string"
          presence: "required"
      quantities:
        - name: "Qto_SpaceBaseQuantities.NetFloorArea"
          datatype: "area"
          presence: "required"
\`\`\`

**Group C - Walls (Width)**
\`\`\`yaml
ids:
  ifcVersion: "IFC4"
  rules:
    - entity: "IfcWall"
      quantities:
        - name: "Qto_WallBaseQuantities.Width"
          datatype: "length"
          presence: "required"
\`\`\`

---

## Implementation Notes

* The "quantities-as-properties" mapping is intentional for IDS (Qto_* → `ids:property` with `@dataType` length/area/…); it keeps the XML consistent and ready for Week-4 Python checks.
* Students will later script the exact checks (FireRating, Space area, Wall width) in Python (Week-4/6), so the XML this tool emits lines up with the examples and rubric.

---

## Usage

After implementation, your page will:
* accept YAML/JSON on the **left**,
* **validate** against the JSON Schema,
* **convert** to official **IDS 1.0 XML** in a worker,
* show **XML** or **human-readable** on the **right**,
* let users **Copy** or **Download .ids**.

If you want me to also drop in a small **Monaco** component with YAML auto-completion based on the schema, I can provide that too.
