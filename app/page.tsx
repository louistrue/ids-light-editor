"use client"
import { EditorShell } from "@/components/editor/EditorShell"

export default function Page() {
  return (
    <div className="min-h-dvh bg-background">
      <EditorShell
        source={"# IDS-Light goes here\n# Add your YAML/JSON configuration"}
        status="idle"
        xml=""
        readable={null}
        errors={[]}
      />
    </div>
  )
}
