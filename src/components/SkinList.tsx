import { User, Plus, Trash2, Upload } from "lucide-react"
import { SkinItem } from "../types"

interface SkinListProps {
  skins: SkinItem[]
  selectedSkinId: string | null
  onSelectSkin: (id: string) => void
  onAddSkin: (file?: File) => void
  onRemoveSkin: (id: string, e: React.MouseEvent) => void
}

export function SkinList({
  skins,
  selectedSkinId,
  onSelectSkin,
  onAddSkin,
  onRemoveSkin,
}: SkinListProps) {
  const handleAddFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file) => onAddSkin(file))
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 backdrop-blur-md transition-all duration-300 hover:border-white/20">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-white/90 uppercase">
          <User className="h-4 w-4 text-white/50" />
          <span>Skins ({skins.length})</span>
        </h2>
        <div className="flex gap-2">
          <label className="flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-[10px] font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-600">
            <Upload className="h-3.5 w-3.5" />
            <span>ADD PNG</span>
            <input
              type="file"
              accept="image/png"
              multiple
              className="hidden"
              onChange={handleAddFileInput}
            />
          </label>
          <button
            onClick={() => onAddSkin()}
            className="flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-white/70 transition-all hover:bg-white/10 hover:text-white"
            title="Add empty slot"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="custom-scrollbar max-h-[350px] space-y-2 overflow-y-auto pr-2">
        {skins.map((skin) => (
          <div
            key={skin.id}
            onClick={() => onSelectSkin(skin.id)}
            className={`group/skin flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all duration-200 ${
              selectedSkinId === skin.id
                ? "border-blue-500/50 bg-blue-500/10 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`h-2.5 w-2.5 rounded-full shadow-inner ${
                  skin.textureFile ? "bg-blue-400" : "bg-white/20"
                }`}
              />
              <span className="truncate text-sm font-medium text-white/90">
                {skin.name}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${
                  skin.type === "paid"
                    ? "border border-amber-500/30 bg-amber-500/20 text-amber-300"
                    : "border border-blue-500/30 bg-blue-500/20 text-blue-300"
                }`}
              >
                {skin.type.toUpperCase()}
              </span>
              <button
                onClick={(e) => onRemoveSkin(skin.id, e)}
                className="p-1 text-white/30 opacity-0 transition-all group-hover/skin:opacity-100 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
