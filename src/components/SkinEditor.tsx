import { useState } from "react"
import { Info } from "lucide-react"
import { SkinItem } from "../types"
import { TextureUploadBox } from "./TextureUploadBox"

interface SkinEditorProps {
  skin: SkinItem
  onUpdateSkin: (id: string, updates: Partial<SkinItem>) => void
  onTextureUpload: (id: string, file: File) => void
}

export function SkinEditor({
  skin,
  onUpdateSkin,
  onTextureUpload,
}: SkinEditorProps) {
  const [prevSkinId, setPrevSkinId] = useState(skin.id)
  const [localSkinName, setLocalSkinName] = useState(skin.name)

  if (skin.id !== prevSkinId) {
    setPrevSkinId(skin.id)
    setLocalSkinName(skin.name)
  }

  return (
    <div className="flex flex-col justify-between rounded-xl border border-purple-500/10 bg-white/90 p-8 shadow-md backdrop-blur-md transition-all duration-300 md:col-span-7 dark:border-purple-500/20 dark:bg-zinc-900/60 dark:shadow-xl dark:shadow-black/20">
      <div className="space-y-6">
        <div className="border-b border-zinc-200 pb-4 dark:border-white/10">
          <h3 className="text-sm font-semibold tracking-widest text-zinc-900 uppercase dark:text-white/90">
            Edit Skin Metadata
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-white/50">
            Configure skin settings for the Bedrock metadata bundle
          </p>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold tracking-widest text-zinc-500 uppercase dark:text-white/60">
            Skin Display Name
          </label>
          <input
            type="text"
            value={localSkinName}
            onChange={(e) => setLocalSkinName(e.target.value)}
            onBlur={() => {
              if (localSkinName.trim()) {
                onUpdateSkin(skin.id, { name: localSkinName.trim() })
              }
            }}
            className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 shadow-inner transition-all outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 dark:border-white/15 dark:bg-black/40 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-2.5 block text-xs font-semibold tracking-widest text-zinc-500 uppercase dark:text-white/60">
            Model Geometry (Arm Width)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() =>
                onUpdateSkin(skin.id, { geometry: "geometry.humanoid.custom" })
              }
              className={`cursor-pointer rounded-xl border p-4 text-left transition-all duration-200 ${
                skin.geometry === "geometry.humanoid.custom"
                  ? "border-purple-500/50 bg-purple-500/10 text-purple-700 shadow-[0_0_15px_rgba(139,92,246,0.15)] dark:text-white"
                  : "border-zinc-300 bg-zinc-50 text-zinc-500 hover:border-purple-500/20 hover:bg-zinc-100/50 dark:border-white/15 dark:bg-black/20 dark:text-white/60 dark:hover:border-purple-500/30 dark:hover:bg-white/5"
              }`}
            >
              <p className="text-xs font-bold tracking-wider uppercase">
                Steve model
              </p>
              <span className="mt-1 block font-sans text-[10px] text-zinc-400 dark:text-white/50">
                Standard size (4px arms)
              </span>
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdateSkin(skin.id, {
                  geometry: "geometry.humanoid.customSlim",
                })
              }
              className={`cursor-pointer rounded-xl border p-4 text-left transition-all duration-200 ${
                skin.geometry === "geometry.humanoid.customSlim"
                  ? "border-purple-500/50 bg-purple-500/10 text-purple-700 shadow-[0_0_15px_rgba(139,92,246,0.15)] dark:text-white"
                  : "border-zinc-300 bg-zinc-50 text-zinc-500 hover:border-purple-500/20 hover:bg-zinc-100/50 dark:border-white/15 dark:bg-black/20 dark:text-white/60 dark:hover:border-purple-500/30 dark:hover:bg-white/5"
              }`}
            >
              <p className="text-xs font-bold tracking-wider uppercase">
                Alex model
              </p>
              <span className="mt-1 block font-sans text-[10px] text-zinc-400 dark:text-white/50">
                Slim size (3px arms)
              </span>
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2.5 block text-xs font-semibold tracking-widest text-zinc-500 uppercase dark:text-white/60">
            Accessibility Tier
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => onUpdateSkin(skin.id, { type: "free" })}
              className={`cursor-pointer rounded-xl border p-3 text-center text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                skin.type === "free"
                  ? "border-purple-500/50 bg-purple-500/10 text-purple-700 shadow-[0_0_15px_rgba(139,92,246,0.2)] dark:bg-purple-500/20 dark:text-purple-300"
                  : "border-zinc-300 bg-zinc-50 text-zinc-500 hover:border-purple-500/20 hover:bg-zinc-100/50 dark:border-white/15 dark:bg-black/20 dark:text-white/60 dark:hover:border-purple-500/30 dark:hover:bg-white/5"
              }`}
            >
              FREE (EMERALD)
            </button>
            <button
              type="button"
              onClick={() => onUpdateSkin(skin.id, { type: "paid" })}
              className={`cursor-pointer rounded-xl border p-3 text-center text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                skin.type === "paid"
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.2)] dark:bg-amber-500/20 dark:text-amber-300"
                  : "border-zinc-300 bg-zinc-50 text-zinc-500 hover:border-amber-500/30 hover:bg-zinc-100/50 dark:border-white/15 dark:bg-black/20 dark:text-white/60 dark:hover:border-amber-500/30 dark:hover:bg-white/5"
              }`}
            >
              PAID (GOLD)
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold tracking-widest text-zinc-500 uppercase dark:text-white/60">
            Minecraft Skin Texture (PNG)
          </label>
          <TextureUploadBox
            skin={skin}
            onUpload={(file) => onTextureUpload(skin.id, file)}
          />
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3 border-t border-zinc-200 pt-5 font-sans text-xs text-zinc-500 dark:border-white/10 dark:text-white/50">
        <Info className="h-5 w-5 shrink-0 text-purple-600 dark:text-purple-400" />
        <span>Upload a standard 64x64 or 64x32 PNG skin texture file.</span>
      </div>
    </div>
  )
}
