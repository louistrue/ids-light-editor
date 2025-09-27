# IDS-Light Editor

A modern web-based editor for creating and converting IDS-Light configurations to official IDS 1.0 XML format.

## Features

- **YAML/JSON Input**: Write IDS-Light configurations in human-readable YAML or JSON format
- **Real-time Validation**: JSON Schema validation with detailed error reporting
- **XML Conversion**: Convert to official IDS 1.0 XML format
- **Web Worker Processing**: Non-blocking conversion using Web Workers
- **Tokyo Night Theme**: Developer-friendly dark theme with light mode support
- **Copy & Download**: Export generated XML files
- **Local Storage**: Automatic persistence of your work

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Testing

Run the test suite:
\`\`\`bash
npm test
\`\`\`

Run tests in watch mode:
\`\`\`bash
npm run test:watch
\`\`\`

Generate coverage report:
\`\`\`bash
npm run test:coverage
\`\`\`

## Usage

### Basic Example

\`\`\`yaml
ids:
  title: "Campus – Basis (IDS-Light)"
  description: "IfcDoor FireRating; IfcSpace Name/Nutzung/Flaeche; IfcWall Dicke"
  author: "Dozent"
  date: "2025-09-30"
  ifcVersion: "IFC4"
  rules:
    - name: "IfcDoor – FireRating vorhanden"
      entity: "IfcDoor"
      properties:
        - name: "Pset_DoorCommon.FireRating"
          datatype: "string"
          presence: "required"
          allowed_values: ["EI30", "EI60", "EI90"]
\`\`\`

### Course Scenarios

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

## Architecture

### Core Components

- **`lib/ids-light/index.ts`**: Core converter logic with parsing, validation, and XML generation
- **`workers/idsWorker.ts`**: Web Worker for non-blocking processing
- **`components/editor/`**: UI components for the editor interface
- **`lib/download.ts`**: Utility for file downloads

### Data Flow

1. User inputs YAML/JSON in the editor
2. Input is debounced and sent to Web Worker
3. Worker parses, validates, and converts to XML
4. Results are displayed in real-time
5. User can copy or download the generated XML

### Testing

Comprehensive test coverage includes:

- **Parser Tests**: YAML/JSON parsing with error handling
- **Validation Tests**: JSON Schema validation with edge cases
- **Conversion Tests**: XML generation with all IFC data types
- **Integration Tests**: Complete workflow testing
- **Course Scenario Tests**: Specific test cases for doors, spaces, and walls

## Technology Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS v4**: Utility-first styling with Tokyo Night theme
- **shadcn/ui**: Modern UI component library
- **Web Workers**: Background processing
- **YAML**: Human-readable configuration format
- **AJV**: JSON Schema validation
- **XMLBuilder2**: XML generation
- **Jest**: Testing framework

## License

AGPL-3.0 License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Support

For issues and questions, please open a GitHub issue or contact the development team.
