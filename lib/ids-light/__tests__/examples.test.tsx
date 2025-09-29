import { convertIdsLightToXml, parseIdsLight, validateIdsLight } from ".."

// Import the real examples from the UI component
// We'll extract the YAML strings directly to test the exact same content
const examples = {
  basic: {
    name: "Basic Elements",
    yaml: `ids:
  title: "Basic Building Elements (IDS-Light)"
  description: "Essential requirements for doors, spaces, and walls"
  author: "IDS Editor"
  date: "2025-01-15"
  ifcVersion: "IFC4"
  rules:
    - name: "IfcDoor - In Wall with FireRating"
      entity: "IfcDoor"
      requiredPartOf: # Requirement: must be contained in a wall
        - entity: "IfcWall"
      properties:
        - name: "Pset_DoorCommon.FireRating"
          datatype: "string"
          presence: "required"
    - name: "IfcSpace - Name and Area"
      entity: "IfcSpace"
      attributes:
        - name: "Name"
          datatype: "string"
          presence: "required"
      quantities:
        - name: "Qto_SpaceBaseQuantities.NetFloorArea"
          datatype: "area"
          presence: "required"
    - name: "IfcWall - Width required"
      entity: "IfcWall"
      quantities:
        - name: "Qto_WallBaseQuantities.Width"
          datatype: "length"
          presence: "required"`,
  },
  structural: {
    name: "Structural Elements",
    yaml: `ids:
  title: "Structural Elements (IDS-Light)"
  description: "Load-bearing requirements"
  author: "Structural Engineer"
  date: "2025-01-15"
  ifcVersion: "IFC4"
  rules:
    - name: "IfcWall - Load Bearing"
      entity: "IfcWall"
      properties:
        - name: "Pset_WallCommon.LoadBearing"
          datatype: "boolean"
          presence: "required"
        - name: "Pset_WallCommon.ThermalTransmittance"
          datatype: "thermaltransmittance"
          presence: "required"
    - name: "IfcColumn - Strength Class"
      entity: "IfcColumn"
      requiredMaterials: # Requirement: must be concrete
        - value: Concrete
      attributes:
        - name: "Name"
          datatype: "string"
          presence: "required"
      properties:
        - name: "Pset_ConcreteElementGeneral.StrengthClass"
          datatype: "string"
          presence: "required"`,
  },
  mep: {
    name: "MEP Systems",
    yaml: `ids:
  title: "MEP Systems (IDS-Light)"
  description: "HVAC and electrical requirements"
  author: "MEP Engineer"
  date: "2025-01-15"
  ifcVersion: "IFC4"
  rules:
    - name: "IfcAirTerminal - In Spaces"
      entity: "IfcAirTerminal"
      partOf: # Applicability: only terminals inside an IfcSpace
        - entity: "IfcSpace"
      attributes:
        - name: "Name"
          datatype: "string"
          presence: "required"
      properties:
        - name: "Pset_AirTerminalTypeCommon.DischargeDirection"
          datatype: "string"
          presence: "required"
          allowed_values: ["HORIZONTAL", "VERTICAL", "ADJUSTABLE"]
          instructions: "Air discharge direction specification"
        - name: "Pset_AirTerminalTypeCommon.FlowControlType"
          datatype: "string"
          presence: "required"
          instructions: "Flow control mechanism type"
    - name: "IfcElectricAppliance - Status Tracking"
      entity: "IfcElectricAppliance"
      attributes:
        - name: "Name"
          datatype: "string"
          presence: "required"
      properties:
        - name: "Pset_ElectricApplianceTypeCommon.Status"
          datatype: "string"
          presence: "required"`,
  },
  architectural: {
    name: "Architectural Design",
    yaml: `ids:
  title: "Architectural Elements (IDS-Light)"
  description: "Design requirements for windows and doors"
  author: "Architect"
  date: "2025-01-15"
  ifcVersion: "IFC4"
  rules:
    - name: "IfcWindow - Thermal Performance"
      entity: "IfcWindow"
      attributes:
        - name: "Name"
          datatype: "string"
          presence: "required"
      properties:
        - name: "Pset_WindowCommon.ThermalTransmittance"
          datatype: "thermaltransmittance"
          presence: "required"
      quantities:
        - name: "Qto_WindowBaseQuantities.Area"
          datatype: "area"
          presence: "required"
    - name: "IfcDoor - Security & Fire (Internal)"
      entity: "IfcDoor"
      classifications: # Applicability: only internal doors
        - system: Uniclass
          value: EF_25_30_40_40 # Internal doorsets
      properties:
        - name: "Pset_DoorCommon.FireRating"
          datatype: "string"
          presence: "required"
        - name: "Pset_DoorCommon.SecurityRating"
          datatype: "string"
          presence: "required"`,
  },
}

describe("IDS-Light Example Conversions", () => {
  for (const [key, example] of Object.entries(examples)) {
    it(`should correctly parse, validate, and convert the "${example.name}" example`, () => {
      // 1. Parse the YAML
      let parsedData
      expect(() => {
        parsedData = parseIdsLight(example.yaml)
      }).not.toThrow()

      // Ensure parsedData is not undefined before proceeding
      if (!parsedData) {
        throw new Error("Parsing failed, parsedData is undefined.")
      }

      // 2. Validate the parsed data against the schema
      const validationResult = validateIdsLight(parsedData)
      expect(validationResult.valid).toBe(true)
      expect(validationResult.errors).toBeUndefined()

      // 3. Convert to XML
      let xmlOutput
      expect(() => {
        xmlOutput = convertIdsLightToXml(parsedData)
      }).not.toThrow()

      // 4. Basic XML sanity checks
      expect(xmlOutput).toBeTruthy()
      expect(xmlOutput).toContain("<ids:ids")
      expect(xmlOutput).toContain("</ids:ids>")
      expect(xmlOutput).toContain(`<ids:title>${parsedData.ids.title}</ids:title>`)
      expect(xmlOutput).toContain(`<ids:specification name="${parsedData.ids.rules[0].name}"`)
    })
  }
})
