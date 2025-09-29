# IDS‑Light Editor

Create, convert, and validate comprehensive buildingSMART IDS files from friendly IDS‑Light YAML/JSON. Full support for all IDS facets: partOf relationships, classifications, materials, properties, attributes, and quantities with cardinality. Includes beautiful in-app documentation and runs in the browser with instant feedback and optional server‑side auditing.

## Features

- **YAML/JSON Input**: Author IDS‑Light in human‑readable YAML/JSON
- **Live Validation**: JSON‑Schema with clear errors
- **XML Conversion**: Standards‑compliant IDS 1.0 XML
- **Complete Facet Support**: partOf relationships, classifications, and materials with cardinality
- **Web Worker**: Non‑blocking conversion
- **Copy & Download**: Export generated `.ids`
- **Local Storage**: Auto‑save your work

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10.x (recommended)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
pnpm install
```
3. Start the development server:
```bash
pnpm dev
```
4. Open http://localhost:3000

The editor includes comprehensive in-app documentation accessible via the "Docs" button in the header.

### Testing

```bash
pnpm test
pnpm run test:watch
pnpm run test:coverage
```

## Usage

### Minimal examples

Door FireRating:
```yaml
ids:
  ifcVersion: "IFC4"
  rules:
    - name: "IfcDoor – FireRating required"
      entity: "IfcDoor"
      properties:
        - name: "Pset_DoorCommon.FireRating"
          datatype: "string"
          presence: "required"
```

Space Name + Area:
```yaml
ids:
  ifcVersion: "IFC4"
  rules:
    - name: "IfcSpace – Name and Area"
      entity: "IfcSpace"
      attributes:
        - name: "Name"
          datatype: "string"
          presence: "required"
      quantities:
        - name: "Qto_SpaceBaseQuantities.NetFloorArea"
          datatype: "area"
          presence: "required"
```

Wall Width:
```yaml
ids:
  ifcVersion: "IFC4"
  rules:
    - name: "IfcWall – Width required"
      entity: "IfcWall"
      quantities:
        - name: "Qto_WallBaseQuantities.Width"
          datatype: "length"
          presence: "required"
```

Door with Structural Relationships:
```yaml
ids:
  ifcVersion: "IFC4"
  rules:
    - name: "Door in Building"
      entity: "IfcDoor"
      partOf:
        - entity: "IfcBuilding"
          relation: "IFCRELCONTAINEDINSPATIALSTRUCTURE"
      requiredPartOf:
        - entity: "IfcWall"
          relation: "IFCRELVOIDSELEMENT IFCRELFILLSELEMENT"
```

Element with Classification Requirements:
```yaml
ids:
  ifcVersion: "IFC4"
  rules:
    - name: "Beam Classification"
      entity: "IfcBeam"
      requiredClassifications:
        - system: "Uniclass"
          value: "Ss_20_10_45"
          uri: "https://uniclass2015.classification.bimstandards.org.uk/"
```

Material Requirements:
```yaml
ids:
  ifcVersion: "IFC4"
  rules:
    - name: "Steel Column"
      entity: "IfcColumn"
      requiredMaterials:
        - value: "Steel"
          uri: "https://material.library/steel"
```

## 📖 IDS-Light Concepts & Syntax Guide

### What is IDS-Light?

IDS-Light is a **human-friendly YAML/JSON format** for authoring buildingSMART [Information Delivery Specifications (IDS)](https://www.buildingsmart.org/standards/bsi-standards/information-delivery-specification/). Instead of writing verbose XML by hand, you describe your building requirements in readable YAML that gets automatically converted to standards-compliant IDS 1.0 XML.

**Why IDS-Light exists:**
- ✏️ **Readable**: YAML is much easier to read and write than XML
- ⚡ **Fast**: Author requirements 10x faster with autocomplete and validation
- 🛡️ **Validated**: JSON Schema ensures correctness before conversion
- 🎯 **Focused**: Only the fields you need, with smart defaults
- 🔄 **Standards Compliant**: Generates perfect IDS 1.0 XML every time

### Core Concepts

#### 🏗️ **Applicability vs Requirements**

IDS rules have two main parts:

**Applicability** (What elements does this rule apply to?)
- Defines which IFC elements the rule targets
- Uses facets like `entity`, `partOf`, `classifications`, `materials`
- Acts as a filter to select elements from the model

**Requirements** (What must these elements satisfy?)
- Defines constraints that matching elements must meet
- Uses facets like `properties`, `attributes`, `quantities`, `requiredPartOf`, etc.
- Specifies the actual validation criteria

```yaml
rules:
  - name: "Fire Doors in Building Core"
    # Applicability: Which doors? (filter)
    entity: "IfcDoor"
    partOf:
      - entity: "IfcBuilding"
        predefinedType: "CORE"  # Only doors in building core

    # Requirements: What must they satisfy? (constraints)
    requiredPartOf:
      - entity: "IfcWall"       # Must be hosted by wall
    properties:
      - name: "Pset_DoorCommon.FireRating"
        presence: "required"    # Must have fire rating
```

#### 🧩 **Facets: The Building Blocks**

IDS uses **facets** to describe different aspects of building elements:

| Facet | Purpose | Used In |
|-------|---------|---------|
| `entity` | IFC class (IfcDoor, IfcWall, etc.) | Applicability |
| `partOf` | Structural relationships | Both |
| `classification` | Classification systems | Both |
| `material` | Material specifications | Both |
| `attribute` | Direct IFC attributes | Requirements |
| `property` | IFC property sets | Requirements |
| `quantity` | IFC quantity sets | Requirements |

#### 🎯 **Cardinality: Required, Optional, Prohibited**

Every requirement facet supports **cardinality** to specify how many times it should appear:

```yaml
properties:
  - name: "Pset_DoorCommon.FireRating"
    presence: "required"     # Must exist (default)
  - name: "Pset_DoorCommon.AcousticRating"
    presence: "optional"     # May exist
  - name: "Pset_DoorCommon.ObsoleteProperty"
    presence: "prohibited"   # Must NOT exist
```

### Detailed Syntax Guide

#### 📋 **Top-Level Structure**

```yaml
ids:
  title: "Building Requirements v1.0"    # Optional: Document title
  description: "Fire safety requirements" # Optional: Description
  author: "architect@company.com"        # Optional: Will normalize to email
  date: "2025-01-15"                     # Optional: ISO date
  ifcVersion: "IFC4"                     # Required: IFC2X3 | IFC4 | IFC4X3_ADD2
  rules:                                 # Required: Array of rules
    - name: "Rule Name"
      entity: "IfcClass"
      # ... rule content
```

#### 🏢 **Applicability Facets**

Define which building elements this rule applies to:

**Entity (Required)**
```yaml
entity: "IfcDoor"                    # IFC class name
predefinedType: "DOOR"               # Optional: IFC predefined type
```

**PartOf Relationships**
```yaml
partOf:
  - entity: "IfcBuilding"                    # Must be part of building
    relation: "IFCRELCONTAINEDINSPATIALSTRUCTURE"
    instructions: "Element must be inside building envelope"
  - entity: "IfcSpace"                       # Must be part of space
    predefinedType: "OFFICE"
```

**Supported Relations:**
- `IFCRELAGGREGATES` - Aggregation relationships
- `IFCRELASSIGNSTOGROUP` - Group assignments
- `IFCRELCONTAINEDINSPATIALSTRUCTURE` - Spatial containment
- `IFCRELNESTS` - Nesting relationships
- `IFCRELVOIDSELEMENT IFCRELFILLSELEMENT` - Void/fill relationships

**Classification Filters**
```yaml
classifications:
  - system: "Uniclass"                        # Classification system
    value: "EF_25_10"                        # Specific code
    uri: "https://uniclass2015.classification.bimstandards.org.uk/"
    instructions: "Must follow Uniclass 2015"
```

**Material Filters**
```yaml
materials:
  - value: "Steel"                           # Material name
    uri: "https://material.library/steel"    # Reference URI
    instructions: "Structural steel only"
```

#### 📏 **Requirements Facets**

Define what constraints must be satisfied:

**Attributes**
```yaml
attributes:
  - name: "Name"                             # IFC attribute name
    datatype: "string"                      # Data type
    presence: "required"                    # Cardinality
    allowed_values: ["Main Entrance", "Side Entrance"]
    pattern: "^[A-Z][a-z]+"                 # Regex validation
    instructions: "Descriptive name required"
```

**Properties**
```yaml
properties:
  - name: "Pset_DoorCommon.FireRating"       # Pset.BaseName format
    datatype: "string"
    presence: "required"
    allowed_values: ["EI30", "EI60", "EI90"]
    uri: "https://bsdd.buildingsmart.org/"
    instructions: "Fire resistance rating"
```

**Quantities**
```yaml
quantities:
  - name: "Qto_WallBaseQuantities.Width"     # Qto.BaseName format
    datatype: "length"                      # Auto-guessed if omitted
    presence: "required"
    instructions: "Wall thickness measurement"
```

**Required Structural Relationships**
```yaml
requiredPartOf:
  - entity: "IfcWall"
    relation: "IFCRELVOIDSELEMENT IFCRELFILLSELEMENT"
    instructions: "Must be hosted by structural wall"
```

**Required Classifications**
```yaml
requiredClassifications:
  - system: "OmniClass"
    value: "23-13 11 13"
    uri: "https://www.omniclass.org/"
    instructions: "Structural steel classification required"
```

**Required Materials**
```yaml
requiredMaterials:
  - value: "Concrete"
    uri: "https://material.library/concrete"
    instructions: "Must be cast-in-place concrete"
```

### 🎨 **Advanced Examples**

#### **Multi-Facet Door Requirements**

```yaml
- name: "Fire Rated Doors in Stairwells"
  entity: "IfcDoor"

  # Applicability: Only doors in stairwell spaces
  partOf:
    - entity: "IfcSpace"
      predefinedType: "STAIRWELL"

  # Requirements: Comprehensive constraints
  requiredPartOf:
    - entity: "IfcWall"
      instructions: "Must be properly hosted by wall"
  requiredClassifications:
    - system: "Uniclass"
      value: "EF_25_30"
      instructions: "Standard door classification"
  requiredMaterials:
    - value: "Steel"
      instructions: "Fire-rated steel construction"
  properties:
    - name: "Pset_DoorCommon.FireRating"
      datatype: "string"
      presence: "required"
      allowed_values: ["EI30", "EI60", "EI90", "EI120"]
      instructions: "Minimum EI30 fire rating required"
    - name: "Pset_DoorCommon.ThermalTransmittance"
      datatype: "thermaltransmittance"
      presence: "required"
      instructions: "U-value must be calculated"
  attributes:
    - name: "Name"
      datatype: "string"
      presence: "required"
      pattern: "^(Fire Door|Emergency Exit) .+"
      instructions: "Must identify as fire/emergency door"
```

#### **Structural Element Classification**

```yaml
- name: "Structural Steel Beams"
  entity: "IfcBeam"

  # Applicability: All beams (no filters)
  # Requirements: Must be properly classified and quantified

  requiredClassifications:
    - system: "Uniclass"
      value: "Ss_20_10"
      uri: "https://uniclass2015.classification.bimstandards.org.uk/"
      instructions: "Must be classified as structural steelwork"
    - system: "eBKP"
      value: "TRAGWERK"
      instructions: "German structural classification"

  requiredMaterials:
    - value: "Steel"
      uri: "https://material.library/structural-steel"
      instructions: "Must be structural steel grade"

  properties:
    - name: "Pset_BeamCommon.SectionType"
      datatype: "string"
      presence: "required"
      instructions: "Beam section designation required"
    - name: "Pset_BeamCommon.Span"
      datatype: "length"
      presence: "required"
      instructions: "Beam span must be specified"

  quantities:
    - name: "Qto_BeamBaseQuantities.Length"
      datatype: "length"
      presence: "required"
      instructions: "Total beam length for quantity take-off"
    - name: "Qto_BeamBaseQuantities.CrossSectionArea"
      datatype: "area"
      presence: "required"
      instructions: "Cross-section area for weight calculation"
```

#### **Space Planning Requirements**

```yaml
- name: "Office Spaces"
  entity: "IfcSpace"

  # Applicability: Only office spaces
  classifications:
    - system: "Uniclass"
      value: "EF_70_10_25"  # Office space classification

  # Requirements: Space must meet office standards
  attributes:
    - name: "Name"
      datatype: "string"
      presence: "required"
      pattern: "^Office .+"
      instructions: "Must be clearly identified as office space"

  properties:
    - name: "Pset_SpaceCommon.OccupancyType"
      datatype: "string"
      presence: "required"
      allowed_values: ["OFFICE", "MEETING", "OPEN_PLAN"]
      instructions: "Specific occupancy type required"

  quantities:
    - name: "Qto_SpaceBaseQuantities.NetFloorArea"
      datatype: "area"
      presence: "required"
      instructions: "Net area for occupancy calculations"
    - name: "Qto_SpaceBaseQuantities.FinishCeilingHeight"
      datatype: "length"
      presence: "required"
      instructions: "Finished ceiling height for comfort analysis"
```

### 💡 **Best Practices**

#### **🎯 Naming Conventions**
- Use descriptive rule names: `"Fire Doors in Corridors"` not `"Door Rule 1"`
- Follow IFC naming: `IfcDoor`, `IfcWall`, `IfcSpace` (CamelCase)
- Use standard property sets: `Pset_DoorCommon`, `Qto_WallBaseQuantities`

#### **📊 Cardinality Choices**
- **Required**: Mandatory for compliance (most common)
- **Optional**: Recommended but not mandatory
- **Prohibited**: Not allowed (use carefully)

#### **🔗 URI References**
- Link to classification systems: Uniclass, OmniClass, eBKP
- Reference material libraries when available
- Point to company standards or building codes

#### **📝 Instructions**
- Write clear guidance for BIM authors
- Explain why requirements exist (business logic)
- Include measurement units when relevant

#### **🧩 Facet Organization**
- Put most restrictive filters first in applicability
- Group related requirements together
- Use comments (`#`) to organize complex rules

### 🚀 **Quick Start Patterns**

**Simple Property Check:**
```yaml
ids:
  ifcVersion: "IFC4"
  rules:
    - name: "All doors need fire rating"
      entity: "IfcDoor"
      properties:
        - name: "Pset_DoorCommon.FireRating"
          presence: "required"
```

**Classification-Based Filtering:**
```yaml
ids:
  ifcVersion: "IFC4"
  rules:
    - name: "External walls only"
      entity: "IfcWall"
      classifications:
        - system: "Uniclass"
          value: "EF_25_10"  # External wall classification
      quantities:
        - name: "Qto_WallBaseQuantities.NetSideArea"
          presence: "required"
```

**Material Requirements:**
```yaml
ids:
  ifcVersion: "IFC4"
  rules:
    - name: "Steel structure"
      entity: "IfcColumn"
      requiredMaterials:
        - value: "Steel"
      properties:
        - name: "Pset_ColumnCommon.SectionType"
          presence: "required"
```

---

**Ready to create your first IDS?** Start with simple rules and gradually add complexity. Use the live validation to catch errors instantly!

## IDS‑Light syntax

This editor consumes a compact YAML/JSON format called “IDS‑Light” and converts it to official IDS 1.0 XML. This section documents the full input syntax so you can author confidently.

### Top‑level structure

```yaml
ids:
  title: string                     # Optional, shown in <ids:info>
  description: string               # Optional, shown in <ids:info>
  author: string                    # Optional; normalized to email if no @
  date: YYYY-MM-DD                  # Optional; e.g. 2025-01-15
  ifcVersion: IFC2X3 | IFC4 | IFC4X3_ADD2  # Required per specification
  rules:                            # Required; 1..n rules
    - ...
```

### Rule object

Each rule becomes one `<ids:specification>`.

```yaml
- name: string                      # Optional display name; defaults to entity
  entity: string                    # Required IFC class, e.g. "IfcDoor"
  predefinedType: string            # Optional IFC PredefinedType literal

  # Applicability facets (what elements this rule applies to)
  partOf:                           # Optional 0..n structural relationships
    - entity: string                # IFC entity name (e.g., "IfcBuilding", "IfcSpace")
      predefinedType: string        # Optional predefined type
      relation: string              # Optional IFC relationship type
      instructions: string          # Optional author instructions
  classifications:                  # Optional 0..n classification constraints
    - system: string                # Classification system (e.g., "Uniclass", "OmniClass")
      value: string                 # Optional classification value/code
      uri: string                   # Optional URI reference
      instructions: string          # Optional author instructions
  materials:                        # Optional 0..n material constraints
    - value: string                 # Optional material specification
      uri: string                   # Optional URI reference
      instructions: string          # Optional author instructions

  # Requirements facets (what requirements apply to matching elements)
  attributes:                       # Optional 0..n
    - { name, datatype, presence, allowed_values, pattern, uri, instructions }
  properties:                       # Optional 0..n
    - { name, datatype, presence, allowed_values, pattern, uri, instructions }
  quantities:                       # Optional 0..n
    - { name, datatype?, presence, allowed_values, pattern, uri, instructions }
  requiredPartOf:                   # Optional 0..n required structural relationships
    - entity: string                # IFC entity name
      predefinedType: string        # Optional predefined type
      relation: string              # Optional IFC relationship type
      instructions: string          # Optional author instructions
  requiredClassifications:          # Optional 0..n required classifications
    - system: string                # Classification system
      value: string                 # Optional classification value/code
      uri: string                   # Optional URI reference
      instructions: string          # Optional author instructions
  requiredMaterials:                # Optional 0..n required materials
    - value: string                 # Optional material specification
      uri: string                   # Optional URI reference
      instructions: string          # Optional author instructions

  # Legacy classification field for backward compatibility
  classification:                   # Optional; legacy support
    system: string
    value: string                   # Optional
    uri: string                     # Optional (URL)
```

Notes:
- `entity` should use IFC CamelCase (e.g., `IfcDoor`, `IfcSpace`). The generated XML uses uppercase (`IFCDOOR`, `IFCSPACE`).
- `predefinedType` is passed through to XML when present.
- **Applicability facets** define what elements the rule applies to (partOf, classifications, materials).
- **Requirements facets** define what requirements apply to matching elements (attributes, properties, quantities, requiredPartOf, requiredClassifications, requiredMaterials).
- `relation` values include: `IFCRELAGGREGATES`, `IFCRELASSIGNSTOGROUP`, `IFCRELCONTAINEDINSPATIALSTRUCTURE`, `IFCRELNESTS`, `IFCRELVOIDSELEMENT IFCRELFILLSELEMENT`.
- `instructions` fields provide guidance to BIM authors.

### Attribute items

```yaml
attributes:
  - name: string                    # IFC attribute name, e.g. "Name"
    datatype:                       # See Datatypes below
      string | boolean | integer | number | length | area | volume | count | date | datetime | time
    presence: required | optional | prohibited
    allowed_values: [ ... ]         # Optional enumeration list
    pattern: "^regex$"              # Optional regex (string)
    uri: "https://..."              # Optional reference
    instructions: string            # Optional author instructions
```

### Property items

```yaml
properties:
  - name: "Pset_DoorCommon.FireRating"   # "Pset_*.BaseName" required
    datatype:                             # Includes measure shortcuts
      string | boolean | integer | number | length | area | volume | count | date | datetime | time |
      thermaltransmittance | volumetricflowrate | power | electricvoltage
    presence: required | optional | prohibited
    allowed_values: [ ... ]
    pattern: "^regex$"
    uri: "https://..."
    instructions: string                  # Optional author instructions
```

Property names must be splitable into `Pset` and `BaseName` by a single dot. Examples:
- `Pset_DoorCommon.FireRating`
- `Pset_ConcreteElementGeneral.StrengthClass`

### Quantity items

```yaml
quantities:
  - name: "Qto_SpaceBaseQuantities.NetFloorArea"  # "Qto_*.BaseName"
    datatype: area                                 # Optional; see guessing below
    presence: required | optional | prohibited
    allowed_values: [ ... ]                        # Optional enumeration list
    pattern: "^regex$"                             # Optional regex (string)
    uri: "https://..."                             # Optional reference
    instructions: string                           # Optional author instructions
```

If `datatype` is omitted, a best‑effort guess is used from the base name:
- Contains `width|thickness|length` → `length`
- Contains `area` → `area`
- Contains `volume` → `volume`
- Otherwise → `number`

### Presence → XML cardinality

`presence: required|optional|prohibited` maps to the IDS `cardinality` attribute with the same values. When `presence` is omitted, `required` is assumed.

### Datatypes → IFC defined types

The editor maps human‑readable types to IFC defined types in XML:

```text
string → IFCLABEL
boolean → IFCBOOLEAN
integer → IFCINTEGER
number → IFCREAL
length → IFCLENGTHMEASURE
area → IFCAREAMEASURE
volume → IFCVOLUMEMEASURE
count → IFCCOUNTMEASURE
date → IFCDATE
datetime → IFCDATETIME
time → IFCTIME
thermaltransmittance → IFCTHERMALTRANSMITTANCEMEASURE
volumetricflowrate → IFCVOLUMETRICFLOWRATEMEASURE
power → IFCPOWERMEASURE
electricvoltage → IFCELECTRICVOLTAGEMEASURE
```

### Author normalization

If `author` does not contain `@`, it is normalized as `<author>@ids-light.com` to satisfy schema constraints.

### Full example (complete facet support)

```yaml
ids:
  title: "Complete Building Requirements (IDS-Light)"
  description: "Comprehensive design requirements with all facet types"
  author: "Architect"
  date: "2025-01-15"
  ifcVersion: "IFC4"
  rules:
    - name: "Door with Structural & Classification Requirements"
      entity: "IfcDoor"
      # Applicability: Doors that are part of buildings
      partOf:
        - entity: "IfcBuilding"
          relation: "IFCRELCONTAINEDINSPATIALSTRUCTURE"
      # Requirements: Must be hosted by walls and have specific classifications/materials
      requiredPartOf:
        - entity: "IfcWall"
          relation: "IFCRELVOIDSELEMENT IFCRELFILLSELEMENT"
          instructions: "Door must be hosted by a wall element"
      requiredClassifications:
        - system: "Uniclass"
          value: "EF_25_30"
          uri: "https://uniclass2015.classification.bimstandards.org.uk/"
          instructions: "Door must be classified under Uniclass system"
      requiredMaterials:
        - value: "Wood"
          uri: "https://material.library/wood"
          instructions: "Door must be made of wood"
      properties:
        - name: "Pset_DoorCommon.FireRating"
          datatype: "string"
          presence: "required"
          allowed_values: ["EI30", "EI60", "EI90"]
          instructions: "Fire rating must be one of the approved values"

    - name: "Structural Beam Requirements"
      entity: "IfcBeam"
      requiredClassifications:
        - system: "OmniClass"
          value: "23-13 11 13"
          uri: "https://www.omniclass.org/"
          instructions: "Beam must have OmniClass structural classification"
      requiredMaterials:
        - value: "Steel"
          instructions: "Beam must be made of structural steel"
      properties:
        - name: "Pset_BeamCommon.SectionType"
          datatype: "string"
          presence: "required"
          instructions: "Beam section type must be specified"
      quantities:
        - name: "Qto_BeamBaseQuantities.Length"
          datatype: "length"
          presence: "required"
          instructions: "Beam length must be quantifiable"

    - name: "Space Classification & Area"
      entity: "IfcSpace"
      classifications:
        - system: "Uniclass"
          value: "EF_70_10"
      attributes:
        - name: "Name"
          datatype: "string"
          presence: "required"
          instructions: "Space must have a descriptive name"
      properties:
        - name: "Pset_SpaceCommon.OccupancyType"
          datatype: "string"
          presence: "required"
          instructions: "Space occupancy type must be specified"
      quantities:
        - name: "Qto_SpaceBaseQuantities.NetFloorArea"
          datatype: "area"
          presence: "required"
          instructions: "Net floor area must be quantifiable"
```

Tip: Prefer standard `Pset_*`/`Qto_*` names and valid base names to pass ids‑lib auditing.

## How it works

- `public/workers/idsWorker.js`: Parses YAML/JSON, validates (JSON‑Schema), converts to IDS XML off‑thread
- `lib/ids-light/index.ts`: Shared converter with strong typing
- `app/api/validate-ids/route.ts`: Proxy to Cloud Run ids‑lib (`/ids-audit`)
- `components/editor/*`: UI (tabs, panes, validation, download)

### XML essentials

- Root `ids:ids` includes `xsi:schemaLocation="http://standards.buildingsmart.org/IDS http://standards.buildingsmart.org/IDS/1.0/ids.xsd"`
- Info: `title`, `description`, `author` normalized to email (e.g., `idseditor@ids-light.com`), `date`
- Specification: `name`, `ifcVersion` (IFC2X3 | IFC4 | IFC4X3_ADD2)
- Applicability: `ids:entity` plus optional `ids:partOf`, `ids:classification`, `ids:material` facets
- Requirements: attributes/properties/quantities/partOf/classifications/materials with `cardinality` (`required|optional|prohibited`)
- Data types mapping: `boolean→IFCBOOLEAN`, `length→IFCLENGTHMEASURE`, `area→IFCAREAMEASURE`, `thermaltransmittance→IFCTHERMALTRANSMITTANCEMEASURE`, `volumetricflowrate→IFCVOLUMETRICFLOWRATEMEASURE`, `power→IFCPOWERMEASURE`, `electricvoltage→IFCELECTRICVOLTAGEMEASURE`

## Remote validation (ids‑lib)

Optional: add `.env.local` at the repo root to enable Validation tab:
```bash
IFCTESTER_API_URL=<your-cloud-run-url>
IFCTESTER_API_KEY=<your-api-key>
```
The app will POST XML via `/api/validate-ids` to `${IFCTESTER_API_URL}/ids-audit?include_report=true&report_format=json` with `x-api-key`.

Reach out for API key...

## Deployment

### Vercel

- `vercel.json` uses `pnpm install --no-frozen-lockfile` and `pnpm build`
- Configure env vars in Vercel project settings

### Cloud Run (ids‑lib API)

Use your existing service and set the URL and API key in `.env.local`.

## Troubleshooting

- Schema error (306) unknown attribute:
  - Do not emit `minOccurs`/`maxOccurs` in instance XML; remove any `ids:version` attributes
- Invalid cardinality on `applicability` (301):
  - Ensure exactly one facet → a single `ids:entity` in applicability; do not duplicate entity in requirements
- Invalid entity name:
  - Use uppercase IFC class names in XML (`IFCDOOR`, `IFCSPACE`, `IFCWALL`)
- Author pattern invalid:
  - Author is normalized to an email if missing `@`
- Vercel frozen lockfile:
  - Lockfile synced; `vercel.json` opts out with `--no-frozen-lockfile`

## Scripts

```bash
pnpm build
pnpm dev
pnpm start
pnpm test
pnpm run test:watch
pnpm run test:coverage
```

## Tech stack

- Next.js 14, TypeScript, Tailwind CSS 4, shadcn/ui
- YAML (yaml), AJV + ajv-formats, xmlbuilder2
- Jest + Testing Library

## License

AGPL‑3.0. See `LICENSE`.

## Contributing

Issues and PRs are welcome. Please add tests for behavior changes.
