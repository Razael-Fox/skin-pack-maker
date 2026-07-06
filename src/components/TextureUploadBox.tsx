import { useRef, useState } from "react"
import { Upload } from "lucide-react"
import { SkinItem } from "../types"

interface TextureUploadBoxProps {
  skin: SkinItem
  onUpload: (file: File) => void
}

export function TextureUploadBox({ skin, onUpload }: TextureUploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0])
      e.target.value = ""
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0])
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
        isDragOver
          ? "border-purple-500 bg-purple-500/10 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
          : skin.textureFile
            ? "border-zinc-200 bg-white/60 hover:border-zinc-300 dark:border-white/20 dark:bg-white/5 dark:hover:border-white/40"
            : "border-zinc-200 bg-zinc-100/50 hover:border-zinc-300 hover:bg-zinc-200/50 dark:border-white/10 dark:bg-black/20 dark:hover:border-white/30 dark:hover:bg-white/5"
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png"
        className="hidden"
      />
      <div className="relative z-10 flex flex-col items-center justify-center gap-4">
        <div
          className={`rounded-full p-4 transition-all duration-300 ${isDragOver ? "bg-purple-600 text-white" : "bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200 group-hover:text-zinc-600 dark:bg-white/5 dark:text-white/50 dark:group-hover:bg-white/10 dark:group-hover:text-white/80"}`}
        >
          <Upload className="h-6 w-6" />
        </div>
        <div>
          {skin.textureFile ? (
            <>
              <p className="text-sm font-bold tracking-widest text-purple-600 uppercase dark:text-purple-400">
                Texture Loaded
              </p>
              <p
                className="mx-auto mt-2 max-w-[280px] truncate font-mono text-xs text-zinc-500 dark:text-white/50"
                title={skin.textureFile.name}
              >
                {skin.textureFile.name}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold tracking-widest text-zinc-800 uppercase dark:text-white/80">
                Drag & Drop PNG Here
              </p>
              <p className="mt-2 font-sans text-xs text-zinc-400 dark:text-white/50">
                or click to browse files
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
