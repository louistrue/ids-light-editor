"use client"

import { useState } from "react"
import { Search, Filter } from "lucide-react"
import { CodeBlock } from "./CodeBlock"

interface SyntaxItem {
  name: string
  type: "applicability" | "requirements" | "both"
  description: string
  example: string
  required?: boolean
  dataTypes?: string[]
}

const syntaxItems: SyntaxItem[] = [
  {
    name: "entity",
    type: "applicability",
    description: "IFC class name (e.g., IfcDoor, IfcWall, IfcSpace)",
    example: `entity: "IfcDoor"
predefinedType: "DOOR"  # Optional`,
    required: true
  },
  {
    name: "partOf",
    type: "both",
    description: "Structural relationships between elements",
    example: `partOf:
  - entity: "IfcBuilding"
    relation: "IFCRELCONTAINEDINSPATIALSTRUCTURE"
    instructions: "Must be inside building envelope"`
  },
  {
    name: "classifications",
    type: "both", 
    description: "Classification system constraints",
    example: `classifications:
  - system: "Uniclass"
    value: "EF_25_10"
    uri: "https://uniclass2015.classification.bimstandards.org.uk/"`
  },
  {
    name: "materials",
    type: "both",
    description: "Material specifications",
    example: `materials:
  - value: "Steel"
    uri: "https://material.library/steel"
    instructions: "Structural steel only"`
  },
  {
    name: "attributes",
    type: "requirements",
    description: "Direct IFC attribute constraints",
    example: `attributes:
  - name: "Name"
    datatype: "string"
    presence: "required"
    allowed_values: ["Main Entrance", "Side Entrance"]`,
    dataTypes: ["string", "boolean", "integer", "number"]
  },
  {
    name: "properties",
    type: "requirements",
    description: "IFC property set constraints",
    example: `properties:
  - name: "Pset_DoorCommon.FireRating"
    datatype: "string"
    presence: "required"
    allowed_values: ["EI30", "EI60", "EI90"]`,
    dataTypes: ["string", "boolean", "integer", "number", "length", "area", "volume", "thermaltransmittance"]
  },
  {
    name: "quantities",
    type: "requirements",
    description: "IFC quantity set constraints",
    example: `quantities:
  - name: "Qto_WallBaseQuantities.Width"
    datatype: "length"
    presence: "required"`,
    dataTypes: ["length", "area", "volume", "count", "number"]
  }
]

export function SyntaxReference() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "applicability" | "requirements">("all")

  const filteredItems = syntaxItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || item.type === filterType || item.type === "both"
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search syntax..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="pl-10 pr-8 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none"
          >
            <option value="all">All Types</option>
            <option value="applicability">Applicability</option>
            <option value="requirements">Requirements</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="grid gap-4">
        {filteredItems.map((item) => (
          <div key={item.name} className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-mono text-lg font-semibold text-primary">{item.name}</h3>
                  {item.required && (
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full">
                      Required
                    </span>
                  )}
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item.type === "applicability" 
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : item.type === "requirements"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                  }`}>
                    {item.type === "both" ? "Applicability & Requirements" : item.type}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
              
              {item.dataTypes && (
                <div className="flex flex-wrap gap-1 mt-3">
                  <span className="text-xs text-muted-foreground">Data types:</span>
                  {item.dataTypes.map((type) => (
                    <code key={type} className="px-1.5 py-0.5 bg-muted text-xs rounded">
                      {type}
                    </code>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4">
              <CodeBlock code={item.example} language="yaml" showCopy={false} />
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No syntax items found matching your search.</p>
        </div>
      )}
    </div>
  )
}

