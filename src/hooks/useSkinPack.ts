import { useState, useEffect } from "react"
import { SkinItem, GeometryType } from "../types"

function generateUUID(): string {
  if (
    typeof window !== "undefined" &&
    window.crypto &&
    typeof window.crypto.randomUUID === "function"
  ) {
    return window.crypto.randomUUID()
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function useSkinPack() {
  const [packName, setPackName] = useState("My Custom Skin Pack")
  const [packVersion, setPackVersion] = useState("1.0.0")
  const [uuidHeader] = useState(() => generateUUID())
  const [uuidModule] = useState(() => generateUUID())

  const [skins, setSkins] = useState<SkinItem[]>(() => [])
  const [selectedSkinId, setSelectedSkinId] = useState<string | null>(null)

  const [exporting, setExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState("")
  const [pendingDownload, setPendingDownload] = useState<{
    blob: Blob
    filename: string
  } | null>(null)

  const addNewSkin = (file: File) => {
    const id = Math.random().toString(36).slice(2, 11)
    const count = skins.length + 1

    if (!file.type.includes("image/png")) {
      alert("Please upload a PNG image file!")
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.src = url
    img.onload = () => {
      let detectedGeometry: GeometryType = "geometry.humanoid.custom"
      try {
        const tempCanvas = document.createElement("canvas")
        const ctx = tempCanvas.getContext("2d")
        if (ctx) {
          tempCanvas.width = img.naturalWidth
          tempCanvas.height = img.naturalHeight
          ctx.drawImage(img, 0, 0)

          // Check pixel opacity at typical Alex arm location (40, 20)
          const pixel = ctx.getImageData(40, 20, 1, 1).data
          if (pixel[3] === 0) {
            detectedGeometry = "geometry.humanoid.customSlim"
          }
        }
      } catch (e) {
        console.warn("Could not auto-detect skin geometry", e)
      }

      const newSkin: SkinItem = {
        id,
        name: `Skin ${count}`,
        geometry: detectedGeometry,
        type: "free",
        textureUrl: url,
        textureFile: file,
        textureName: `skin_${id}.png`,
      }
      setSkins((prev) => [...prev, newSkin])
      setSelectedSkinId(id)
    }
  }

  const removeSkin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSkins((prev) => {
      const target = prev.find((s) => s.id === id)
      if (target && target.textureUrl) {
        URL.revokeObjectURL(target.textureUrl)
      }
      return prev.filter((s) => s.id !== id)
    })
    if (selectedSkinId === id) {
      setSelectedSkinId(null)
    }
  }

  const updateSkin = (id: string, updates: Partial<SkinItem>) => {
    setSkins((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    )
  }

  const handleTextureUpload = (id: string, file: File) => {
    if (!file.type.includes("image/png")) {
      alert("Please upload a PNG image file!")
      return
    }

    const url = URL.createObjectURL(file)
    const img = new Image()
    img.src = url
    img.onload = () => {
      let detectedGeometry: GeometryType = "geometry.humanoid.custom"
      try {
        const tempCanvas = document.createElement("canvas")
        const ctx = tempCanvas.getContext("2d")
        if (ctx) {
          tempCanvas.width = img.naturalWidth
          tempCanvas.height = img.naturalHeight
          ctx.drawImage(img, 0, 0)
          const pixel = ctx.getImageData(40, 20, 1, 1).data
          if (pixel[3] === 0) {
            detectedGeometry = "geometry.humanoid.customSlim"
          }
        }
      } catch (e) {
        console.warn("Could not auto-detect skin geometry", e)
      }

      setSkins((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            if (s.textureUrl) URL.revokeObjectURL(s.textureUrl)
            return {
              ...s,
              textureUrl: url,
              textureFile: file,
              geometry: detectedGeometry,
            }
          }
          return s
        })
      )
    }
  }

  const handleExport = async () => {
    if (skins.length === 0) return
    setExporting(true)
    setExportMessage("Generating pack zip structure...")

    try {
      // Dynamic import JSZip to optimize bundle
      const { default: JSZip } = await import("jszip")
      const zip = new JSZip()
      const slugName = packName.toLowerCase().replace(/[^a-z0-9]+/g, "_")

      const versionArr = packVersion
        .split(".")
        .map((num) => parseInt(num, 10) || 0)
      while (versionArr.length < 3) versionArr.push(0)
      const finalVersion = versionArr.slice(0, 3)

      const manifestJson = {
        header: { name: packName, version: finalVersion, uuid: uuidHeader },
        modules: [
          { version: finalVersion, type: "skin_pack", uuid: uuidModule },
        ],
        format_version: 1,
      }
      zip.file("manifest.json", JSON.stringify(manifestJson, null, 2))

      const skinsJson = {
        serialize_name: slugName,
        localization_name: slugName,
        skins: skins.map((skin) => ({
          localization_name: skin.name.replace(/[^a-zA-Z0-9]/g, ""),
          geometry: skin.geometry,
          texture: skin.textureName,
          type: skin.type,
        })),
      }
      zip.file("skins.json", JSON.stringify(skinsJson, null, 2))

      const textsFolder = zip.folder("texts")
      if (textsFolder) {
        textsFolder.file("languages.json", JSON.stringify(["en_US"], null, 2))
        let langContent = `skinpack.${slugName}=${packName}\n`
        skins.forEach((skin) => {
          const skinKey = skin.name.replace(/[^a-zA-Z0-9]/g, "")
          langContent += `skin.${slugName}.${skinKey}=${skin.name}\n`
        })
        textsFolder.file("en_US.lang", langContent)
      }

      for (const skin of skins) {
        if (skin.textureFile) zip.file(skin.textureName, skin.textureFile)
      }

      const blob = await zip.generateAsync({ type: "blob" })
      const filename = `${packName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.mcpack`

      setPendingDownload({ blob, filename })
      setExportMessage("Generated! Confirm download.")
    } catch (err: unknown) {
      setExportMessage(
        `Export failed: ${err instanceof Error ? err.message : String(err)}`
      )
    } finally {
      setExporting(false)
    }
  }

  const confirmDownload = () => {
    if (!pendingDownload) return
    const link = document.createElement("a")
    link.href = URL.createObjectURL(pendingDownload.blob)
    link.download = pendingDownload.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
    setPendingDownload(null)
    setExportMessage("Success! Download started.")
    setTimeout(() => setExportMessage(""), 5000)
  }

  const cancelDownload = () => {
    setPendingDownload(null)
    setExportMessage("Download cancelled.")
    setTimeout(() => setExportMessage(""), 4000)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      skins.forEach((skin) => {
        if (skin.textureUrl) URL.revokeObjectURL(skin.textureUrl)
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    packName,
    setPackName,
    packVersion,
    setPackVersion,
    skins,
    selectedSkinId,
    setSelectedSkinId,
    exporting,
    exportMessage,
    addNewSkin,
    removeSkin,
    updateSkin,
    handleTextureUpload,
    handleExport,
    pendingDownload,
    confirmDownload,
    cancelDownload,
  }
}
