import { useState } from "react"
import { Settings } from "lucide-react"

interface PackSettingsProps {
  packName: string
  packVersion: string
  onNameChange: (name: string) => void
  onVersionChange: (version: string) => void
}

export function PackSettings({
  packName,
  packVersion,
  onNameChange,
  onVersionChange,
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
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 backdrop-blur-md transition-all duration-300 hover:border-white/20">
      <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500/50 to-purple-500/50" />
      <h2 className="mb-5 flex items-center gap-2 text-xs font-semibold tracking-widest text-white/90 uppercase">
        <Settings className="h-4 w-4 text-white/50" />
        <span>Pack Settings</span>
      </h2>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold tracking-widest text-white/60 uppercase">
            Pack Display Name
          </label>
          <input
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={() => onNameChange(localName)}
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white shadow-inner transition-all outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
            placeholder="Enter pack name..."
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold tracking-widest text-white/60 uppercase">
            Pack Version
          </label>
          <input
            type="text"
            value={localVersion}
            onChange={(e) => setLocalVersion(e.target.value)}
            onBlur={() => onVersionChange(localVersion)}
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white shadow-inner transition-all outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
            placeholder="1.0.0"
          />
        </div>
      </div>
    </div>
  )
}
