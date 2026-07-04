import { useState } from "react"
import { Settings, Sun, Moon } from "lucide-react"

interface PackSettingsProps {
  packName: string
  packVersion: string
  onNameChange: (name: string) => void
  onVersionChange: (version: string) => void
  theme: "light" | "dark"
  setTheme: (theme: "light" | "dark") => void
}

export function PackSettings({
  packName,
  packVersion,
  onNameChange,
  onVersionChange,
  theme,
  setTheme,
}: PackSettingsProps) {
  const [prevPackName, setPrevPackName] = useState(packName)
  const [localName, setLocalName] = useState(packName)

  const [prevPackVersion, setPrevPackVersion] = useState(packVersion)
  const [localVersion, setLocalVersion] = useState(packVersion)

  if (packName !== prevPackName) {
    setPrevPackName(packName)
    setLocalName(packName)
  }

  if (packVersion !== prevPackVersion) {
    setPrevPackVersion(packVersion)
    setLocalVersion(packVersion)
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white/60 p-6 shadow-md backdrop-blur-md transition-all duration-300 hover:border-zinc-300 dark:border-white/10 dark:bg-white/5 dark:shadow-xl dark:shadow-black/20 dark:hover:border-white/20">
      <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-purple-500/50 to-indigo-500/50" />
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-zinc-900 uppercase dark:text-white/90">
          <Settings className="h-4 w-4 text-zinc-400 dark:text-white/50" />
          <span>Pack Settings</span>
        </h2>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white/60 p-1.5 text-zinc-600 shadow-sm transition-all hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
          title={
            theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
          }
        >
          {theme === "dark" ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold tracking-widest text-zinc-500 uppercase dark:text-white/60">
            Pack Display Name
          </label>
          <input
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={() => onNameChange(localName)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-100/50 px-3 py-2 text-sm text-zinc-900 shadow-inner transition-all outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 dark:border-white/10 dark:bg-black/20 dark:text-white"
            placeholder="Enter pack name..."
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold tracking-widest text-zinc-500 uppercase dark:text-white/60">
            Pack Version
          </label>
          <input
            type="text"
            value={localVersion}
            onChange={(e) => setLocalVersion(e.target.value)}
            onBlur={() => onVersionChange(localVersion)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-100/50 px-3 py-2 text-sm text-zinc-900 shadow-inner transition-all outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 dark:border-white/10 dark:bg-black/20 dark:text-white"
            placeholder="1.0.0"
          />
        </div>
      </div>
    </div>
  )
}
