'use client';

import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import * as monaco from 'monaco-editor';

// IDS-Light language definition
const IDS_LIGHT_LANGUAGE_ID = 'ids-light';

// IFC Entity types for autocompletion
const IFC_ENTITIES = [
    'IfcWall', 'IfcDoor', 'IfcWindow', 'IfcSpace', 'IfcSlab', 'IfcBeam', 'IfcColumn',
    'IfcStair', 'IfcRailing', 'IfcRoof', 'IfcCurtainWall', 'IfcPlate', 'IfcMember',
    'IfcBuildingElement', 'IfcBuildingElementProxy', 'IfcFlowTerminal', 'IfcFlowSegment',
    'IfcFlowFitting', 'IfcFlowController', 'IfcDistributionElement', 'IfcFurnishingElement',
    'IfcElementAssembly', 'IfcTransportElement', 'IfcVirtualElement', 'IfcFeatureElement',
    'IfcOpeningElement', 'IfcProjectionElement', 'IfcSurfaceFeature', 'IfcVoidingFeature'
];

// Property sets for autocompletion
const PROPERTY_SETS = [
    'Pset_WallCommon', 'Pset_DoorCommon', 'Pset_WindowCommon', 'Pset_SpaceCommon',
    'Pset_SlabCommon', 'Pset_BeamCommon', 'Pset_ColumnCommon', 'Pset_StairCommon',
    'Pset_RailingCommon', 'Pset_RoofCommon', 'Pset_CurtainWallCommon', 'Pset_PlateCommon',
    'Pset_MemberCommon', 'Pset_BuildingElementCommon', 'Pset_FlowTerminalCommon',
    'Pset_FlowSegmentCommon', 'Pset_FlowFittingCommon', 'Pset_FlowControllerCommon'
];

// IDS-Light root keys
const ROOT_KEYS = ['ids', 'rules', 'title', 'description', 'version', 'author', 'date', 'purpose', 'milestone', 'copyright', 'license'];

// Facet keys
const FACET_KEYS = ['applicability', 'requirements', 'entity', 'attribute', 'property', 'material', 'classification', 'partOf'];

// Property keys
const PROPERTY_KEYS = [
    'name', 'datatype', 'presence', 'value', 'minValue', 'maxValue', 'pattern',
    'length', 'minLength', 'maxLength', 'enumeration', 'uri', 'instructions',
    'cardinality', 'minCardinality', 'maxCardinality', 'measure', 'simpleValue'
];

// Data types
const DATA_TYPES = [
    'string', 'integer', 'number', 'boolean', 'date', 'time', 'datetime',
    'duration', 'anyURI', 'base64Binary', 'hexBinary', 'normalizedString',
    'token', 'language', 'NMTOKEN', 'Name', 'NCName', 'ID', 'IDREF', 'ENTITY'
];

// Presence values
const PRESENCE_VALUES = ['required', 'optional', 'prohibited'];

// Cardinality values
const CARDINALITY_VALUES = ['single', 'list', 'set', 'bag'];

interface MonacoEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function MonacoEditor({ value, onChange, placeholder, className }: MonacoEditorProps) {
    const { theme } = useTheme();
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

    const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
        editorRef.current = editor;

        // Register IDS-Light as a custom language
        monaco.languages.register({ id: IDS_LIGHT_LANGUAGE_ID });

        // Configure IDS-Light language features
        monaco.languages.setLanguageConfiguration(IDS_LIGHT_LANGUAGE_ID, {
            comments: {
                lineComment: '#'
            },
            brackets: [
                ['{', '}'],
                ['[', ']'],
                ['(', ')']
            ],
            autoClosingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"' },
                { open: "'", close: "'" }
            ],
            surroundingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"' },
                { open: "'", close: "'" }
            ],
            indentationRules: {
                increaseIndentPattern: /^(\s*)(.*:(\s*\[.*\])?(\s*{.*})?)\s*$/,
                decreaseIndentPattern: /^\s*[\]\}]\s*$/
            },
            folding: {
                offSide: true
            }
        });

        // Enhanced tokenization for IDS-Light
        monaco.languages.setMonarchTokensProvider(IDS_LIGHT_LANGUAGE_ID, {
            tokenizer: {
                root: [
                    // Comments
                    [/#.*$/, 'comment'],

                    // IDS-Light root keys (ids, rules, title, etc.)
                    [/^(\s*)(ids|rules|title|description|version|author|date|purpose|milestone|copyright|license)(\s*)(:)/,
                        ['', 'key.root', '', 'delimiter']],

                    // IFC entities (IfcWall, IfcDoor, etc.)
                    [/\bIfc[A-Z][a-zA-Z]*\b/, 'type.ifc'],

                    // Property sets (Pset_Common, etc.)
                    [/\bPset_[a-zA-Z0-9_]*\.[a-zA-Z0-9_]*\b/, 'type.pset'],

                    // Facet keys (requiredPartOf, classifications, materials, etc.)
                    [/^(\s*)(requiredPartOf|classifications|materials|partOf|applicability|requirements)(\s*)(:)/,
                        ['', 'key.facet', '', 'delimiter']],

                    // Property keys (name, datatype, presence, etc.)
                    [/^(\s*)(name|datatype|presence|value|minValue|maxValue|pattern|length|minLength|maxLength|enumeration|uri|instructions|cardinality|minCardinality|maxCardinality)(\s*)(:)/,
                        ['', 'key.property', '', 'delimiter']],

                    // General keys
                    [/^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*)(:)/, ['', 'key', '', 'delimiter']],

                    // Strings
                    [/"([^"\\]|\\.)*$/, 'string.invalid'],
                    [/'([^'\\]|\\.)*$/, 'string.invalid'],
                    [/"/, 'string', '@string_double'],
                    [/'/, 'string', '@string_single'],

                    // Numbers
                    [/-?\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
                    [/-?\d+/, 'number'],

                    // Booleans
                    [/\b(true|false|yes|no|on|off)\b/, 'keyword'],

                    // Null
                    [/\b(null|~)\b/, 'keyword'],

                    // Arrays and objects
                    [/\[/, 'delimiter.bracket'],
                    [/\]/, 'delimiter.bracket'],
                    [/\{/, 'delimiter.brace'],
                    [/\}/, 'delimiter.brace'],

                    // Delimiters
                    [/:/, 'delimiter'],
                    [/,/, 'delimiter'],
                    [/-/, 'delimiter'],

                    // Whitespace
                    [/\s+/, '']
                ],

                string_double: [
                    [/[^\\"]+/, 'string'],
                    [/\\./, 'string.escape'],
                    [/"/, 'string', '@pop']
                ],

                string_single: [
                    [/[^\\']+/, 'string'],
                    [/\\./, 'string.escape'],
                    [/'/, 'string', '@pop']
                ]
            }
        });

        // Intelligent autocompletion provider
        monaco.languages.registerCompletionItemProvider(IDS_LIGHT_LANGUAGE_ID, {
            provideCompletionItems: (model, position) => {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                };

                const line = model.getLineContent(position.lineNumber);
                const lineUpToPosition = line.substring(0, position.column - 1);

                const suggestions: monaco.languages.CompletionItem[] = [];

                // Context-aware suggestions
                if (lineUpToPosition.trim() === '' || lineUpToPosition.match(/^\s*$/)) {
                    // Root level - suggest root keys
                    ROOT_KEYS.forEach(key => {
                        suggestions.push({
                            label: key,
                            kind: monaco.languages.CompletionItemKind.Property,
                            insertText: `${key}: `,
                            documentation: `IDS-Light root property: ${key}`,
                            range
                        });
                    });
                } else if (lineUpToPosition.includes('entity:') || lineUpToPosition.includes('- entity:')) {
                    // Entity context - suggest IFC entities
                    IFC_ENTITIES.forEach(entity => {
                        suggestions.push({
                            label: entity,
                            kind: monaco.languages.CompletionItemKind.Class,
                            insertText: entity,
                            documentation: `IFC Entity: ${entity}`,
                            range
                        });
                    });
                } else if (lineUpToPosition.includes('name:') && lineUpToPosition.includes('property')) {
                    // Property name context - suggest property sets
                    PROPERTY_SETS.forEach(pset => {
                        const properties = ['FireRating', 'ThermalTransmittance', 'AcousticRating', 'LoadBearing', 'IsExternal'];
                        properties.forEach(prop => {
                            suggestions.push({
                                label: `${pset}.${prop}`,
                                kind: monaco.languages.CompletionItemKind.Property,
                                insertText: `${pset}.${prop}`,
                                documentation: `Property: ${pset}.${prop}`,
                                range
                            });
                        });
                    });
                } else if (lineUpToPosition.includes('datatype:')) {
                    // Datatype context
                    DATA_TYPES.forEach(type => {
                        suggestions.push({
                            label: type,
                            kind: monaco.languages.CompletionItemKind.Enum,
                            insertText: type,
                            documentation: `Data type: ${type}`,
                            range
                        });
                    });
                } else if (lineUpToPosition.includes('presence:')) {
                    // Presence context
                    PRESENCE_VALUES.forEach(presence => {
                        suggestions.push({
                            label: presence,
                            kind: monaco.languages.CompletionItemKind.Enum,
                            insertText: presence,
                            documentation: `Presence: ${presence}`,
                            range
                        });
                    });
                } else if (lineUpToPosition.includes('cardinality:')) {
                    // Cardinality context
                    CARDINALITY_VALUES.forEach(cardinality => {
                        suggestions.push({
                            label: cardinality,
                            kind: monaco.languages.CompletionItemKind.Enum,
                            insertText: cardinality,
                            documentation: `Cardinality: ${cardinality}`,
                            range
                        });
                    });
                } else {
                    // General context - suggest facet and property keys
                    FACET_KEYS.forEach(key => {
                        suggestions.push({
                            label: key,
                            kind: monaco.languages.CompletionItemKind.Property,
                            insertText: `${key}: `,
                            documentation: `IDS-Light facet: ${key}`,
                            range
                        });
                    });

                    PROPERTY_KEYS.forEach(key => {
                        suggestions.push({
                            label: key,
                            kind: monaco.languages.CompletionItemKind.Property,
                            insertText: `${key}: `,
                            documentation: `IDS-Light property: ${key}`,
                            range
                        });
                    });
                }

                return { suggestions };
            }
        });

        // Hover provider for documentation
        monaco.languages.registerHoverProvider(IDS_LIGHT_LANGUAGE_ID, {
            provideHover: (model, position) => {
                const word = model.getWordAtPosition(position);
                if (!word) return null;

                const wordValue = word.word;
                let hoverContent = '';

                if (ROOT_KEYS.includes(wordValue)) {
                    hoverContent = `**${wordValue}** - IDS-Light root property\n\nDefines ${wordValue} information for the IDS specification.`;
                } else if (IFC_ENTITIES.includes(wordValue)) {
                    hoverContent = `**${wordValue}** - IFC Entity\n\nBuilding Information Modeling entity representing a ${wordValue.replace('Ifc', '').toLowerCase()}.`;
                } else if (FACET_KEYS.includes(wordValue)) {
                    hoverContent = `**${wordValue}** - IDS-Light facet\n\nSpecifies ${wordValue} constraints for the rule.`;
                } else if (PROPERTY_KEYS.includes(wordValue)) {
                    hoverContent = `**${wordValue}** - Property constraint\n\nDefines ${wordValue} requirements for the property.`;
                } else if (DATA_TYPES.includes(wordValue)) {
                    hoverContent = `**${wordValue}** - Data type\n\nSpecifies that values must be of type ${wordValue}.`;
                }

                if (hoverContent) {
                    return {
                        range: new monaco.Range(
                            position.lineNumber,
                            word.startColumn,
                            position.lineNumber,
                            word.endColumn
                        ),
                        contents: [{ value: hoverContent }]
                    };
                }

                return null;
            }
        });

        // Document symbol provider for outline
        monaco.languages.registerDocumentSymbolProvider(IDS_LIGHT_LANGUAGE_ID, {
            provideDocumentSymbols: (model) => {
                const symbols: monaco.languages.DocumentSymbol[] = [];
                const lines = model.getLinesContent();

                lines.forEach((line, index) => {
                    const lineNumber = index + 1;
                    const trimmedLine = line.trim();

                    if (trimmedLine.startsWith('ids:')) {
                        symbols.push({
                            name: 'IDS Specification',
                            detail: 'Root IDS definition',
                            kind: monaco.languages.SymbolKind.Namespace,
                            range: new monaco.Range(lineNumber, 1, lineNumber, line.length),
                            selectionRange: new monaco.Range(lineNumber, 1, lineNumber, line.length),
                            tags: []
                        });
                    } else if (trimmedLine.startsWith('rules:')) {
                        symbols.push({
                            name: 'Rules',
                            detail: 'IDS Rules collection',
                            kind: monaco.languages.SymbolKind.Array,
                            range: new monaco.Range(lineNumber, 1, lineNumber, line.length),
                            selectionRange: new monaco.Range(lineNumber, 1, lineNumber, line.length),
                            tags: []
                        });
                    } else if (trimmedLine.startsWith('- ') && (trimmedLine.includes('applicability:') || trimmedLine.includes('requirements:'))) {
                        const ruleName = `Rule ${symbols.filter(s => s.detail === 'IDS Rule').length + 1}`;
                        symbols.push({
                            name: ruleName,
                            detail: 'IDS Rule',
                            kind: monaco.languages.SymbolKind.Object,
                            range: new monaco.Range(lineNumber, 1, lineNumber, line.length),
                            selectionRange: new monaco.Range(lineNumber, 1, lineNumber, line.length),
                            tags: []
                        });
                    }
                });

                return symbols;
            }
        });

        // Code action provider for quick fixes
        monaco.languages.registerCodeActionProvider(IDS_LIGHT_LANGUAGE_ID, {
            provideCodeActions: (model, range, context) => {
                const actions: monaco.languages.CodeAction[] = [];

                // Add quick fix for missing required properties
                const line = model.getLineContent(range.startLineNumber);
                if (line.includes('entity:') && !line.includes('name:')) {
                    actions.push({
                        title: 'Add entity name property',
                        kind: 'quickfix',
                        edit: {
                            edits: [{
                                resource: model.uri,
                                versionId: model.getVersionId(),
                                textEdit: {
                                    range: new monaco.Range(range.endLineNumber, 1, range.endLineNumber, 1),
                                    text: '        name: \n'
                                }
                            }]
                        }
                    });
                }

                return { actions, dispose: () => { } };
            }
        });

        // Diagnostic provider for error detection
        const validateModel = (model: monaco.editor.ITextModel) => {
            const markers: monaco.editor.IMarkerData[] = [];
            const lines = model.getLinesContent();

            lines.forEach((line, index) => {
                const lineNumber = index + 1;
                const trimmedLine = line.trim();

                // Check for common IDS-Light errors
                if (trimmedLine.includes('datatype:') && !DATA_TYPES.some(type => trimmedLine.includes(type))) {
                    const datatypeMatch = trimmedLine.match(/datatype:\s*(.+)/);
                    if (datatypeMatch) {
                        markers.push({
                            severity: monaco.MarkerSeverity.Error,
                            message: `Invalid datatype '${datatypeMatch[1].trim()}'. Valid types: ${DATA_TYPES.join(', ')}`,
                            startLineNumber: lineNumber,
                            startColumn: line.indexOf(datatypeMatch[1]) + 1,
                            endLineNumber: lineNumber,
                            endColumn: line.indexOf(datatypeMatch[1]) + datatypeMatch[1].length + 1
                        });
                    }
                }

                if (trimmedLine.includes('presence:') && !PRESENCE_VALUES.some(val => trimmedLine.includes(val))) {
                    const presenceMatch = trimmedLine.match(/presence:\s*(.+)/);
                    if (presenceMatch) {
                        markers.push({
                            severity: monaco.MarkerSeverity.Error,
                            message: `Invalid presence '${presenceMatch[1].trim()}'. Valid values: ${PRESENCE_VALUES.join(', ')}`,
                            startLineNumber: lineNumber,
                            startColumn: line.indexOf(presenceMatch[1]) + 1,
                            endLineNumber: lineNumber,
                            endColumn: line.indexOf(presenceMatch[1]) + presenceMatch[1].length + 1
                        });
                    }
                }
            });

            monaco.editor.setModelMarkers(model, 'ids-light', markers);
        };

        // Validate on content change
        editor.onDidChangeModelContent(() => {
            const model = editor.getModel();
            if (model) {
                validateModel(model);
            }
        });

        // Register code snippets
        monaco.languages.registerCompletionItemProvider(IDS_LIGHT_LANGUAGE_ID, {
            provideCompletionItems: (model, position) => {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                };

                const snippets: monaco.languages.CompletionItem[] = [
                    {
                        label: 'ids-template',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            'ids:',
                            '  title: "${1:My IDS Specification}"',
                            '  description: "${2:Description of the specification}"',
                            '  version: "${3:1.0}"',
                            '  author: "${4:Author Name}"',
                            '  date: "${5:2024-01-01}"',
                            '',
                            'rules:',
                            '  - applicability:',
                            '      entity:',
                            '        name: ${6:IfcWall}',
                            '    requirements:',
                            '      property:',
                            '        name: ${7:Pset_WallCommon.FireRating}',
                            '        datatype: ${8:string}',
                            '        presence: ${9:required}'
                        ].join('\n'),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Complete IDS-Light template',
                        range
                    },
                    {
                        label: 'rule-entity',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            '- applicability:',
                            '    entity:',
                            '      name: ${1:IfcWall}',
                            '  requirements:',
                            '    property:',
                            '      name: ${2:Pset_WallCommon.FireRating}',
                            '      datatype: ${3:string}',
                            '      presence: ${4:required}'
                        ].join('\n'),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'IDS rule with entity and property requirements',
                        range
                    },
                    {
                        label: 'entity-facet',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            'entity:',
                            '  name: ${1:IfcWall}',
                            '  predefinedType: ${2:STANDARD}'
                        ].join('\n'),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Entity facet with name and predefined type',
                        range
                    },
                    {
                        label: 'property-facet',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            'property:',
                            '  name: ${1:Pset_WallCommon.FireRating}',
                            '  datatype: ${2:string}',
                            '  presence: ${3:required}',
                            '  value: ${4:"REI 60"}'
                        ].join('\n'),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Property facet with constraints',
                        range
                    },
                    {
                        label: 'classification-facet',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            'classification:',
                            '  system: ${1:"Uniclass"}',
                            '  value: ${2:"Pr_20_93_96_56"}'
                        ].join('\n'),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Classification facet',
                        range
                    },
                    {
                        label: 'material-facet',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            'material:',
                            '  name: ${1:"Concrete"}',
                            '  category: ${2:"Structural"}'
                        ].join('\n'),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Material facet',
                        range
                    }
                ];

                return { suggestions: snippets };
            }
        });

        // Custom theme for IDS-Light
        monaco.editor.defineTheme('ids-light-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6A737D', fontStyle: 'italic' },
                { token: 'key.root', foreground: 'A855F7', fontStyle: 'bold' }, // Purple for root keys
                { token: 'key.property', foreground: '3B82F6' }, // Blue for property keys
                { token: 'key.facet', foreground: '6366F1' }, // Indigo for facet keys
                { token: 'key', foreground: '8B5CF6' }, // Purple for general keys
                { token: 'type.ifc', foreground: 'F97316' }, // Orange for IFC entities
                { token: 'type.pset', foreground: '06B6D4' }, // Cyan for property sets
                { token: 'string', foreground: '10B981' }, // Green for strings
                { token: 'number', foreground: 'EF4444' }, // Red for numbers
                { token: 'number.float', foreground: 'EF4444' }, // Red for floats
                { token: 'keyword', foreground: 'F59E0B' }, // Yellow for booleans/keywords
                { token: 'delimiter', foreground: 'D1D5DB' }, // Gray for delimiters
                { token: 'delimiter.bracket', foreground: 'D1D5DB' },
                { token: 'delimiter.brace', foreground: 'D1D5DB' }
            ],
            colors: {
                'editor.background': '#0F172A',
                'editor.foreground': '#E2E8F0',
                'editorLineNumber.foreground': '#475569',
                'editorLineNumber.activeForeground': '#94A3B8',
                'editor.selectionBackground': '#334155',
                'editor.selectionHighlightBackground': '#1E293B',
                'editorCursor.foreground': '#F8FAFC',
                'editor.findMatchBackground': '#374151',
                'editor.findMatchHighlightBackground': '#1F2937'
            }
        });

        monaco.editor.defineTheme('ids-light-light', {
            base: 'vs',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
                { token: 'key.root', foreground: '7C3AED', fontStyle: 'bold' }, // Purple for root keys
                { token: 'key.property', foreground: '2563EB' }, // Blue for property keys
                { token: 'key.facet', foreground: '4F46E5' }, // Indigo for facet keys
                { token: 'key', foreground: '7C2D12' }, // Brown for general keys
                { token: 'type.ifc', foreground: 'EA580C' }, // Orange for IFC entities
                { token: 'type.pset', foreground: '0891B2' }, // Cyan for property sets
                { token: 'string', foreground: '059669' }, // Green for strings
                { token: 'number', foreground: 'DC2626' }, // Red for numbers
                { token: 'number.float', foreground: 'DC2626' }, // Red for floats
                { token: 'keyword', foreground: 'D97706' }, // Amber for booleans/keywords
                { token: 'delimiter', foreground: '4B5563' }, // Gray for delimiters
                { token: 'delimiter.bracket', foreground: '4B5563' },
                { token: 'delimiter.brace', foreground: '4B5563' }
            ],
            colors: {
                'editor.background': '#FFFFFF',
                'editor.foreground': '#1F2937',
                'editorLineNumber.foreground': '#9CA3AF',
                'editorLineNumber.activeForeground': '#6B7280',
                'editor.selectionBackground': '#E5E7EB',
                'editor.selectionHighlightBackground': '#F3F4F6',
                'editorCursor.foreground': '#1F2937',
                'editor.findMatchBackground': '#FEF3C7',
                'editor.findMatchHighlightBackground': '#FEF9E7'
            }
        });

        // Set placeholder text if value is empty
        if (!value && placeholder) {
            editor.setValue(placeholder);
            editor.setSelection(new monaco.Selection(1, 1, 1, 1));
        }
    };

    const handleEditorChange = (newValue: string | undefined) => {
        if (newValue !== undefined) {
            onChange(newValue);
        }
    };

    return (
        <div className={className}>
            <Editor
                height="100%"
                language={IDS_LIGHT_LANGUAGE_ID}
                theme={theme === 'dark' ? 'ids-light-dark' : 'ids-light-light'}
                value={value}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                    // Core editor features
                    minimap: { enabled: true, side: 'right', size: 'proportional' },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    fontFamily: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace',
                    fontLigatures: true,
                    lineNumbers: 'on',
                    lineNumbersMinChars: 3,
                    glyphMargin: true,
                    folding: true,
                    foldingStrategy: 'indentation',
                    showFoldingControls: 'mouseover',
                    lineDecorationsWidth: 10,
                    renderLineHighlight: 'line',
                    selectOnLineNumbers: true,
                    automaticLayout: true,

                    // Word wrapping and indentation
                    wordWrap: 'on',
                    wrappingIndent: 'indent',
                    tabSize: 2,
                    insertSpaces: true,
                    detectIndentation: false,
                    autoIndent: 'full',
                    trimAutoWhitespace: true,

                    // IntelliSense and suggestions
                    quickSuggestions: {
                        other: true,
                        comments: false,
                        strings: true
                    },
                    quickSuggestionsDelay: 10,
                    suggestOnTriggerCharacters: true,
                    acceptSuggestionOnCommitCharacter: true,
                    acceptSuggestionOnEnter: 'on',
                    snippetSuggestions: 'top',
                    tabCompletion: 'on',
                    suggest: {
                        insertMode: 'replace',
                        filterGraceful: true,
                        showKeywords: true,
                        showSnippets: true,
                        showClasses: true,
                        showFunctions: true,
                        showVariables: true,
                        showProperties: true,
                        showEnums: true,
                        showValues: true,
                        showConstants: true,
                        showReferences: true,
                        showWords: true,
                        showTypeParameters: true
                    },

                    // Parameter hints and hover
                    parameterHints: {
                        enabled: true,
                        cycle: true
                    },
                    hover: {
                        enabled: true,
                        delay: 300,
                        sticky: true
                    },

                    // Code actions enabled

                    // Find and replace
                    find: {
                        cursorMoveOnType: true,
                        seedSearchStringFromSelection: 'always',
                        autoFindInSelection: 'never',
                        addExtraSpaceOnTop: true,
                        loop: true
                    },

                    // Multi-cursor and selection
                    multiCursorMergeOverlapping: true,
                    multiCursorModifier: 'alt',
                    multiCursorPaste: 'spread',

                    // Cursor and selection styling
                    cursorBlinking: 'blink',
                    cursorSmoothCaretAnimation: 'on',
                    cursorStyle: 'line',
                    cursorWidth: 2,
                    roundedSelection: true,

                    // Formatting
                    formatOnPaste: true,
                    formatOnType: true,

                    // Rendering options
                    renderControlCharacters: false,
                    renderFinalNewline: 'on',
                    renderValidationDecorations: 'editable',
                    renderWhitespace: 'selection',
                    renderLineHighlightOnlyWhenFocus: false,

                    // Scrolling and navigation
                    smoothScrolling: true,
                    mouseWheelZoom: true,
                    fastScrollSensitivity: 5,
                    scrollbar: {
                        useShadows: true,
                        verticalHasArrows: false,
                        horizontalHasArrows: false,
                        vertical: 'visible',
                        horizontal: 'visible',
                        verticalScrollbarSize: 14,
                        horizontalScrollbarSize: 14,
                        arrowSize: 11
                    },

                    // Overview ruler
                    overviewRulerBorder: true,
                    overviewRulerLanes: 3,
                    hideCursorInOverviewRuler: false,

                    // Accessibility and interaction
                    accessibilitySupport: 'auto',
                    contextmenu: true,
                    copyWithSyntaxHighlighting: true,
                    dragAndDrop: true,
                    emptySelectionClipboard: true,
                    links: true,

                    // Layout and spacing
                    padding: { top: 16, bottom: 16 },
                    revealHorizontalRightPadding: 30,
                    rulers: [80, 120],

                    // Advanced features
                    showUnused: true,
                    showDeprecated: true,
                    bracketPairColorization: {
                        enabled: true
                    },
                    guides: {
                        bracketPairs: true,
                        bracketPairsHorizontal: true,
                        highlightActiveBracketPair: true,
                        indentation: true,
                        highlightActiveIndentation: true
                    },

                    // Performance
                    disableLayerHinting: false,
                    disableMonospaceOptimizations: false,

                    // Word navigation
                    useTabStops: true,
                    wordSeparators: '`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?',
                    wordWrapBreakAfterCharacters: '\t})]?|/&.,;',
                    wordWrapBreakBeforeCharacters: '([{',

                    // Experimental features
                    experimentalWhitespaceRendering: 'svg',
                    stickyScroll: {
                        enabled: true
                    }
                }}
            />
        </div>
    );
}
