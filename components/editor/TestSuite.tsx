"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Play, Loader2 } from "lucide-react"

interface TestCase {
  name: string
  description: string
  input: string
  expectedValid: boolean
  expectedErrors?: string[]
}

const testCases: TestCase[] = [
  {
    name: "Valid Basic Property",
    description: "Simple rule with one property requirement",
    input: `ids:
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
          presence: "required"`,
    expectedValid: true,
  },
  {
    name: "Multiple Properties",
    description: "Rule with multiple property requirements",
    input: `ids:
  title: "Multi Property Test"
  ifcVersion: "IFC4"
  rules:
    - name: "Wall Test"
      entity: "IfcWall"
      properties:
        - name: "Pset_WallCommon.IsExternal"
          datatype: "boolean"
          presence: "required"
        - name: "Pset_WallCommon.ThermalTransmittance"
          datatype: "number"
          presence: "optional"`,
    expectedValid: true,
  },
  {
    name: "Mixed Requirements",
    description: "Rule with properties, attributes, and quantities",
    input: `ids:
  title: "Mixed Requirements Test"
  ifcVersion: "IFC4"
  rules:
    - name: "Complex Rule"
      entity: "IfcSpace"
      properties:
        - name: "Pset_SpaceCommon.Reference"
          datatype: "string"
          presence: "required"
      attributes:
        - name: "Name"
          datatype: "string"
          presence: "required"
      quantities:
        - name: "Qto_SpaceBaseQuantities.NetFloorArea"
          datatype: "area"
          presence: "required"`,
    expectedValid: true,
  },
  {
    name: "Missing Entity",
    description: "Rule without entity field should fail",
    input: `ids:
  title: "Missing Entity Test"
  ifcVersion: "IFC4"
  rules:
    - name: "Invalid Rule"
      properties:
        - name: "Pset_Common.Test"
          datatype: "string"
          presence: "required"`,
    expectedValid: false,
    expectedErrors: ["Missing 'entity' field"],
  },
  {
    name: "No Requirements",
    description: "Rule without any properties/attributes/quantities should fail",
    input: `ids:
  title: "No Requirements Test"
  ifcVersion: "IFC4"
  rules:
    - name: "Empty Rule"
      entity: "IfcDoor"`,
    expectedValid: false,
    expectedErrors: ["Must have at least one property, attribute, or quantity requirement"],
  },
  {
    name: "Duplicate Rule Names",
    description: "Rules with duplicate names should fail",
    input: `ids:
  title: "Duplicate Names Test"
  ifcVersion: "IFC4"
  rules:
    - name: "Same Name"
      entity: "IfcDoor"
      properties:
        - name: "Pset_DoorCommon.FireRating"
          datatype: "string"
          presence: "required"
    - name: "Same Name"
      entity: "IfcWindow"
      properties:
        - name: "Pset_WindowCommon.IsExternal"
          datatype: "boolean"
          presence: "required"`,
    expectedValid: false,
    expectedErrors: ["Duplicate rule names found"],
  },
  {
    name: "Invalid YAML Syntax",
    description: "Malformed YAML should fail",
    input: `ids:
  title: "Invalid YAML Test"
  ifcVersion: "IFC4"
  rules:
    - name: "Test Rule"
      entity: "IfcDoor"
      properties:
        - name: "Pset_DoorCommon.FireRating"
          datatype: "string"
          presence: "required"
random_invalid_text_here_12345`,
    expectedValid: false,
    expectedErrors: ["Invalid YAML syntax"],
  },
  {
    name: "Flexible Indentation",
    description: "YAML with non-standard indentation should work",
    input: `ids:
title: "Flexible Indentation Test"
ifcVersion: "IFC4"
rules:
- name: "Flexible Rule"
entity: "IfcDoor"
properties:
- name: "Pset_DoorCommon.FireRating"
datatype: "string"
presence: "required"`,
    expectedValid: true,
  },
]

interface TestResult {
  name: string
  passed: boolean
  error?: string
  actualErrors?: string[]
  expectedValid: boolean
  actualValid: boolean
}

export function TestSuite() {
  const [results, setResults] = useState<TestResult[]>([])
  const [running, setRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string>("")

  const runTests = async () => {
    setRunning(true)
    setResults([])

    const worker = new Worker("/workers/idsWorker.js")
    const testResults: TestResult[] = []

    for (const testCase of testCases) {
      setCurrentTest(testCase.name)

      try {
        const result = await new Promise<any>((resolve) => {
          worker.onmessage = (e) => resolve(e.data)
          worker.postMessage({ type: "convert", text: testCase.input })
        })

        const actualValid = result.ok === true
        const actualErrors = result.errors || []

        let passed = actualValid === testCase.expectedValid

        // If we expected it to fail, check if the error messages match
        if (!testCase.expectedValid && testCase.expectedErrors) {
          const hasExpectedError = testCase.expectedErrors.some((expectedError) =>
            actualErrors.some((actualError: string) => actualError.toLowerCase().includes(expectedError.toLowerCase())),
          )
          passed = passed && hasExpectedError
        }

        testResults.push({
          name: testCase.name,
          passed,
          expectedValid: testCase.expectedValid,
          actualValid,
          actualErrors,
        })
      } catch (error) {
        testResults.push({
          name: testCase.name,
          passed: false,
          error: String(error),
          expectedValid: testCase.expectedValid,
          actualValid: false,
        })
      }
    }

    worker.terminate()
    setResults(testResults)
    setRunning(false)
    setCurrentTest("")
  }

  const passedCount = results.filter((r) => r.passed).length
  const totalCount = results.length

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          IDS Converter Test Suite
          {results.length > 0 && (
            <Badge variant={passedCount === totalCount ? "default" : "destructive"}>
              {passedCount}/{totalCount} passed
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Comprehensive tests for YAML parsing, validation, and XML conversion</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTests} disabled={running} className="w-full">
          {running ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Tests... {currentTest && `(${currentTest})`}
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Run All Tests
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Test Results:</h3>
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {result.passed ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="font-medium">{result.name}</span>
                </div>

                <div className="text-sm text-gray-600 ml-6">
                  Expected: {result.expectedValid ? "Valid" : "Invalid"} | Actual:{" "}
                  {result.actualValid ? "Valid" : "Invalid"}
                </div>

                {!result.passed && (
                  <div className="text-sm text-red-600 ml-6 mt-1">
                    {result.error && <div>Error: {result.error}</div>}
                    {result.actualErrors && result.actualErrors.length > 0 && (
                      <div>Errors: {result.actualErrors.join(", ")}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
