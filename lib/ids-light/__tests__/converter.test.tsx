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
      const xml = convertIdsLightToXml(data, { pretty: false })

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(xml).toContain('xmlns:ids="http://standards.buildingsmart.org/IDS"')
      expect(xml).toContain("<ids:title>Test IDS</ids:title>")
      expect(xml).toContain("<ids:specification")
      expect(xml).toContain('ifcVersion="IFC4"')
    })

    it("should handle door properties correctly", () => {
      const data = parseIdsLight(validYamlInput)
      const xml = convertIdsLightToXml(data, { pretty: false })

      expect(xml).toContain("<ids:property")
      expect(xml).toContain("<ids:propertySet><ids:simpleValue>Pset_DoorCommon</ids:simpleValue></ids:propertySet>")
      expect(xml).toContain("<ids:baseName><ids:simpleValue>FireRating</ids:simpleValue></ids:baseName>")
      expect(xml).toContain('dataType="IFCLABEL"')
      expect(xml).toContain('cardinality="required"')
    })

    it("should handle space attributes correctly", () => {
      const data = parseIdsLight(validYamlInput)
      const xml = convertIdsLightToXml(data, { pretty: false })

      expect(xml).toContain("<ids:attribute")
      expect(xml).toContain("<ids:name><ids:simpleValue>Name</ids:simpleValue></ids:name>")
    })

    it("should handle quantities with correct dataTypes", () => {
      const data = parseIdsLight(validYamlInput)
      const xml = convertIdsLightToXml(data, { pretty: false })

      expect(xml).toContain('dataType="IFCAREAMEASURE"') // for area quantities
      expect(xml).toContain(
        "<ids:propertySet><ids:simpleValue>Qto_SpaceBaseQuantities</ids:simpleValue></ids:propertySet>",
      )
      expect(xml).toContain("<ids:baseName><ids:simpleValue>NetFloorArea</ids:simpleValue></ids:baseName>")
    })

    it("should handle allowed values as enumerations", () => {
      const data = parseIdsLight(validYamlInput)
      const xml = convertIdsLightToXml(data, { pretty: false })

      expect(xml).toContain("<ids:value>")
      expect(xml).toContain('<xs:restriction base="xs:string">')
      expect(xml).toContain('<xs:enumeration value="EI30"/>')
      expect(xml).toContain('<xs:enumeration value="EI60"/>')
      expect(xml).toContain('<xs:enumeration value="EI90"/>')
    })

    it("should handle architectural example correctly", () => {
      const architecturalYaml = `ids:
  title: "Architectural Elements (IDS-Light)"
  description: "Design requirements for windows and doors"
  author: "Architect"
  date: "2025-01-15"
  ifcVersion: "IFC4"
  rules:
    - name: "IfcWindow - Thermal Performance"
      entity: "IfcWindow"
      properties:
        - name: "Pset_WindowCommon.ThermalTransmittance"
          datatype: "number"
          presence: "required"
    - name: "IfcDoor - Security & Fire (Internal)"
      entity: "IfcDoor"
      classifications:
        - system: "Uniclass"
          value: "EF_25_30_40_40" # Internal doorsets`
      const data = parseIdsLight(architecturalYaml)
      const xml = convertIdsLightToXml(data, { pretty: false })
      expect(xml).toContain('dataType="IFCTHERMALTRANSMITTANCEMEASURE"')
      expect(xml).toContain('<ids:classification><ids:value><ids:simpleValue>EF_25_30_40_40</ids:simpleValue></ids:value><ids:system><ids:simpleValue>Uniclass</ids:simpleValue></ids:system></ids:classification>')
    })

    it("should strip inline comments from YAML values", () => {
      const yamlWithComments = `ids:
  ifcVersion: "IFC4"
  rules:
    - entity: "IfcDoor"
      classifications:
        - system: "Uniclass"
          value: "EF_25_30_40_40" # This is a comment
      properties:
        - name: "Pset_DoorCommon.FireRating"
          datatype: "string" # Another comment
          presence: "required"`
      const data = parseIdsLight(yamlWithComments)
      expect(data.ids.rules[0].classifications[0].value).toBe("EF_25_30_40_40")
      expect(data.ids.rules[0].properties[0].datatype).toBe("string")
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

      const xml = convertIdsLightToXml(testData, { pretty: false })
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

      const xml = convertIdsLightToXml(testData, { pretty: false })
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
      const xml = convertIdsLightToXml(parsed, { pretty: false })
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

      const doorXml = convertIdsLightToXml(doorData, { pretty: false })
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

      const wallXml = convertIdsLightToXml(wallData, { pretty: false })
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

      const xml = convertIdsLightToXml(testData, { pretty: false })
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

      const xml = convertIdsLightToXml(testData, { pretty: false })
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

      const xml = convertIdsLightToXml(testData, { pretty: false })
      expect(xml).toContain('<xs:pattern value="[A-Z]{2}[0-9]{2}"/>')
    })

    it("should handle legacy singular classification field and normalize it to classifications array", () => {
      const testData: IdsLight = {
        ids: {
          ifcVersion: "IFC4",
          rules: [
            {
              entity: "IfcWall",
              classification: {
                system: "Uniclass",
                value: "EF_25_10",
              },
            },
          ],
        },
      }

      const xml = convertIdsLightToXml(testData, { pretty: false })
      expect(xml).toContain("<ids:classification")
      expect(xml).toContain("<ids:system><ids:simpleValue>Uniclass</ids:simpleValue></ids:system>")
      expect(xml).toContain("<ids:value><ids:simpleValue>EF_25_10</ids:simpleValue></ids:value>")
    })

    it("should merge legacy classification with existing classifications array", () => {
      const testData: IdsLight = {
        ids: {
          ifcVersion: "IFC4",
          rules: [
            {
              entity: "IfcWall",
              classifications: [
                {
                  system: "OmniClass",
                  value: "12-34",
                },
              ],
              classification: {
                system: "Uniclass",
                value: "EF_25_10",
              },
            },
          ],
        },
      }

      const xml = convertIdsLightToXml(testData, { pretty: false })
      // Check for OmniClass
      expect(xml).toContain("<ids:system><ids:simpleValue>OmniClass</ids:simpleValue></ids:system>")
      expect(xml).toContain("<ids:value><ids:simpleValue>12-34</ids:simpleValue></ids:value>")
      // Check for Uniclass
      expect(xml).toContain("<ids:system><ids:simpleValue>Uniclass</ids:simpleValue></ids:system>")
      expect(xml).toContain("<ids:value><ids:simpleValue>EF_25_10</ids:simpleValue></ids:value>")
    })

    it("should handle partOf relationships in applicability", () => {
      const testData: IdsLight = {
        ids: {
          ifcVersion: "IFC4",
          rules: [
            {
              entity: "IfcDoor",
              partOf: [
                {
                  entity: "IfcBuilding",
                  relation: "IFCRELCONTAINEDINSPATIALSTRUCTURE",
                  instructions: "Door must be contained in a building",
                },
                {
                  entity: "IfcSpace",
                  predefinedType: "SPACE",
                },
              ],
            },
          ],
        },
      }

      const xml = convertIdsLightToXml(testData, { pretty: false })
      expect(xml).toContain("<ids:partOf")
      expect(xml).toContain('relation="IFCRELCONTAINEDINSPATIALSTRUCTURE"')
      expect(xml).toContain('instructions="Door must be contained in a building"')
      expect(xml).toContain("<ids:name><ids:simpleValue>IFCBUILDING</ids:simpleValue></ids:name>")
      expect(xml).toContain("<ids:name><ids:simpleValue>IFCSPACE</ids:simpleValue></ids:name>")
      expect(xml).toContain("<ids:predefinedType><ids:simpleValue>SPACE</ids:simpleValue></ids:predefinedType>")
    })

    it("should handle classification constraints in applicability", () => {
      const testData: IdsLight = {
        ids: {
          ifcVersion: "IFC4",
          rules: [
            {
              entity: "IfcWall",
              classifications: [
                {
                  system: "Uniclass",
                  value: "EF_25_10",
                  uri: "https://uniclass2015.classification.bimstandards.org.uk/",
                  instructions: "Wall must be classified under Uniclass system",
                },
              ],
            },
          ],
        },
      }

      const xml = convertIdsLightToXml(testData, { pretty: false })
      expect(xml).toContain("<ids:classification")
      expect(xml).toContain("<ids:system><ids:simpleValue>Uniclass</ids:simpleValue></ids:system>")
      expect(xml).toContain("<ids:value><ids:simpleValue>EF_25_10</ids:simpleValue></ids:value>")
    })

    it("should handle material constraints in applicability", () => {
      const testData: IdsLight = {
        ids: {
          ifcVersion: "IFC4",
          rules: [
            {
              entity: "IfcSlab",
              materials: [
                {
                  value: "Concrete",
                  uri: "https://material.library/concrete",
                  instructions: "Slab must be made of concrete",
                },
              ],
            },
          ],
        },
      }

      const xml = convertIdsLightToXml(testData, { pretty: false })
      expect(xml).toContain("<ids:material")
      expect(xml).toContain("<ids:value><ids:simpleValue>Concrete</ids:simpleValue></ids:value>")
    })

    it("should handle partOf requirements", () => {
      const testData: IdsLight = {
        ids: {
          ifcVersion: "IFC4",
          rules: [
            {
              entity: "IfcWindow",
              requiredPartOf: [
                {
                  entity: "IfcWall",
                  relation: "IFCRELVOIDSELEMENT IFCRELFILLSELEMENT",
                  instructions: "Window must be hosted by a wall",
                },
              ],
            },
          ],
        },
      }

      const xml = convertIdsLightToXml(testData, { pretty: false })
      expect(xml).toContain('<ids:partOf cardinality="required"')
      expect(xml).toContain('relation="IFCRELVOIDSELEMENT IFCRELFILLSELEMENT"')
      expect(xml).toContain('instructions="Window must be hosted by a wall"')
      expect(xml).toContain("<ids:name><ids:simpleValue>IFCWALL</ids:simpleValue></ids:name>")
    })

    it("should handle classification requirements", () => {
      const testData: IdsLight = {
        ids: {
          ifcVersion: "IFC4",
          rules: [
            {
              entity: "IfcBeam",
              requiredClassifications: [
                {
                  system: "OmniClass",
                  value: "23-13 11 13",
                  uri: "https://www.omniclass.org/",
                  instructions: "Beam must have OmniClass classification",
                },
              ],
            },
          ],
        },
      }

      const xml = convertIdsLightToXml(testData, { pretty: false })
      expect(xml).toContain('<ids:classification cardinality="required"')
      expect(xml).toContain('uri="https://www.omniclass.org/"')
      expect(xml).toContain('instructions="Beam must have OmniClass classification"')
      expect(xml).toContain("<ids:system><ids:simpleValue>OmniClass</ids:simpleValue></ids:system>")
      expect(xml).toContain("<ids:value><ids:simpleValue>23-13 11 13</ids:simpleValue></ids:value>")
    })

    it("should handle material requirements", () => {
      const testData: IdsLight = {
        ids: {
          ifcVersion: "IFC4",
          rules: [
            {
              entity: "IfcColumn",
              requiredMaterials: [
                {
                  value: "Steel",
                  uri: "https://material.library/steel",
                  instructions: "Column must be made of steel",
                },
              ],
            },
          ],
        },
      }

      const xml = convertIdsLightToXml(testData, { pretty: false })
      expect(xml).toContain('<ids:material cardinality="required"')
      expect(xml).toContain('uri="https://material.library/steel"')
      expect(xml).toContain('instructions="Column must be made of steel"')
      expect(xml).toContain("<ids:value><ids:simpleValue>Steel</ids:simpleValue></ids:value>")
    })

    it("should handle combined facet types", () => {
      const testData: IdsLight = {
        ids: {
          ifcVersion: "IFC4",
          rules: [
            {
              entity: "IfcDoor",
              name: "Comprehensive Door Rule",
              partOf: [
                {
                  entity: "IfcBuilding",
                  relation: "IFCRELCONTAINEDINSPATIALSTRUCTURE",
                },
              ],
              classifications: [
                {
                  system: "Uniclass",
                  value: "EF_25_30",
                },
              ],
              materials: [
                {
                  value: "Wood",
                },
              ],
              requiredPartOf: [
                {
                  entity: "IfcWall",
                },
              ],
              requiredClassifications: [
                {
                  system: "eBKP",
                  value: "Tuer",
                },
              ],
              requiredMaterials: [
                {
                  value: "Oak",
                },
              ],
            },
          ],
        },
      }

      const xml = convertIdsLightToXml(testData, { pretty: false })
      expect(xml).toContain('<ids:specification name="Comprehensive Door Rule"')

      // Applicability facets
      expect(xml).toContain("<ids:applicability")
      expect(xml).toContain('<ids:partOf relation="IFCRELCONTAINEDINSPATIALSTRUCTURE"')
      expect(xml).toContain("<ids:classification")
      expect(xml).toContain("<ids:material")

      // Requirements facets
      expect(xml).toContain('<ids:partOf cardinality="required"')
      expect(xml).toContain('<ids:classification cardinality="required"')
      expect(xml).toContain('<ids:material cardinality="required"')
    })
  })
})
