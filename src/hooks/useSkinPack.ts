import { useState, useEffect, useRef } from "react"
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

function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(",")
  const mimeMatch = arr[0].match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : "image/png"
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

interface SavedSkin {
  id: string
  name: string
  placeholderName: string
  geometry: GeometryType
  type: "free" | "paid"
  textureName: string
  textureUrl: string
}

export function useSkinPack() {
  const [packName, setPackName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("skin_pack_name") || "My Custom Skin Pack"
    }
    return "My Custom Skin Pack"
  })
  const [packVersion, setPackVersion] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("skin_pack_version") || "1.0.0"
    }
    return "1.0.0"
  })
  const [uuidHeader, setUuidHeader] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("skin_pack_uuid_header") || generateUUID()
    }
    return generateUUID()
  })
  const [uuidModule, setUuidModule] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("skin_pack_uuid_module") || generateUUID()
    }
    return generateUUID()
  })
  const [activeProcesses, setActiveProcesses] = useState(0)

  const [skins, setSkins] = useState<SkinItem[]>(() => {
    if (typeof window !== "undefined") {
      const savedSkinsStr = localStorage.getItem("skin_pack_skins")
      if (savedSkinsStr) {
        try {
          const parsedSkins = JSON.parse(savedSkinsStr) as SavedSkin[]
          return parsedSkins.map((s, index) => {
            let file: File | null = null
            if (s.textureUrl && s.textureUrl.startsWith("data:")) {
              try {
                file = dataURLtoFile(s.textureUrl, s.textureName)
              } catch (err) {
                console.error("Failed to reconstruct file from data url", err)
              }
            }
            return {
              id: s.id,
              name: s.name || "",
              placeholderName: s.placeholderName || `Skin ${index + 1}`,
              geometry: s.geometry,
              type: s.type,
              textureName: s.textureName,
              textureFile: file,
              textureUrl: s.textureUrl,
            }
          })
        } catch (err) {
          console.error("Failed to parse saved skins", err)
        }
      }
    }
    return []
  })

  const [selectedSkinId, setSelectedSkinId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const savedSkinsStr = localStorage.getItem("skin_pack_skins")
      if (savedSkinsStr) {
        try {
          const parsedSkins = JSON.parse(savedSkinsStr) as SavedSkin[]
          if (parsedSkins.length > 0) {
            return parsedSkins[0].id
          }
        } catch {}
      }
    }
    return null
  })

  const [exporting, setExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState("")
  const [pendingDownload, setPendingDownload] = useState<{
    blob: Blob
    filename: string
  } | null>(null)

  const [toast, setToast] = useState<{
    message: string
    type: "success" | "error" | "info"
  } | null>(null)

  const lastDeleteTimestamp = useRef(0)
  const saveSkinsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setToast({ message, type })
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev))
    }, 4500)
  }

  // Save metadata immediately; debounce skins to avoid blocking main thread during drag reorder
  useEffect(() => {
    if (typeof window === "undefined") return

    localStorage.setItem("skin_pack_name", packName)
    localStorage.setItem("skin_pack_version", packVersion)
    localStorage.setItem("skin_pack_uuid_header", uuidHeader)
    localStorage.setItem("skin_pack_uuid_module", uuidModule)

    if (saveSkinsTimeoutRef.current) clearTimeout(saveSkinsTimeoutRef.current)
    saveSkinsTimeoutRef.current = setTimeout(() => {
      const skinsToSave = skins.map((s) => ({
        id: s.id,
        name: s.name,
        placeholderName: s.placeholderName,
        geometry: s.geometry,
        type: s.type,
        textureName: s.textureName,
        textureUrl: s.textureUrl,
      }))
      localStorage.setItem("skin_pack_skins", JSON.stringify(skinsToSave))
    }, 400)
  }, [packName, packVersion, uuidHeader, uuidModule, skins])

  const addNewSkin = (file: File) => {
    if (!file.type.includes("image/png")) {
      alert("Please upload a PNG image file!")
      return
    }

    const now = Date.now()
    if (now - lastDeleteTimestamp.current < 3000) {
      showToast("Wait 3s after deleting a skin.", "info")
      return
    }

    const id = Math.random().toString(36).slice(2, 11)
    const count = skins.length + 1

    setActiveProcesses((p) => p + 1)

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const dataUrl = reader.result as string
      const img = new Image()
      img.src = dataUrl
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
          name: "",
          placeholderName: `Skin ${count}`,
          geometry: detectedGeometry,
          type: "free",
          textureUrl: dataUrl,
          textureFile: file,
          textureName: `skin_${id}.png`,
        }
        setSkins((prev) => [...prev, newSkin])
        setSelectedSkinId(id)
        setTimeout(() => {
          setActiveProcesses((p) => Math.max(0, p - 1))
        }, 600)
      }
      img.onerror = () => {
        setActiveProcesses((p) => Math.max(0, p - 1))
      }
    }
    reader.onerror = () => {
      setActiveProcesses((p) => Math.max(0, p - 1))
    }
  }

  const removeSkin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    lastDeleteTimestamp.current = Date.now()
    setSkins((prev) => {
      const target = prev.find((s) => s.id === id)
      if (
        target &&
        target.textureUrl &&
        !target.textureUrl.startsWith("data:")
      ) {
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

    setActiveProcesses((p) => p + 1)

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const dataUrl = reader.result as string
      const img = new Image()
      img.src = dataUrl
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
              if (s.textureUrl && !s.textureUrl.startsWith("data:")) {
                URL.revokeObjectURL(s.textureUrl)
              }
              return {
                ...s,
                textureUrl: dataUrl,
                textureFile: file,
                geometry: detectedGeometry,
              }
            }
            return s
          })
        )
        setTimeout(() => {
          setActiveProcesses((p) => Math.max(0, p - 1))
        }, 600)
      }
      img.onerror = () => {
        setActiveProcesses((p) => Math.max(0, p - 1))
      }
    }
    reader.onerror = () => {
      setActiveProcesses((p) => Math.max(0, p - 1))
    }
  }

  const handleExport = async () => {
    if (skins.length === 0) return

    // 1. Validation: check for empty skin display names
    const unnamedSkin = skins.find((s) => !s.name.trim())
    if (unnamedSkin) {
      setSelectedSkinId(unnamedSkin.id)
      showToast("Please enter a display name for all skins.", "error")
      setExportMessage("Export cancelled: unnamed skins found.")

      setTimeout(() => {
        const inputEl = document.getElementById(`skin-name-${unnamedSkin.id}`)
        if (inputEl) {
          inputEl.scrollIntoView({ behavior: "smooth", block: "center" })
          inputEl.focus()
          inputEl.classList.add("ring-2", "ring-red-500", "animate-pulse")
          setTimeout(() => {
            inputEl.classList.remove("ring-2", "ring-red-500", "animate-pulse")
          }, 3000)
        }
      }, 250)
      return
    }

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

      const rawBlob = await zip.generateAsync({ type: "blob" })
      const blob = new Blob([rawBlob], { type: "application/octet-stream" })
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
    showToast("Download started successfully!", "success")
    setTimeout(() => setExportMessage(""), 5000)
  }

  const cancelDownload = () => {
    setPendingDownload(null)
    setExportMessage("Download cancelled.")
    showToast("Download cancelled.", "info")
    setTimeout(() => setExportMessage(""), 4000)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveSkinsTimeoutRef.current) clearTimeout(saveSkinsTimeoutRef.current)
      skins.forEach((skin) => {
        if (skin.textureUrl && !skin.textureUrl.startsWith("data:")) {
          URL.revokeObjectURL(skin.textureUrl)
        }
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const importMcpack = async (file: File) => {
    setActiveProcesses((p) => p + 1)
    try {
      const { parseMcpack } = await import("../lib/mcpackParser")
      const parsed = await parseMcpack(file)

      // Clear previous object URLs
      skins.forEach((s) => {
        if (s.textureUrl && !s.textureUrl.startsWith("data:")) {
          URL.revokeObjectURL(s.textureUrl)
        }
      })

      setPackName(parsed.packName)
      setPackVersion(parsed.packVersion)
      setUuidHeader(parsed.uuidHeader || generateUUID())
      setUuidModule(parsed.uuidModule || generateUUID())
      setSkins(parsed.skins)

      if (parsed.skins.length > 0) {
        setSelectedSkinId(parsed.skins[0].id)
      } else {
        setSelectedSkinId(null)
      }

      if (parsed.warnings.length > 0) {
        console.warn("Warnings during import:", parsed.warnings)
        showToast(
          `Pack loaded! ${parsed.skins.length} skins imported. (${parsed.warnings.length} warnings)`,
          "info"
        )
      } else {
        showToast(
          `Pack loaded! ${parsed.skins.length} skins imported.`,
          "success"
        )
      }
    } catch (err: unknown) {
      console.error(err)
      showToast(
        err instanceof Error ? err.message : "Failed to import skin pack.",
        "error"
      )
    } finally {
      setActiveProcesses((p) => Math.max(0, p - 1))
    }
  }

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
    toast,
    showToast,
    processingSkins: activeProcesses > 0,
    importMcpack,
    reorderSkins: (startIndex: number, endIndex: number) => {
      setSkins((prev) => {
        const result = Array.from(prev)
        const [removed] = result.splice(startIndex, 1)
        result.splice(endIndex, 0, removed)
        return result
      })
    },
  }
}
