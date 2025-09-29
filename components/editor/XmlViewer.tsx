'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, Eye, EyeOff } from 'lucide-react';

interface XmlViewerProps {
    xml: string;
    onCopy?: () => void;
    onDownload?: () => void;
    copyStatus?: 'idle' | 'success' | 'error';
    downloadStatus?: 'idle' | 'downloading' | 'success' | 'error';
}

export function XmlViewer({ xml, onCopy, onDownload, copyStatus = 'idle', downloadStatus = 'idle' }: XmlViewerProps) {
    const [isFormatted, setIsFormatted] = useState(true);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Format XML with proper indentation
    const formatXml = (xmlString: string): string => {
        const PADDING = '  '; // 2 spaces for indentation

        // Remove existing whitespace between tags and add line breaks
        let formatted = xmlString
            .replace(/>\s*</g, '><') // Remove whitespace between tags
            .replace(/></g, '>\n<'); // Add line breaks between tags

        const lines = formatted.split('\n');
        let indentLevel = 0;

        return lines.map((line) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return '';

            // Decrease indent for closing tags
            if (trimmedLine.startsWith('</')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }

            const indentedLine = PADDING.repeat(indentLevel) + trimmedLine;

            // Increase indent for opening tags (but not self-closing or XML declarations)
            if (trimmedLine.startsWith('<') &&
                !trimmedLine.startsWith('</') &&
                !trimmedLine.startsWith('<?') &&
                !trimmedLine.endsWith('/>')) {
                indentLevel++;
            }

            return indentedLine;
        }).join('\n');
    };

    // Syntax highlight XML
    const highlightXml = (xmlString: string) => {
        if (!isClient) return xmlString;

        const formatted = isFormatted ? formatXml(xmlString) : xmlString;

        return formatted.split('\n').map((line, index) => {
            const lineNumber = index + 1;

            // Escape HTML first
            const escapedLine = line
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');

            let highlightedLine = escapedLine;

            // Highlight XML declaration and processing instructions
            highlightedLine = highlightedLine.replace(
                /(&lt;\?xml[^?]*\?&gt;)/g,
                '<span class="text-pink-600 dark:text-pink-400 font-medium">$1</span>'
            );

            // Highlight comments
            highlightedLine = highlightedLine.replace(
                /(&lt;!--.*?--&gt;)/g,
                '<span class="text-gray-500 dark:text-gray-400 italic">$1</span>'
            );

            // Highlight opening/closing tags
            highlightedLine = highlightedLine.replace(
                /(&lt;\/?)([a-zA-Z0-9_:-]+)([^&]*?)(&gt;)/g,
                '<span class="text-blue-600 dark:text-blue-400">$1</span><span class="text-purple-600 dark:text-purple-400 font-medium">$2</span><span class="text-green-600 dark:text-green-400">$3</span><span class="text-blue-600 dark:text-blue-400">$4</span>'
            );

            // Highlight attributes within the green span (handle multiple attributes)
            highlightedLine = highlightedLine.replace(
                /<span class="text-green-600 dark:text-green-400">([^<]*?)<\/span>/g,
                (match, content) => {
                    // Process attributes within this span
                    const processedContent = content.replace(
                        /(\s+)(\w+)(=)(&quot;[^&]*?&quot;)/g,
                        '$1<span class="text-orange-600 dark:text-orange-400">$2</span><span class="text-gray-500">$3</span><span class="text-emerald-600 dark:text-emerald-400">$4</span>'
                    );
                    return `<span class="text-green-600 dark:text-green-400">${processedContent}</span>`;
                }
            );

            // Highlight text content between tags (not inside spans)
            highlightedLine = highlightedLine.replace(
                /(&gt;)([^&<]+)(&lt;)/g,
                '$1<span class="text-gray-800 dark:text-gray-200">$2</span>$3'
            );

            return (
                <div key={index} className="flex hover:bg-muted/30 transition-colors">
                    <span className="text-gray-400 text-xs mr-4 select-none w-8 text-right flex-shrink-0 py-0.5">
                        {lineNumber}
                    </span>
                    <span
                        className="flex-1 min-w-0 py-0.5 leading-relaxed font-mono"
                        dangerouslySetInnerHTML={{ __html: highlightedLine }}
                    />
                </div>
            );
        });
    };

    // Escape HTML entities for display
    const escapeHtml = (text: string): string => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    const getCopyButtonContent = () => {
        switch (copyStatus) {
            case 'success':
                return (
                    <>
                        <Check className="w-3 h-3" />
                        Copied!
                    </>
                );
            case 'error':
                return (
                    <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        Failed
                    </>
                );
            default:
                return (
                    <>
                        <Copy className="w-3 h-3" />
                        Copy XML
                    </>
                );
        }
    };

    const getDownloadButtonContent = () => {
        switch (downloadStatus) {
            case 'downloading':
                return (
                    <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Downloading...
                    </>
                );
            case 'success':
                return (
                    <>
                        <Check className="w-3 h-3" />
                        Downloaded!
                    </>
                );
            case 'error':
                return (
                    <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        Failed
                    </>
                );
            default:
                return (
                    <>
                        <Download className="w-3 h-3" />
                        Download
                    </>
                );
        }
    };

    if (!xml) {
        return (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm">No XML generated yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Enter IDS-Light code to generate XML</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header with controls */}
            <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-foreground">Generated IDS XML</h3>
                    <div className="flex items-center gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isFormatted
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                            }`}>
                            {isFormatted ? 'Formatted' : 'Raw'}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                            {(isFormatted ? formatXml(xml) : xml).split('\n').length} lines
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                            {(new Blob([xml]).size / 1024).toFixed(1)} KB
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsFormatted(!isFormatted)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-md transition-all duration-200 ${isFormatted
                            ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                            : 'bg-background hover:bg-muted border-border'
                            }`}
                        title={isFormatted ? 'Show raw XML (unformatted)' : 'Format XML (pretty print)'}
                    >
                        {isFormatted ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {isFormatted ? 'Raw' : 'Format'}
                    </button>

                    {onCopy && (
                        <button
                            onClick={onCopy}
                            disabled={copyStatus === 'success'}
                            className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5 font-medium ${copyStatus === 'success'
                                ? 'bg-green-500 text-white'
                                : copyStatus === 'error'
                                    ? 'bg-destructive text-destructive-foreground'
                                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                }`}
                            title="Copy XML to clipboard"
                        >
                            {getCopyButtonContent()}
                        </button>
                    )}

                    {onDownload && (
                        <button
                            onClick={onDownload}
                            disabled={downloadStatus === 'downloading' || downloadStatus === 'success'}
                            className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5 font-medium ${downloadStatus === 'success'
                                ? 'bg-green-500 text-white'
                                : downloadStatus === 'error'
                                    ? 'bg-destructive text-destructive-foreground'
                                    : downloadStatus === 'downloading'
                                        ? 'bg-green-400 text-white cursor-wait'
                                        : 'bg-green-500 text-white hover:bg-green-600'
                                }`}
                            title="Download XML file"
                        >
                            {getDownloadButtonContent()}
                        </button>
                    )}
                </div>
            </div>

            {/* XML Content */}
            <div className="flex-1 overflow-auto bg-background">
                <div className="relative">
                    {/* XML Content */}
                    <div className="font-mono text-xs leading-relaxed transition-all duration-300">
                        {isClient ? (
                            <div className="p-4 animate-in fade-in duration-200">
                                {isFormatted ? highlightXml(xml) : (
                                    <div className="space-y-0">
                                        {xml.split('\n').map((line, index) => (
                                            <div key={index} className="flex hover:bg-muted/30 transition-colors">
                                                <span className="text-gray-400 text-xs mr-4 select-none w-8 text-right flex-shrink-0 py-0.5">
                                                    {index + 1}
                                                </span>
                                                <span className="flex-1 min-w-0 py-0.5 leading-relaxed font-mono text-foreground whitespace-pre-wrap break-all">
                                                    {line}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <pre className="p-4 text-xs leading-relaxed overflow-x-auto">
                                <code>{xml}</code>
                            </pre>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
