/// <reference lib="webworker" />
import { parseIdsLight, validateIdsLight, convertIdsLightToXml } from "@/lib/ids-light"

type MsgIn = { type: "convert"; text: string }
type MsgOut = { ok: true; xml: string; readable: any } | { ok: false; errors: string[] }

function validateWithDetailedErrors(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data?.ids) {
    errors.push("Missing root 'ids' object")
    return { valid: false, errors }
  }

  if (!data.ids.rules || !Array.isArray(data.ids.rules)) {
    errors.push("Missing or invalid 'rules' array")
    return { valid: false, errors }
  }

  // Check each rule
  data.ids.rules.forEach((rule: any, ruleIndex: number) => {
    const ruleNum = ruleIndex + 1

    if (!rule.entity) {
      errors.push(`Rule ${ruleNum}: Missing 'entity' field`)
    }

    // Check partOf facets
    if (rule.partOf) {
      rule.partOf.forEach((partOf: any, partOfIndex: number) => {
        const facetNum = partOfIndex + 1
        if (!partOf.entity) {
          errors.push(`Rule ${ruleNum}, PartOf ${facetNum}: Missing 'entity' field`)
        }
      })
    }

    if (rule.requiredPartOf) {
      rule.requiredPartOf.forEach((partOf: any, partOfIndex: number) => {
        const facetNum = partOfIndex + 1
        if (!partOf.entity) {
          errors.push(`Rule ${ruleNum}, Required PartOf ${facetNum}: Missing 'entity' field`)
        }
      })
    }

    // Check classification facets
    if (rule.classifications) {
      rule.classifications.forEach((classification: any, classIndex: number) => {
        const facetNum = classIndex + 1
        if (!classification.system) {
          errors.push(`Rule ${ruleNum}, Classification ${facetNum}: Missing 'system' field`)
        }
      })
    }

    if (rule.requiredClassifications) {
      rule.requiredClassifications.forEach((classification: any, classIndex: number) => {
        const facetNum = classIndex + 1
        if (!classification.system) {
          errors.push(`Rule ${ruleNum}, Required Classification ${facetNum}: Missing 'system' field`)
        }
      })
    }

    // Check material facets (no required fields beyond the array itself)
    // Materials are optional

    // Check attributes
    if (rule.attributes) {
      rule.attributes.forEach((attr: any, attrIndex: number) => {
        const propNum = attrIndex + 1
        if (!attr.name) {
          errors.push(`Rule ${ruleNum}, Attribute ${propNum}: Missing 'name' field`)
        }
        if (!attr.datatype) {
          errors.push(`Rule ${ruleNum}, Attribute ${propNum}: Missing 'datatype' field`)
        }
      })
    }

    // Check properties
    if (rule.properties) {
      rule.properties.forEach((prop: any, propIndex: number) => {
        const propNum = propIndex + 1
        if (!prop.name) {
          errors.push(`Rule ${ruleNum}, Property ${propNum}: Missing 'name' field`)
        }
        if (!prop.datatype) {
          errors.push(`Rule ${ruleNum}, Property ${propNum}: Missing 'datatype' field`)
        }
      })
    }

    // Check quantities
    if (rule.quantities) {
      rule.quantities.forEach((qty: any, qtyIndex: number) => {
        const propNum = qtyIndex + 1
        if (!qty.name) {
          errors.push(`Rule ${ruleNum}, Quantity ${propNum}: Missing 'name' field`)
        }
        if (!qty.datatype) {
          errors.push(`Rule ${ruleNum}, Quantity ${propNum}: Missing 'datatype' field`)
        }
      })
    }
  })

  return { valid: errors.length === 0, errors }
}

self.onmessage = (e: MessageEvent<MsgIn>) => {
  if (e.data?.type !== "convert") return
  const text = e.data.text || ""
  try {
    const data = parseIdsLight(text)

    const customValidation = validateWithDetailedErrors(data)
    if (!customValidation.valid) {
      postMessage({ ok: false, errors: customValidation.errors } as MsgOut)
      return
    }

    // Then use standard validation
    const { valid, errors } = validateIdsLight(data)
    if (!valid) {
      postMessage({ ok: false, errors: errors ?? ["Validation error"] } as MsgOut)
      return
    }
    const xml = convertIdsLightToXml(data, { pretty: true })
    postMessage({ ok: true, xml, readable: data } as MsgOut)
  } catch (err: any) {
    postMessage({ ok: false, errors: [String(err?.message || err || "Unknown error")] } as MsgOut)
  }
}
