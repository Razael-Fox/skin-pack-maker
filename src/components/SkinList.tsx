import { useState } from "react"
import { User, Trash2, Upload, GripVertical } from "lucide-react"
import { SkinItem } from "../types"

interface SkinListProps {
  skins: SkinItem[]
  selectedSkinId: string | null
  onSelectSkin: (id: string) => void
  onAddSkin: (file: File) => void
  onRemoveSkin: (id: string, e: React.MouseEvent) => void
  onReorderSkins: (startIndex: number, endIndex: number) => void
  highlightAddButton?: boolean
}

export function SkinList({
  skins,
  selectedSkinId,
  onSelectSkin,
  onAddSkin,
  onRemoveSkin,
  onReorderSkins,
  highlightAddButton,
}: SkinListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleAddFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file) => onAddSkin(file))
      e.target.value = ""
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", index.toString())
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    onReorderSkins(draggedIndex, index)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className="rounded-xl border border-purple-500/10 bg-white/90 p-6 shadow-md backdrop-blur-md transition-all duration-300 hover:border-purple-500/20 dark:border-purple-500/20 dark:bg-zinc-900/60 dark:shadow-xl dark:shadow-black/20 dark:hover:border-purple-500/30">
      <div
        className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${skins.length > 0 ? "mb-5" : ""}`}
      >
        <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-zinc-900 uppercase dark:text-white/90">
          <User className="h-4 w-4 text-zinc-400 dark:text-white/50" />
          <span>Skins ({skins.length})</span>
        </h2>
        <div className="flex gap-2">
          <label
            id="real-add-png-btn"
            className={`flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-[10px] font-bold text-white shadow-lg shadow-purple-600/20 transition-all hover:bg-purple-700 ${
              highlightAddButton ? "animate-flash-border scale-105" : ""
            }`}
          >
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
        </div>
      </div>
      {skins.length > 0 && (
        <div className="custom-scrollbar max-h-[350px] space-y-2 overflow-y-auto pr-2">
          {skins.map((skin, index) => (
            <div
              key={skin.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => onSelectSkin(skin.id)}
              className={`group/skin flex cursor-grab items-center justify-between rounded-lg border p-3 transition-all duration-200 active:cursor-grabbing ${
                draggedIndex === index
                  ? "border-purple-500/25 bg-purple-500/5 opacity-40"
                  : dragOverIndex === index
                    ? "translate-y-0.5 scale-[0.98] border-dashed border-purple-500 bg-purple-500/10"
                    : selectedSkinId === skin.id
                      ? "border-purple-500/50 bg-purple-500/10 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                      : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300 hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-800/10 dark:hover:border-white/20 dark:hover:bg-white/10"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <GripVertical className="h-3.5 w-3.5 shrink-0 text-zinc-400 opacity-40 transition-opacity group-hover/skin:opacity-100 dark:text-white/30" />
                <div
                  className={`h-2.5 w-2.5 rounded-full shadow-inner ${
                    skin.textureFile
                      ? "bg-purple-500"
                      : "bg-zinc-300 dark:bg-white/20"
                  }`}
                />
                <span
                  className={`truncate text-sm font-medium ${
                    skin.name
                      ? "text-zinc-800 dark:text-white/90"
                      : "text-zinc-400 italic dark:text-white/40"
                  }`}
                >
                  {skin.name || `${skin.placeholderName} (Unnamed)`}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${
                    skin.type === "paid"
                      ? "border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300"
                      : "border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300"
                  }`}
                >
                  {skin.type.toUpperCase()}
                </span>
                <button
                  onClick={(e) => onRemoveSkin(skin.id, e)}
                  className="p-1 text-zinc-400 opacity-60 transition-all hover:text-red-500 hover:opacity-100 dark:text-white/50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
