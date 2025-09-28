# IDS‑Light Editor

Create, convert, and validate buildingSMART IDS files from friendly IDS‑Light YAML/JSON. Runs in the browser with instant feedback and optional server‑side auditing.

## Features

- **YAML/JSON Input**: Author IDS‑Light in human‑readable YAML/JSON
- **Live Validation**: JSON‑Schema with clear errors
- **XML Conversion**: Standards‑compliant IDS 1.0 XML
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
  classification:                   # Optional; future use
    system: string
    value: string                   # Optional
    uri: string                     # Optional (URL)
  attributes:                       # Optional 0..n
    - { name, datatype, presence, allowed_values, pattern, uri }
  properties:                       # Optional 0..n
    - { name, datatype, presence, allowed_values, pattern, uri }
  quantities:                       # Optional 0..n
    - { name, datatype?, presence, allowed_values, pattern }
```

Notes:
- `entity` should use IFC CamelCase (e.g., `IfcDoor`, `IfcSpace`). The generated XML uses uppercase (`IFCDOOR`, `IFCSPACE`).
- `predefinedType` is passed through to XML when present.
- `classification` is accepted for forward compatibility; its mapping may evolve with implementers’ agreements.

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

### Full example (mixed facets)

```yaml
ids:
  title: "Architectural Elements (IDS-Light)"
  description: "Design requirements for windows and doors"
  author: "Architect"
  date: "2025-01-15"
  ifcVersion: "IFC4"
  rules:
    - name: "IfcWindow – Thermal Performance"
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
    - name: "IfcDoor – Security & Fire"
      entity: "IfcDoor"
      properties:
        - name: "Pset_DoorCommon.FireRating"
          datatype: "string"
          presence: "required"
        - name: "Pset_DoorCommon.SecurityRating"
          datatype: "string"
          presence: "required"
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
- Applicability: a single `ids:entity` → `ids:name` uses uppercase IFC class (e.g., `IFCDOOR`)
- Requirements: attributes/properties/quantities with `cardinality` (`required|optional|prohibited`)
- Data types mapping: `boolean→IFCBOOLEAN`, `length→IFCLENGTHMEASURE`, `area→IFCAREAMEASURE`, `thermaltransmittance→IFCTHERMALTRANSMITTANCEMEASURE`, `volumetricflowrate→IFCVOLUMETRICFLOWRATEMEASURE`, `power→IFCPOWERMEASURE`, `electricvoltage→IFCELECTRICVOLTAGEMEASURE`

## Remote validation (ids‑lib)

Optional: add `.env.local` at the repo root to enable Validation tab:
```bash
IFCTESTER_API_URL=https://ifctester-service-582506080768.europe-west6.run.app
IFCTESTER_API_KEY=mysecretkey456
```
The app will POST XML via `/api/validate-ids` to `${IFCTESTER_API_URL}/ids-audit?include_report=true&report_format=json` with `x-api-key`.

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
