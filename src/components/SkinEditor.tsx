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
    <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/20 backdrop-blur-md transition-all duration-300 md:col-span-7">
      <div className="space-y-6">
        <div className="border-b border-white/10 pb-4">
          <h3 className="text-sm font-semibold tracking-widest text-white/90 uppercase">
            Edit Skin Metadata
          </h3>
          <p className="mt-1 text-xs text-white/50">
            Configure skin settings for the Bedrock metadata bundle
          </p>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold tracking-widest text-white/60 uppercase">
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
            className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white shadow-inner transition-all outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
          />
        </div>

        <div>
          <label className="mb-2.5 block text-xs font-semibold tracking-widest text-white/60 uppercase">
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
                  ? "border-blue-500/50 bg-blue-500/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                  : "border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:bg-white/10"
              }`}
            >
              <p className="text-xs font-bold tracking-wider uppercase">
                Steve model
              </p>
              <span className="mt-1 block font-sans text-[10px] text-white/50">
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
                  ? "border-blue-500/50 bg-blue-500/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                  : "border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:bg-white/10"
              }`}
            >
              <p className="text-xs font-bold tracking-wider uppercase">
                Alex model
              </p>
              <span className="mt-1 block font-sans text-[10px] text-white/50">
                Slim size (3px arms)
              </span>
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2.5 block text-xs font-semibold tracking-widest text-white/60 uppercase">
            Accessibility Tier
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => onUpdateSkin(skin.id, { type: "free" })}
              className={`cursor-pointer rounded-xl border p-3 text-center text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                skin.type === "free"
                  ? "border-blue-500/50 bg-blue-500/20 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                  : "border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:bg-white/10"
              }`}
            >
              FREE (EMERALD)
            </button>
            <button
              type="button"
              onClick={() => onUpdateSkin(skin.id, { type: "paid" })}
              className={`cursor-pointer rounded-xl border p-3 text-center text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                skin.type === "paid"
                  ? "border-amber-500/50 bg-amber-500/20 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  : "border-white/10 bg-white/5 text-white/60 hover:border-amber-500/30 hover:bg-white/10"
              }`}
            >
              PAID (GOLD)
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold tracking-widest text-white/60 uppercase">
            Minecraft Skin Texture (PNG)
          </label>
          <TextureUploadBox
            skin={skin}
            onUpload={(file) => onTextureUpload(skin.id, file)}
          />
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-5 font-sans text-xs text-white/50">
        <Info className="h-5 w-5 shrink-0 text-blue-400" />
        <span>Upload a standard 64x64 or 64x32 PNG skin texture file.</span>
      </div>
    </div>
  )
}
