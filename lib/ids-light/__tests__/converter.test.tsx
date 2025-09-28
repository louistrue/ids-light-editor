import { describe, it, expect } from "@jest/globals"
import { parseIdsLight, validateIdsLight, convertIdsLightToXml, type IdsLight } from "../index"

describe("IDS-Light Converter", () => {
  const validYamlInput = `ids:
  title: "Test IDS"
  description: "Test description"
  author: "Test Author"
  date: "2025-01-01"
  ifcVersion: "IFC4"
  rules:
    - name: "Door FireRating Test"
      entity: "IfcDoor"
      properties:
        - name: "Pset_DoorCommon.FireRating"
          datatype: "string"
          presence: "required"
          allowed_values: ["EI30", "EI60", "EI90"]
    - name: "Space Test"
      entity: "IfcSpace"
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
          presence: "required"`

  const validJsonInput = JSON.stringify({
    ids: {
      title: "Test IDS JSON",
      ifcVersion: "IFC4",
      rules: [
        {
          entity: "IfcWall",
          quantities: [
            {
              name: "Qto_WallBaseQuantities.Width",
              datatype: "length",
              presence: "required",
            },
          ],
        },
      ],
    },
  })

  describe("parseIdsLight", () => {
    it("should parse valid YAML input", () => {
      const result = parseIdsLight(validYamlInput)
      expect(result.ids.title).toBe("Test IDS")
      expect(result.ids.ifcVersion).toBe("IFC4")
      expect(result.ids.rules).toHaveLength(2)
      expect(result.ids.rules[0].entity).toBe("IfcDoor")
    })

    it("should parse valid JSON input", () => {
      const result = parseIdsLight(validJsonInput)
      expect(result.ids.title).toBe("Test IDS JSON")
      expect(result.ids.rules[0].entity).toBe("IfcWall")
    })

    it("should handle empty input", () => {
      const result = parseIdsLight("")
      expect(result.ids.rules).toEqual([])
      expect(result.ids.ifcVersion).toBe("IFC4")
    })

    it("should throw error for invalid YAML", () => {
      expect(() => parseIdsLight("invalid: yaml: [")).toThrow()
    })
  })

  describe("validateIdsLight", () => {
    it("should validate correct IDS-Light structure", () => {
      const data = parseIdsLight(validYamlInput)
      const result = validateIdsLight(data)
      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it("should reject missing required fields", () => {
      const invalidData = { ids: { rules: [] } } // missing ifcVersion
      const result = validateIdsLight(invalidData)
      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors![0]).toContain("ifcVersion")
    })

    it("should reject invalid ifcVersion", () => {
      const invalidData = {
        ids: {
          ifcVersion: "INVALID",
          rules: [{ entity: "IfcDoor" }],
        },
      }
      const result = validateIdsLight(invalidData)
      expect(result.valid).toBe(false)
      expect(result.errors![0]).toContain("ifcVersion")
    })

    it("should reject rules without entity", () => {
      const invalidData = {
        ids: {
          ifcVersion: "IFC4",
          rules: [{ name: "test" }], // missing entity
        },
      }
      const result = validateIdsLight(invalidData)
      expect(result.valid).toBe(false)
    })

    it("should validate presence enum values", () => {
      const invalidData = {
        ids: {
          ifcVersion: "IFC4",
          rules: [
            {
              entity: "IfcDoor",
              properties: [
                {
                  name: "Test",
                  presence: "invalid_presence", // invalid enum value
                },
              ],
            },
          ],
        },
      }
      const result = validateIdsLight(invalidData)
      expect(result.valid).toBe(false)
    })
  })

  describe("convertIdsLightToXml", () => {
    it("should convert valid IDS-Light to XML", () => {
      const data = parseIdsLight(validYamlInput)
      const xml = convertIdsLightToXml(data)

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(xml).toContain('xmlns:ids="http://standards.buildingsmart.org/IDS"')
      expect(xml).toContain("<ids:title>Test IDS</ids:title>")
      expect(xml).toContain("<ids:specification")
      expect(xml).toContain('ifcVersion="IFC4"')
    })

    it("should handle door properties correctly", () => {
      const data = parseIdsLight(validYamlInput)
      const xml = convertIdsLightToXml(data)

      expect(xml).toContain("<ids:property")
      expect(xml).toContain("<ids:propertySet><ids:simpleValue>Pset_DoorCommon</ids:simpleValue></ids:propertySet>")
      expect(xml).toContain("<ids:baseName><ids:simpleValue>FireRating</ids:simpleValue></ids:baseName>")
      expect(xml).toContain('dataType="IFCLABEL"')
      expect(xml).toContain('cardinality="required"')
    })

    it("should handle space attributes correctly", () => {
      const data = parseIdsLight(validYamlInput)
      const xml = convertIdsLightToXml(data)

      expect(xml).toContain("<ids:attribute")
      expect(xml).toContain("<ids:name><ids:simpleValue>Name</ids:simpleValue></ids:name>")
    })

    it("should handle quantities with correct dataTypes", () => {
      const data = parseIdsLight(validYamlInput)
      const xml = convertIdsLightToXml(data)

      expect(xml).toContain('dataType="IFCAREAMEASURE"') // for area quantities
      expect(xml).toContain(
        "<ids:propertySet><ids:simpleValue>Qto_SpaceBaseQuantities</ids:simpleValue></ids:propertySet>",
      )
      expect(xml).toContain("<ids:baseName><ids:simpleValue>NetFloorArea</ids:simpleValue></ids:baseName>")
    })

    it("should handle allowed values as enumerations", () => {
      const data = parseIdsLight(validYamlInput)
      const xml = convertIdsLightToXml(data)

      expect(xml).toContain("<ids:value>")
      expect(xml).toContain('<xs:restriction base="xs:string">')
      expect(xml).toContain('<xs:enumeration value="EI30"/>')
      expect(xml).toContain('<xs:enumeration value="EI60"/>')
      expect(xml).toContain('<xs:enumeration value="EI90"/>')
    })

    it("should map datatypes to correct IFC types", () => {
      const testData: IdsLight = {
        ids: {
          ifcVersion: "IFC4",
          rules: [
            {
              entity: "IfcTest",
              properties: [
                { name: "Test.StringProp", datatype: "string" },
                { name: "Test.BoolProp", datatype: "boolean" },
                { name: "Test.IntProp", datatype: "integer" },
                { name: "Test.NumProp", datatype: "number" },
                { name: "Test.LengthProp", datatype: "length" },
                { name: "Test.AreaProp", datatype: "area" },
                { name: "Test.VolumeProp", datatype: "volume" },
                { name: "Test.CountProp", datatype: "count" },
                { name: "Test.DateProp", datatype: "date" },
                { name: "Test.DateTimeProp", datatype: "datetime" },
                { name: "Test.TimeProp", datatype: "time" },
              ],
            },
          ],
        },
      }

      const xml = convertIdsLightToXml(testData)
      expect(xml).toContain('dataType="IFCLABEL"')
      expect(xml).toContain('dataType="IFCBOOLEAN"')
      expect(xml).toContain('dataType="IFCINTEGER"')
      expect(xml).toContain('dataType="IFCREAL"')
      expect(xml).toContain('dataType="IFCLENGTHMEASURE"')
      expect(xml).toContain('dataType="IFCAREAMEASURE"')
      expect(xml).toContain('dataType="IFCVOLUMEMEASURE"')
      expect(xml).toContain('dataType="IFCCOUNTMEASURE"')
      expect(xml).toContain('dataType="IFCDATE"')
      expect(xml).toContain('dataType="IFCDATETIME"')
      expect(xml).toContain('dataType="IFCTIME"')
    })

    it("should handle presence mapping correctly", () => {
      const testData: IdsLight = {
        ids: {
          ifcVersion: "IFC4",
          rules: [
            {
              entity: "IfcTest",
              properties: [
                { name: "Test.Required", presence: "required" },
                { name: "Test.Optional", presence: "optional" },
                { name: "Test.Prohibited", presence: "prohibited" },
              ],
            },
          ],
        },
      }

      const xml = convertIdsLightToXml(testData)
      expect(xml).toContain('cardinality="required"')
      expect(xml).toContain('cardinality="optional"')
      expect(xml).toContain('cardinality="prohibited"')
    })

    it("should throw error for missing ids root", () => {
      expect(() => convertIdsLightToXml({} as any)).toThrow("Missing root ids")
    })
  })

  describe("Integration Tests", () => {
    it("should handle complete workflow: parse → validate → convert", () => {
      // Parse
      const parsed = parseIdsLight(validYamlInput)
      expect(parsed.ids.title).toBe("Test IDS")

      // Validate
      const validation = validateIdsLight(parsed)
      expect(validation.valid).toBe(true)

      // Convert
      const xml = convertIdsLightToXml(parsed)
      expect(xml).toContain("<ids:title>Test IDS</ids:title>")
      expect(xml).toContain('xmlns:ids="http://standards.buildingsmart.org/IDS"')
    })

    it("should handle course scenario examples", () => {
      // Test Door FireRating scenario (Group A)
      const doorYaml = `ids:
        ifcVersion: "IFC4"
        rules:
          - entity: "IfcDoor"
            properties:
              - name: "Pset_DoorCommon.FireRating"
                datatype: "string"
                presence: "required"
                allowed_values: ["EI30", "EI60", "EI90"]`

      const doorData = parseIdsLight(doorYaml)
      const doorValidation = validateIdsLight(doorData)
      expect(doorValidation.valid).toBe(true)

      const doorXml = convertIdsLightToXml(doorData)
      expect(doorXml).toContain("IfcDoor")
      expect(doorXml).toContain("Pset_DoorCommon")
      expect(doorXml).toContain("FireRating")
      expect(doorXml).toContain("EI30")
    })

    it("should handle wall width scenario (Group C)", () => {
      const wallYaml = `ids:
        ifcVersion: "IFC4"
        rules:
          - entity: "IfcWall"
            quantities:
              - name: "Qto_WallBaseQuantities.Width"
                datatype: "length"
                presence: "required"`

      const wallData = parseIdsLight(wallYaml)
      const wallValidation = validateIdsLight(wallData)
      expect(wallValidation.valid).toBe(true)

      const wallXml = convertIdsLightToXml(wallData)
      expect(wallXml).toContain("IfcWall")
      expect(wallXml).toContain("Qto_WallBaseQuantities")
      expect(wallXml).toContain("Width")
      expect(wallXml).toContain("IFCLENGTHMEASURE")
    })
  })

  describe("Edge Cases", () => {
    it("should handle property names without dots", () => {
      const testData: IdsLight = {
        ids: {
          ifcVersion: "IFC4",
          rules: [
            {
              entity: "IfcTest",
              properties: [{ name: "SimpleName" }],
            },
          ],
        },
      }

      const xml = convertIdsLightToXml(testData)
      expect(xml).toContain("<ids:propertySet><ids:simpleValue>Pset_Common</ids:simpleValue></ids:propertySet>")
      expect(xml).toContain("<ids:baseName><ids:simpleValue>SimpleName</ids:simpleValue></ids:baseName>")
    })

    it("should guess measure types from quantity names", () => {
      const testData: IdsLight = {
        ids: {
          ifcVersion: "IFC4",
          rules: [
            {
              entity: "IfcTest",
              quantities: [
                { name: "Qto_Test.Width" }, // should guess "length"
                { name: "Qto_Test.Area" }, // should guess "area"
                { name: "Qto_Test.Volume" }, // should guess "volume"
                { name: "Qto_Test.Count" }, // should guess "number"
              ],
            },
          ],
        },
      }

      const xml = convertIdsLightToXml(testData)
      expect(xml).toContain('dataType="IFCLENGTHMEASURE"')
      expect(xml).toContain('dataType="IFCAREAMEASURE"')
      expect(xml).toContain('dataType="IFCVOLUMEMEASURE"')
      expect(xml).toContain('dataType="IFCREAL"')
    })

    it("should handle pattern restrictions", () => {
      const testData: IdsLight = {
        ids: {
          ifcVersion: "IFC4",
          rules: [
            {
              entity: "IfcTest",
              properties: [
                {
                  name: "Test.Pattern",
                  pattern: "[A-Z]{2}[0-9]{2}",
                },
              ],
            },
          ],
        },
      }

      const xml = convertIdsLightToXml(testData)
      expect(xml).toContain('<xs:pattern value="[A-Z]{2}[0-9]{2}"/>')
    })
  })
})
