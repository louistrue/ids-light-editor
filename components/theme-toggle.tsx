"use client"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("system")
    } else if (theme === "system") {
      setTheme("dark")
    } else {
      setTheme("light")
    }
  }

  const getCurrentIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4 text-amber-500" />
      case "system":
        return <Monitor className="h-4 w-4 text-blue-500" />
      case "dark":
        return <Moon className="h-4 w-4 text-purple-400" />
      default:
        return <Sun className="h-4 w-4 text-amber-500" />
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 px-0 bg-muted/50 hover:bg-muted/80 rounded-lg transition-all duration-300 hover:scale-105"
      onClick={cycleTheme}
    >
      <div className="transition-all duration-300 ease-in-out transform hover:rotate-12">{getCurrentIcon()}</div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
