"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Book, Zap, Shield, Target, Puzzle, CheckCircle, AlertTriangle, Info, Link, Code, Settings, FileText, Building, Layers, Wrench, Users } from "lucide-react"
import { CodeBlock } from "@/components/docs/CodeBlock"
import { InteractiveExample } from "@/components/docs/InteractiveExample"
import { ConceptCard } from "@/components/docs/ConceptCard"
import { ProgressiveDisclosure } from "@/components/docs/ProgressiveDisclosure"
import { SyntaxReference } from "@/components/docs/SyntaxReference"

export default function DocsPage() {
    const router = useRouter()

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId)
        element?.scrollIntoView({ behavior: "smooth" })
    }

    return (
        <div className="min-h-dvh bg-background text-foreground">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Editor
                        </button>
                        <div className="flex items-center gap-2">
                            <Book className="w-5 h-5 text-primary" />
                            <h1 className="font-semibold text-lg">IDS-Light Documentation</h1>
                        </div>
                    </div>

                    {/* Quick Navigation */}
                    <nav className="hidden md:flex items-center gap-1 text-sm">
                        <button
                            onClick={() => scrollToSection('what-is-ids-light')}
                            className="px-3 py-1 rounded-md hover:bg-accent transition-colors"
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => scrollToSection('core-concepts')}
                            className="px-3 py-1 rounded-md hover:bg-accent transition-colors"
                        >
                            Concepts
                        </button>
                        <button
                            onClick={() => scrollToSection('syntax-guide')}
                            className="px-3 py-1 rounded-md hover:bg-accent transition-colors"
                        >
                            Syntax
                        </button>
                        <button
                            onClick={() => scrollToSection('examples')}
                            className="px-3 py-1 rounded-md hover:bg-accent transition-colors"
                        >
                            Examples
                        </button>
                        <button
                            onClick={() => scrollToSection('best-practices')}
                            className="px-3 py-1 rounded-md hover:bg-accent transition-colors"
                        >
                            Best Practices
                        </button>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="docs max-w-4xl mx-auto px-4 py-8 space-y-12">

                {/* Hero Section */}
                <section id="what-is-ids-light" className="text-center space-y-6">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                            <Book className="w-4 h-4" />
                            Complete Guide
                        </div>
                        <h2 className="text-3xl font-bold">What is IDS-Light?</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            IDS-Light is a <strong>human-friendly YAML/JSON format</strong> for authoring buildingSMART{" "}
                            <a href="https://www.buildingsmart.org/standards/bsi-standards/information-delivery-specification-ids/"
                                className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                                Information Delivery Specifications (IDS)
                            </a>.
                            Instead of writing verbose XML by hand, you describe your building requirements in readable YAML that gets automatically converted to standards-compliant IDS 1.0 XML.
                        </p>
                    </div>

                    {/* Benefits Grid */}
                    <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                        <div className="bg-card p-6 rounded-lg border border-border space-y-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="font-semibold">✏️ Readable</h3>
                            <p className="text-sm text-muted-foreground">YAML is much easier to read and write than XML</p>
                        </div>
                        <div className="bg-card p-6 rounded-lg border border-border space-y-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="font-semibold">⚡ Fast</h3>
                            <p className="text-sm text-muted-foreground">Author requirements 10x faster with autocomplete and validation</p>
                        </div>
                        <div className="bg-card p-6 rounded-lg border border-border space-y-3">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="font-semibold">🛡️ Validated</h3>
                            <p className="text-sm text-muted-foreground">JSON Schema ensures correctness before conversion</p>
                        </div>
                        <div className="bg-card p-6 rounded-lg border border-border space-y-3">
                            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h3 className="font-semibold">🎯 Focused</h3>
                            <p className="text-sm text-muted-foreground">Only the fields you need, with smart defaults</p>
                        </div>
                        <div className="bg-card p-6 rounded-lg border border-border space-y-3">
                            <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                            </div>
                            <h3 className="font-semibold">🔄 Standards Compliant</h3>
                            <p className="text-sm text-muted-foreground">Generates perfect IDS 1.0 XML every time</p>
                        </div>
                        <div className="bg-card p-6 rounded-lg border border-border space-y-3">
                            <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                                <Layers className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                            </div>
                            <h3 className="font-semibold">🎨 Complete Facet Support</h3>
                            <p className="text-sm text-muted-foreground">partOf relationships, classifications, materials with cardinality</p>
                        </div>
                    </div>
                </section>

                {/* Core Concepts */}
                <section id="core-concepts" className="space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold">Core Concepts</h2>
                        <p className="text-muted-foreground">Understanding the fundamental building blocks of IDS</p>
                    </div>

                    {/* Applicability vs Requirements */}
                    <ConceptCard
                        icon={Building}
                        title="Applicability vs Requirements"
                        description="IDS rules have two main parts that work together"
                        variant="primary"
                    >
                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Applicability (What elements apply to?)</h4>
                                <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
                                    <li>• Defines which IFC elements the rule targets</li>
                                    <li>• Uses facets like entity, partOf, classifications, materials</li>
                                    <li>• Acts as a filter to select elements from the model</li>
                                </ul>
                            </div>
                            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Requirements (What must they satisfy?)</h4>
                                <ul className="text-sm space-y-1 text-green-800 dark:text-green-200">
                                    <li>• Defines constraints that matching elements must meet</li>
                                    <li>• Uses facets like properties, attributes, quantities, requiredPartOf, etc.</li>
                                    <li>• Specifies the actual validation criteria</li>
                                </ul>
                            </div>
                        </div>

                        <InteractiveExample
                            title="Rule Anatomy"
                            description="See how applicability and requirements work together"
                            code={`rules:
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
        presence: "required"    # Must have fire rating`}
                            highlights={[
                                {
                                    lines: ["4", "5", "6", "7"],
                                    color: "blue",
                                    label: "Applicability Filter",
                                    description: "These lines define WHICH elements the rule applies to. Like a WHERE clause in SQL, they filter the model to select only doors in building cores."
                                },
                                {
                                    lines: ["10", "11", "12", "13", "14"],
                                    color: "green",
                                    label: "Requirements",
                                    description: "These lines define WHAT the selected elements must satisfy. They specify the actual validation constraints that matching doors must meet."
                                }
                            ]}
                            explanation="Click the highlight buttons above to see how different parts of the rule work together. Applicability filters which elements to check, while requirements define what they must satisfy."
                            tips={[
                                "Applicability acts like a WHERE clause in SQL - it selects which elements to check",
                                "Requirements define the actual validation rules for selected elements",
                                "You can have multiple facets in both applicability and requirements"
                            ]}
                        />
                    </ConceptCard>

                    {/* Facets Table */}
                    <div className="bg-card p-6 rounded-lg border border-border space-y-4">
                        <div className="flex items-center gap-3">
                            <Puzzle className="w-6 h-6 text-primary" />
                            <h3 className="text-lg font-semibold">Facets: The Building Blocks</h3>
                        </div>
                        <p className="text-muted-foreground">IDS uses facets to describe different aspects of building elements:</p>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left p-2 font-medium">Facet</th>
                                        <th className="text-left p-2 font-medium">Purpose</th>
                                        <th className="text-left p-2 font-medium">Used In</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    <tr>
                                        <td className="p-2 font-mono text-xs">entity</td>
                                        <td className="p-2">IFC class (IfcDoor, IfcWall, etc.)</td>
                                        <td className="p-2">Applicability</td>
                                    </tr>
                                    <tr>
                                        <td className="p-2 font-mono text-xs">partOf</td>
                                        <td className="p-2">Structural relationships</td>
                                        <td className="p-2">Both</td>
                                    </tr>
                                    <tr>
                                        <td className="p-2 font-mono text-xs">classifications</td>
                                        <td className="p-2">Classification systems</td>
                                        <td className="p-2">Both</td>
                                    </tr>
                                    <tr>
                                        <td className="p-2 font-mono text-xs">materials</td>
                                        <td className="p-2">Material specifications</td>
                                        <td className="p-2">Both</td>
                                    </tr>
                                    <tr>
                                        <td className="p-2 font-mono text-xs">attribute</td>
                                        <td className="p-2">Direct IFC attributes</td>
                                        <td className="p-2">Requirements</td>
                                    </tr>
                                    <tr>
                                        <td className="p-2 font-mono text-xs">property</td>
                                        <td className="p-2">IFC property sets</td>
                                        <td className="p-2">Requirements</td>
                                    </tr>
                                    <tr>
                                        <td className="p-2 font-mono text-xs">quantity</td>
                                        <td className="p-2">IFC quantity sets</td>
                                        <td className="p-2">Requirements</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Cardinality */}
                    <ConceptCard
                        icon={Settings}
                        title="Cardinality: Required, Optional, Prohibited"
                        description="Control how many times requirements should appear"
                        variant="default"
                    >
                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                            <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                <h4 className="font-semibold text-green-900 dark:text-green-100">Required</h4>
                                <p className="text-sm text-green-800 dark:text-green-200 mt-1">Must exist (default)</p>
                                <code className="text-xs bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded mt-2 block">presence: "required"</code>
                            </div>
                            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <Info className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">Optional</h4>
                                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">May exist</p>
                                <code className="text-xs bg-yellow-100 dark:bg-yellow-900/50 px-2 py-1 rounded mt-2 block">presence: "optional"</code>
                            </div>
                            <div className="text-center p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                                <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                                <h4 className="font-semibold text-red-900 dark:text-red-100">Prohibited</h4>
                                <p className="text-sm text-red-800 dark:text-red-200 mt-1">Must NOT exist</p>
                                <code className="text-xs bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded mt-2 block">presence: "prohibited"</code>
                            </div>
                        </div>

                        <InteractiveExample
                            title="Cardinality Examples"
                            description="Different presence requirements for the same property"
                            code={`properties:
  - name: "Pset_DoorCommon.FireRating"
    presence: "required"     # Must exist (default)
  - name: "Pset_DoorCommon.AcousticRating"
    presence: "optional"     # May exist
  - name: "Pset_DoorCommon.ObsoleteProperty"
    presence: "prohibited"   # Must NOT exist`}
                            highlights={[
                                {
                                    lines: ["2", "3"],
                                    color: "green",
                                    label: "Required Property",
                                    description: "This property MUST exist on the element. Validation fails if it's missing. Use for critical compliance properties."
                                },
                                {
                                    lines: ["4", "5"],
                                    color: "amber",
                                    label: "Optional Property",
                                    description: "This property MAY exist on the element. Validation passes whether it's present or not. Use for recommended but non-critical properties."
                                },
                                {
                                    lines: ["6", "7"],
                                    color: "red",
                                    label: "Prohibited Property",
                                    description: "This property must NOT exist on the element. Validation fails if it's present. Use to explicitly forbid deprecated or incorrect properties."
                                }
                            ]}
                            explanation="Click the highlight buttons to understand each cardinality type. Each serves a different validation purpose in your IDS requirements."
                            tips={[
                                "Use 'required' for mandatory compliance properties",
                                "Use 'optional' for recommended but not critical properties",
                                "Use 'prohibited' to explicitly forbid deprecated or incorrect properties"
                            ]}
                        />
                    </ConceptCard>

                    {/* Data Types */}
                    <ConceptCard
                        icon={Code}
                        title="Data Types & Validation"
                        description="Understanding how IDS-Light simplifies IFC data types"
                        variant="warning"
                    >
                        <div className="space-y-4">
                            <p className="text-sm">
                                IDS-Light uses simple, human-readable data types like <code>string</code>, <code>power</code>, or <code>length</code>. The editor automatically converts these to the strict, official data types required by the buildingSMART IDS XML schema (e.g., <code>IFCLABEL</code>, <code>IFCPOWERMEASURE</code>, <code>IFCLENGTHMEASURE</code>).
                            </p>
                            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    Common Validation Error
                                </h4>
                                <p className="text-sm text-amber-800 dark:text-amber-200">
                                    Sometimes, the official IDS validator may report an error like <code className="text-xs bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded">Error 103: Invalid dataType 'IFCLABEL' (the only accepted value is 'IFCIDENTIFIER')</code>. This happens when a specific property in the official IFC schema requires a more specific string type (like an ID) than the one inferred.
                                </p>
                                <p className="text-sm text-amber-800 dark:text-amber-200 mt-2">
                                    The converter tries its best to map these correctly, but the IFC schema can be very specific. If you see this, it indicates a mismatch between the property's requirements and the provided data type.
                                </p>
                            </div>

                            <p className="text-sm font-medium">Common Data Type Mappings:</p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-left">
                                        <tr className="border-b">
                                            <th className="p-2 font-medium">IDS-Light Type</th>
                                            <th className="p-2 font-medium">Official IDS XML Type</th>
                                            <th className="p-2 font-medium">Example</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b">
                                            <td className="p-2"><code>string</code></td>
                                            <td className="p-2"><code>IFCLABEL</code> or <code>IFCIDENTIFIER</code></td>
                                            <td className="p-2">"Fire Door"</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="p-2"><code>boolean</code></td>
                                            <td className="p-2"><code>IFCBOOLEAN</code></td>
                                            <td className="p-2">true</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="p-2"><code>integer</code></td>
                                            <td className="p-2"><code>IFCINTEGER</code></td>
                                            <td className="p-2">120</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="p-2"><code>number</code></td>
                                            <td className="p-2"><code>IFCREAL</code></td>
                                            <td className="p-2">10.5</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="p-2"><code>length</code></td>
                                            <td className="p-2"><code>IFCLENGTHMEASURE</code></td>
                                            <td className="p-2">2.5</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="p-2"><code>area</code></td>
                                            <td className="p-2"><code>IFCAREAMEASURE</code></td>
                                            <td className="p-2">20.0</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2"><code>power</code></td>
                                            <td className="p-2"><code>IFCPOWERMEASURE</code></td>
                                            <td className="p-2">2500.0</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </ConceptCard>
                </section>

                {/* Syntax Guide */}
                <section id="syntax-guide" className="space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold">Detailed Syntax Guide</h2>
                        <p className="text-muted-foreground">Complete reference for all IDS-Light features</p>
                    </div>

                    {/* Top Level Structure */}
                    <ConceptCard
                        icon={FileText}
                        title="Top-Level Structure"
                        description="The root structure of every IDS-Light document"
                        variant="default"
                    >
                        <InteractiveExample
                            title="Document Structure"
                            description="Essential fields for every IDS document"
                            code={`ids:
  title: "Building Requirements v1.0"    # Optional: Document title
  description: "Fire safety requirements" # Optional: Description
  author: "architect@company.com"        # Optional: Will normalize to email
  date: "2025-01-15"                     # Optional: ISO date
  ifcVersion: "IFC4"                     # Required: IFC2X3 | IFC4 | IFC4X3_ADD2
  rules:                                 # Required: Array of rules
    - name: "Rule Name"
      entity: "IfcClass"
      # ... rule content`}
                            highlights={[
                                {
                                    lines: ["2", "3", "4", "5"],
                                    color: "blue",
                                    label: "Optional Metadata",
                                    description: "These fields provide documentation and context but are not required for validation. They help organize and describe your IDS specification."
                                },
                                {
                                    lines: ["6"],
                                    color: "red",
                                    label: "Required: IFC Version",
                                    description: "This field is REQUIRED and specifies which IFC schema version your rules target. Must be one of: IFC2X3, IFC4, or IFC4X3_ADD2."
                                },
                                {
                                    lines: ["7", "8", "9", "10"],
                                    color: "green",
                                    label: "Required: Rules Array",
                                    description: "This field is REQUIRED and contains all your validation rules. Each rule defines applicability criteria and requirements."
                                }
                            ]}
                            explanation="Click the highlights to understand which fields are required vs optional. The structure provides both validation logic and documentation."
                            tips={[
                                "Always specify the correct IFC version for your project",
                                "Use descriptive titles and descriptions for better documentation",
                                "Author field will be normalized to email format if @ is missing"
                            ]}
                        />
                    </ConceptCard>

                    {/* Interactive Syntax Reference */}
                    <ConceptCard
                        icon={Building}
                        title="Interactive Syntax Reference"
                        description="Search and explore all available facets and their usage"
                        variant="primary"
                    >
                        <SyntaxReference />
                    </ConceptCard>
                </section>

                {/* Advanced Examples */}
                <section id="examples" className="space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold">Advanced Examples</h2>
                        <p className="text-muted-foreground">Real-world scenarios showing IDS-Light in action</p>
                    </div>

                    {/* Fire Doors Example */}
                    <InteractiveExample
                        title="Multi-Facet Door Requirements"
                        description="A comprehensive example showing all facet types working together"
                        code={`- name: "Fire Rated Doors in Stairwells"
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
      instructions: "Must identify as fire/emergency door"`}
                        highlights={[
                            {
                                lines: ["5", "6", "7"],
                                color: "blue",
                                label: "Applicability Filter",
                                description: "Filters for doors that are contained within stairwell spaces. This narrows down which doors the rule applies to."
                            },
                            {
                                lines: ["10", "11", "12"],
                                color: "purple",
                                label: "Structural Requirements",
                                description: "Requires doors to be properly hosted by walls. The instructions provide context for BIM authors."
                            },
                            {
                                lines: ["13", "14", "15", "16"],
                                color: "amber",
                                label: "Classification Requirements",
                                description: "Requires specific Uniclass classification. This ensures doors are properly categorized in the model."
                            },
                            {
                                lines: ["17", "18", "19"],
                                color: "red",
                                label: "Material Requirements",
                                description: "Requires steel construction for fire-rated performance. Materials must be specified correctly."
                            },
                            {
                                lines: ["20", "21", "22", "23", "24", "25", "26", "27", "28", "29"],
                                color: "green",
                                label: "Property Requirements",
                                description: "Requires specific fire rating and thermal properties. These are critical for compliance validation."
                            },
                            {
                                lines: ["30", "31", "32", "33", "34", "35"],
                                color: "teal",
                                label: "Attribute Requirements",
                                description: "Validates direct IFC attributes like Name using pattern matching. This ensures doors follow proper naming conventions for identification."
                            }
                        ]}
                        explanation="Click the highlight buttons to explore different parts of this comprehensive rule. Each section serves a specific validation purpose."
                        tips={[
                            "Use partOf in applicability to filter which elements the rule applies to",
                            "Combine multiple requirement types for comprehensive validation",
                            "Instructions help BIM authors understand the business logic behind requirements",
                            "Pattern matching in attributes ensures naming conventions are followed",
                            "Attributes validate direct IFC properties like Name, Description, or ObjectType"
                        ]}
                    />

                    {/* Structural Steel Example */}
                    <InteractiveExample
                        title="🏗️ Structural Steel Beams"
                        description="Comprehensive requirements for structural steel elements"
                        code={`- name: "Structural Steel Beams"
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
      instructions: "Cross-section area for weight calculation"`}
                        highlights={[
                            {
                                lines: ["2"],
                                color: "blue",
                                label: "Entity Target",
                                description: "Targets all IfcBeam elements in the model. No additional applicability filters means this rule applies to every beam."
                            },
                            {
                                lines: ["7", "8", "9", "10", "11", "12", "13", "14"],
                                color: "amber",
                                label: "Classification Requirements",
                                description: "Requires beams to have proper structural classifications in both Uniclass and eBKP systems for international compliance."
                            },
                            {
                                lines: ["16", "17", "18", "19"],
                                color: "red",
                                label: "Material Requirements",
                                description: "Ensures all beams are specified as structural steel with proper material references for engineering analysis."
                            },
                            {
                                lines: ["21", "22", "23", "24", "25", "26", "27", "28", "29"],
                                color: "green",
                                label: "Property Requirements",
                                description: "Requires essential beam properties like section type and span for structural design validation."
                            },
                            {
                                lines: ["31", "32", "33", "34", "35", "36", "37", "38", "39"],
                                color: "purple",
                                label: "Quantity Requirements",
                                description: "Ensures quantity take-off data is available for length and cross-sectional area calculations."
                            }
                        ]}
                        explanation="This rule demonstrates comprehensive structural element validation covering classification, materials, properties, and quantities."
                        tips={[
                            "Use multiple classification systems for international projects",
                            "Material requirements ensure proper engineering specifications",
                            "Quantity data is essential for cost estimation and structural analysis"
                        ]}
                    />

                    {/* Office Spaces Example */}
                    <InteractiveExample
                        title="🏢 Office Space Planning"
                        description="Space validation rules for office environments"
                        code={`- name: "Office Spaces"
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
      instructions: "Finished ceiling height for comfort analysis"`}
                        highlights={[
                            {
                                lines: ["2"],
                                color: "blue",
                                label: "Space Entity",
                                description: "Targets IfcSpace elements which represent spatial boundaries and functional areas in the building model."
                            },
                            {
                                lines: ["4", "5", "6"],
                                color: "amber",
                                label: "Applicability Filter",
                                description: "Uses Uniclass classification to filter only office spaces. This ensures the rule only applies to spaces designated as offices."
                            },
                            {
                                lines: ["8", "9", "10", "11", "12", "13"],
                                color: "purple",
                                label: "Naming Requirements",
                                description: "Ensures spaces are properly named with 'Office' prefix using regex pattern matching for clear identification."
                            },
                            {
                                lines: ["14", "15", "16", "17", "18", "19"],
                                color: "green",
                                label: "Occupancy Properties",
                                description: "Validates occupancy type with specific allowed values for proper space function classification."
                            },
                            {
                                lines: ["20", "21", "22", "23", "24", "25", "26", "27", "28"],
                                color: "red",
                                label: "Space Measurements",
                                description: "Requires critical space dimensions for occupancy calculations and building code compliance analysis."
                            }
                        ]}
                        explanation="This rule demonstrates space validation combining classification filters with naming, occupancy, and measurement requirements."
                        tips={[
                            "Use classification in applicability to filter specific space types",
                            "Pattern matching ensures consistent naming conventions",
                            "Quantity requirements enable occupancy and code compliance analysis"
                        ]}
                    />
                </section>

                {/* Best Practices */}
                <section id="best-practices" className="space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold">Best Practices</h2>
                        <p className="text-muted-foreground">Tips for writing effective IDS specifications</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Naming */}
                        <div className="bg-card p-6 rounded-lg border border-border space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                Naming Conventions
                            </h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <span className="block">Use descriptive rule names:</span>
                                        <div className="mt-1 flex flex-wrap items-center gap-2">
                                            <code className="text-xs bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">"Fire Doors in Corridors"</code>
                                            <span className="text-muted-foreground">not</span>
                                            <code className="text-xs bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">"Door Rule 1"</code>
                                        </div>
                                    </div>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <span className="block">Follow IFC naming (CamelCase):</span>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                            <code className="text-xs bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">IfcDoor</code>
                                            <code className="text-xs bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">IfcWall</code>
                                            <code className="text-xs bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">IfcSpace</code>
                                        </div>
                                    </div>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <span className="block">Use standard property sets:</span>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                            <code className="text-xs bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded">Pset_DoorCommon</code>
                                            <code className="text-xs bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded">Qto_WallBaseQuantities</code>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* Cardinality */}
                        <div className="bg-card p-6 rounded-lg border border-border space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Settings className="w-5 h-5 text-primary" />
                                Cardinality Choices
                            </h3>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <strong>Required:</strong> Mandatory for compliance (most common)
                                </li>
                                <li className="flex items-start gap-2">
                                    <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <strong>Optional:</strong> Recommended but not mandatory
                                </li>
                                <li className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                    <strong>Prohibited:</strong> Not allowed (use carefully)
                                </li>
                            </ul>
                        </div>

                        {/* URI References */}
                        <div className="bg-card p-6 rounded-lg border border-border space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Link className="w-5 h-5 text-primary" />
                                URI References
                            </h3>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    Link to classification systems: Uniclass, OmniClass, eBKP
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    Reference material libraries when available
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    Point to company standards or building codes
                                </li>
                            </ul>
                        </div>

                        {/* Instructions */}
                        <div className="bg-card p-6 rounded-lg border border-border space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                Instructions
                            </h3>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    Write clear guidance for BIM authors
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    Explain why requirements exist (business logic)
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    Include measurement units when relevant
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Facet Organization */}
                    <div className="bg-card p-6 rounded-lg border border-border space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Layers className="w-5 h-5 text-primary" />
                            Facet Organization
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                Put most restrictive filters first in applicability
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                Group related requirements together
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                Use comments (<code className="text-xs">#</code>) to organize complex rules
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Quick Start */}
                <section id="quick-start" className="space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold">🚀 Ready to Get Started?</h2>
                        <p className="text-muted-foreground">Start with simple rules and gradually add complexity. Use the live validation to catch errors instantly!</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Simple Check */}
                        <div className="bg-card p-4 rounded-lg border border-border">
                            <h4 className="font-semibold mb-2">Simple Check</h4>
                            <CodeBlock code={`ids:
  ifcVersion: "IFC4"
  rules:
    - name: "All doors must have a fire rating"
      entity: "IfcDoor"
      properties:
        - name: "Pset_DoorCommon.FireRating"
          presence: "required"
`} />
                        </div>

                        {/* Classification Filter */}
                        <div className="bg-card p-4 rounded-lg border border-border">
                            <h4 className="font-semibold mb-2">Classification Filter</h4>
                            <CodeBlock code={`ids:
  ifcVersion: "IFC4"
  rules:
    - name: "External walls must have Uniclass classification"
      entity: "IfcWall"
      classifications:
        - system: "Uniclass"
          value: "EF_25_11" # External wall systems
`} />
                        </div>

                        {/* Material Requirements */}
                        <div className="bg-card p-4 rounded-lg border border-border">
                            <h4 className="font-semibold mb-2">Material Requirements</h4>
                            <CodeBlock code={`ids:
  ifcVersion: "IFC4"
  rules:
    - name: "Steel structure columns must be steel"
      entity: "IfcColumn"
      requiredMaterials:
        - value: "Steel"
`} />
                        </div>
                    </div>

                    <div className="text-center">
                        <button onClick={() => router.push('/')} className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-semibold flex items-center gap-2 mx-auto">
                            <Code className="w-5 h-5" />
                            Open Editor
                        </button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-border bg-card">
                <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
                    <p>IDS-Light Editor • Made with ❤️ by Louis Trümpler • <a href="https://github.com/buildingsmart/IDS" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">buildingSMART IDS</a></p>
                </div>
            </footer>
        </div>
    )
}
