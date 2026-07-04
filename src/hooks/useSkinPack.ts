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

  const [skins, setSkins] = useState<SkinItem[]>(() => [
    {
      id: "skin-1",
      name: "Skin 1",
      geometry: "geometry.humanoid.custom",
      type: "free",
      textureName: "skin_1.png",
      textureFile: null,
      textureUrl: "",
    },
  ])
  const [selectedSkinId, setSelectedSkinId] = useState<string | null>("skin-1")

  const [exporting, setExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState("")

  const addNewSkin = (file?: File) => {
    const id = Math.random().toString(36).slice(2, 11)
    const count = skins.length + 1

    if (file) {
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
          tempCanvas.width = img.naturalWidth
          tempCanvas.height = img.naturalHeight
          const tempCtx = tempCanvas.getContext("2d")
          if (tempCtx) {
            tempCtx.drawImage(img, 0, 0)
            const imgData = tempCtx.getImageData(47, 20, 1, 12)
            let hasSolidPixel = false
            for (let i = 3; i < imgData.data.length; i += 4) {
              if (imgData.data[i] > 0) {
                hasSolidPixel = true
                break
              }
            }
            if (!hasSolidPixel && img.naturalHeight === 64) {
              detectedGeometry = "geometry.humanoid.customSlim"
            }
          }
        } catch (e) {
          console.warn("Could not auto-detect geometry:", e)
        }

        const newSkin: SkinItem = {
          id,
          name: file.name.replace(/\.[^/.]+$/, "") || `Skin ${count}`,
          geometry: detectedGeometry,
          type: "free",
          textureName: `skin_${id}.png`,
          textureFile: file,
          textureUrl: url,
        }
        setSkins((prev) => [...prev, newSkin])
        setSelectedSkinId(id)
      }
    } else {
      const newSkin: SkinItem = {
        id,
        name: `Skin ${count}`,
        geometry: "geometry.humanoid.custom",
        type: "free",
        textureName: `skin_${id}.png`,
        textureFile: null,
        textureUrl: "",
      }
      setSkins((prev) => [...prev, newSkin])
      setSelectedSkinId(id)
    }
  }

  const removeSkin = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const skinToRemove = skins.find((s) => s.id === id)
    if (skinToRemove?.textureUrl) {
      URL.revokeObjectURL(skinToRemove.textureUrl)
    }
    const updatedSkins = skins.filter((s) => s.id !== id)
    setSkins(updatedSkins)
    if (selectedSkinId === id) {
      setSelectedSkinId(updatedSkins.length > 0 ? updatedSkins[0].id : null)
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

    const existingSkin = skins.find((s) => s.id === id)
    if (existingSkin?.textureUrl) {
      URL.revokeObjectURL(existingSkin.textureUrl)
    }

    const url = URL.createObjectURL(file)
    const img = new Image()
    img.src = url
    img.onload = () => {
      let detectedGeometry: GeometryType = "geometry.humanoid.custom"
      try {
        const tempCanvas = document.createElement("canvas")
        tempCanvas.width = img.naturalWidth
        tempCanvas.height = img.naturalHeight
        const tempCtx = tempCanvas.getContext("2d")
        if (tempCtx) {
          tempCtx.drawImage(img, 0, 0)
          const imgData = tempCtx.getImageData(47, 20, 1, 12)
          let hasSolidPixel = false
          for (let i = 3; i < imgData.data.length; i += 4) {
            if (imgData.data[i] > 0) {
              hasSolidPixel = true
              break
            }
          }
          if (!hasSolidPixel && img.naturalHeight === 64) {
            detectedGeometry = "geometry.humanoid.customSlim"
          }
        }
      } catch (e) {
        console.warn("Could not auto-detect geometry model:", e)
      }

      updateSkin(id, {
        textureFile: file,
        textureUrl: url,
        textureName: `skin_${id}.png`,
        geometry: detectedGeometry,
      })
    }
  }

  const handleExport = async () => {
    if (skins.length === 0) {
      setExportMessage("Add at least one skin to export.")
      return
    }

    const unassignedSkins = skins.filter((s) => !s.textureFile)
    if (unassignedSkins.length > 0) {
      setExportMessage(
        `Warning: Skin "${unassignedSkins[0].name}" is missing a PNG texture.`
      )
      setSelectedSkinId(unassignedSkins[0].id)
      return
    }

    try {
      setExporting(true)
      setExportMessage("Generating pack structure...")

      const JSZip = (await import("jszip")).default
      const zip = new JSZip()
      const slugName = packName.replace(/[^a-zA-Z0-9]/g, "") || "CustomSkinPack"
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
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `${packName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.mcpack`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setExportMessage("Success! Download started.")
      setTimeout(() => setExportMessage(""), 8000)
    } catch (err: unknown) {
      setExportMessage(
        `Export failed: ${err instanceof Error ? err.message : String(err)}`
      )
    } finally {
      setExporting(false)
    }
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
  }
}
