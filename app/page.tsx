"use client"
import { EditorShell } from "@/components/editor/EditorShell"
import dynamic from "next/dynamic"

const EditorShellWithNoSSR = dynamic(
  () => import("@/components/editor/EditorShell").then((mod) => mod.EditorShell),
  { ssr: false }
)

export default function Page() {
  return (
    <div className="min-h-dvh bg-background">
      <EditorShellWithNoSSR />
    </div>
  )
}
