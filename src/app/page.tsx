"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Sparkles,
  Plus,
  Trash2,
  Upload,
  Info,
  FolderOpen,
  User,
  Settings,
  HelpCircle,
  FileJson,
  Puzzle,
} from "lucide-react"

// Generate version 4 UUID
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

// Minecraft skin geometry models
type GeometryType = "geometry.humanoid.custom" | "geometry.humanoid.customSlim"
type SkinType = "free" | "paid"

interface SkinItem {
  id: string
  name: string
  geometry: GeometryType
  type: SkinType
  textureName: string
  textureFile: File | null
  textureUrl: string // Object URL for preview
}

export default function SkinPackMaker() {
  // Pack metadata state
  const [packName, setPackName] = useState("My Custom Skin Pack")
  const [packVersion, setPackVersion] = useState("1.0.0")
  const [localPackName, setLocalPackName] = useState("My Custom Skin Pack")
  const [localPackVersion, setLocalPackVersion] = useState("1.0.0")
  const [uuidHeader] = useState(() => generateUUID())
  const [uuidModule] = useState(() => generateUUID())

  // Skins state
  const [skins, setSkins] = useState<SkinItem[]>(() => [
    {
      id: "skin-1",
      name: "Skin 1",
      geometry: "geometry.humanoid.custom", // Standard (Steve)
      type: "free",
      textureName: "skin_1.png",
      textureFile: null,
      textureUrl: "",
    },
  ])
  const [selectedSkinId, setSelectedSkinId] = useState<string | null>("skin-1")
  const [localSkinName, setLocalSkinName] = useState("Skin 1")

  // Status and logs
  const [exporting, setExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState("")

  const currentSkin = skins.find((s) => s.id === selectedSkinId)

  // Track previous selected skin ID to sync input when selection moves
  const [prevSelectedId, setPrevSelectedId] = useState<string | null>("skin-1")
  if (selectedSkinId !== prevSelectedId) {
    setPrevSelectedId(selectedSkinId)
    if (currentSkin) {
      setLocalSkinName(currentSkin.name)
    }
  }

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
      setSkins([...skins, newSkin])
      setSelectedSkinId(id)
    }
  }

  const removeSkin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
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
    setSkins(skins.map((s) => (s.id === id ? { ...s, ...updates } : s)))
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

    // Auto-detect standard (Steve) vs. slim (Alex) model
    const img = new Image()
    img.src = url
    img.onload = () => {
      // Check arm pixels transparency:
      // Alex (slim, 3px arms) uses 3 columns. If it's a 64x64 skin:
      // The right arm occupies X: 40-47, Y: 20-32 (standard) vs X: 40-46, Y: 20-32 (slim).
      // A common way to check for Alex is to verify if column 47 is transparent in the arm area, or checking translucent zones.
      // Even simpler: Minecraft skin formats have the Right Arm layout:
      // In 64x64/64x32 layout: Right arm starts at pixel (44, 20) with width 4 (Steve) or 3 (Alex).
      // So column X=47 (0-indexed) inside Y=20-32 is checked. If they are completely transparent (alpha = 0), it's slim.
      let detectedGeometry: GeometryType = "geometry.humanoid.custom"
      try {
        const tempCanvas = document.createElement("canvas")
        tempCanvas.width = img.naturalWidth
        tempCanvas.height = img.naturalHeight
        const tempCtx = tempCanvas.getContext("2d")
        if (tempCtx) {
          tempCtx.drawImage(img, 0, 0)
          // Look at Right Arm column X = 47. (In standard skin layout, column 47 has pixels for Right Arm).
          // If we read column X=47 from Y=20 to Y=31, let's see if it's empty (fully transparent).
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

  const handleAddFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file) => addNewSkin(file))
    }
  }

  return (
    <div className="bg-background/95 text-foreground selection:bg-primary/20 selection:text-primary relative min-h-screen w-full overflow-x-hidden pb-12 font-sans antialiased">
      {/* Background glow meshes - Moss Green & Earthen Clay */}
      <div className="bg-primary/3 pointer-events-none absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-0 h-[600px] w-[600px] rounded-full bg-amber-600/2 blur-[180px]" />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Banner Title */}
        <div className="border-border mb-8 flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="border-primary/30 bg-card text-primary rounded-[4px] border p-2 shadow-[0_0_12px_rgba(0,230,118,0.15)] transition-transform hover:rotate-3">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-sans text-sm font-semibold tracking-[0.1em] text-white uppercase">
                MC Bedrock Skin Pack Maker
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-muted-foreground font-mono text-[9px] tracking-wider uppercase">
                  OREUI MODERN EDITION
                </span>
                <span className="bg-primary/60 h-1 w-1 rounded-full" />
                <span className="bg-primary/10 border-primary/20 text-primary rounded-[2px] border px-1.5 py-0.5 text-[8px] font-bold">
                  v1.21+ COMPATIBLE
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left panel: configurations */}
          <section className="space-y-6 lg:col-span-4">
            {/* Pack Settings Card */}
            <div className="border-border bg-card hover:border-primary/25 relative overflow-hidden rounded-[4px] border p-6 shadow-md transition-all duration-350">
              <div className="from-primary/80 absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r to-amber-600/40" />
              <h2 className="text-primary mb-5 flex items-center gap-2 text-[10px] font-semibold tracking-[0.15em] uppercase">
                <Settings className="text-muted-foreground h-4 w-4" />
                <span>Pack Settings</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-muted-foreground mb-1.5 block text-[10px] font-semibold tracking-[0.1em] uppercase">
                    Pack Display Name
                  </label>
                  <input
                    type="text"
                    value={localPackName}
                    onChange={(e) => setLocalPackName(e.target.value)}
                    onBlur={() => setPackName(localPackName)}
                    className="border-border/80 bg-background/50 focus:border-primary focus:ring-primary/20 w-full rounded-[4px] border px-3 py-2 font-sans text-xs text-white shadow-inner transition-all outline-none focus:ring-1"
                    placeholder="Enter pack name..."
                  />
                </div>
                <div>
                  <label className="text-muted-foreground mb-1.5 block text-[10px] font-semibold tracking-[0.1em] uppercase">
                    Pack Version
                  </label>
                  <input
                    type="text"
                    value={localPackVersion}
                    onChange={(e) => setLocalPackVersion(e.target.value)}
                    onBlur={() => setPackVersion(localPackVersion)}
                    className="border-border/80 bg-background/50 focus:border-primary focus:ring-primary/20 w-full rounded-[4px] border px-3 py-2 font-sans text-xs text-white shadow-inner transition-all outline-none focus:ring-1"
                    placeholder="1.0.0"
                  />
                </div>
              </div>
            </div>

            {/* Skins List Card */}
            <div className="border-border bg-card hover:border-primary/25 rounded-[4px] border p-6 shadow-md transition-all duration-350">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-primary flex items-center gap-2 text-[10px] font-semibold tracking-[0.15em] uppercase">
                  <User className="text-muted-foreground h-4 w-4" />
                  <span>Skins ({skins.length})</span>
                </h2>
                <div className="flex gap-2">
                  <label className="bg-primary text-primary-foreground hover:bg-primary/90 glow-moss flex cursor-pointer items-center justify-center gap-1 rounded-[4px] px-3 py-1.5 text-[10px] font-bold transition-all">
                    <Upload className="h-3.5 w-3.5 stroke-[2.5]" />
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
                    onClick={() => addNewSkin()}
                    className="border-border bg-background text-muted-foreground hover:border-primary/30 flex items-center justify-center rounded-[4px] border px-2.5 py-1.5 text-[10px] font-bold transition-all hover:text-white"
                    title="Add empty slot"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="custom-scrollbar max-h-[350px] space-y-2 overflow-y-auto pr-1">
                {skins.map((skin) => (
                  <div
                    key={skin.id}
                    onClick={() => setSelectedSkinId(skin.id)}
                    className={`group/skin flex cursor-pointer items-center justify-between rounded-[4px] border p-3 transition-all ${
                      selectedSkinId === skin.id
                        ? "border-primary bg-primary/5 shadow-[0_0_10px_rgba(0,230,118,0.06)]"
                        : "border-border/60 bg-background/30 hover:border-primary/30"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          skin.textureFile ? "bg-primary" : "bg-amber-600/40"
                        }`}
                      />
                      <span className="truncate text-xs font-semibold text-zinc-200">
                        {skin.name}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-[2px] px-1.5 py-0.5 text-[8px] font-bold ${
                          skin.type === "paid"
                            ? "border border-amber-500/25 bg-amber-500/10 text-amber-400"
                            : "bg-primary/10 border-primary/20 text-primary border"
                        }`}
                      >
                        {skin.type.toUpperCase()}
                      </span>
                      <button
                        onClick={(e) => removeSkin(skin.id, e)}
                        className="text-muted-foreground p-0.5 opacity-30 transition-all hover:text-red-400 hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Card */}
            <div className="border-border bg-card hover:border-primary/25 rounded-[4px] border p-6 text-center shadow-md transition-all duration-350">
              <button
                onClick={handleExport}
                disabled={exporting || skins.length === 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground glow-moss w-full cursor-pointer rounded-[4px] py-3 text-xs font-bold tracking-[0.1em] uppercase transition-all duration-200"
              >
                <span>{exporting ? "Generating..." : "Export .mcpack"}</span>
              </button>
              {exportMessage && (
                <p className="text-muted-foreground mt-3 animate-pulse text-xs">
                  {exportMessage}
                </p>
              )}
            </div>
          </section>

          {/* Right panel: detail workspace */}
          <section className="space-y-6 lg:col-span-8">
            {currentSkin ? (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
                {/* 2D Projection view */}
                <div className="border-border bg-card hover:border-primary/25 flex flex-col items-center justify-between rounded-[4px] border p-6 shadow-md transition-all duration-350 md:col-span-5">
                  <div className="border-border mb-4 flex w-full items-center justify-between border-b pb-2.5">
                    <h3 className="text-muted-foreground text-[10px] font-semibold tracking-[0.1em] uppercase">
                      Skin Projection
                    </h3>
                    <span className="bg-primary/10 border-primary/20 text-primary rounded-[2px] border px-1 font-mono text-[8px] uppercase">
                      2D Live View
                    </span>
                  </div>
                  <div className="group border-border bg-background hover:border-primary/30 relative rounded-[4px] border p-4 shadow-inner transition-all duration-300">
                    <div className="from-primary/3 pointer-events-none absolute inset-0 rounded-[4px] bg-gradient-to-tr to-transparent" />
                    <SkinPreviewCanvas
                      textureUrl={currentSkin.textureUrl}
                      geometry={currentSkin.geometry}
                    />
                  </div>
                  <div className="mt-4 space-y-1 text-center">
                    <p className="text-xs font-semibold tracking-wide text-white">
                      {currentSkin.name}
                    </p>
                    <p className="text-muted-foreground max-w-[200px] text-[9px] leading-4">
                      Real-time projection showing the loaded head, body, limbs,
                      and clothing layers.
                    </p>
                  </div>
                </div>

                {/* Edit Form */}
                <div className="border-border bg-card hover:border-primary/25 flex flex-col justify-between rounded-[4px] border p-6 shadow-md transition-all duration-350 md:col-span-7">
                  <div className="space-y-5">
                    <div className="border-border border-b pb-3.5">
                      <h3 className="text-xs font-semibold tracking-[0.1em] text-zinc-200 uppercase">
                        Edit Skin Metadata
                      </h3>
                      <p className="text-muted-foreground mt-1 text-[10px]">
                        Configure skin settings for the Bedrock metadata bundle
                      </p>
                    </div>

                    <div>
                      <label className="text-muted-foreground mb-2 block text-[10px] font-semibold tracking-[0.1em] uppercase">
                        Skin Display Name
                      </label>
                      <input
                        type="text"
                        value={localSkinName}
                        onChange={(e) => setLocalSkinName(e.target.value)}
                        onBlur={() => {
                          if (currentSkin && localSkinName.trim()) {
                            updateSkin(currentSkin.id, {
                              name: localSkinName.trim(),
                            })
                          }
                        }}
                        className="border-border/80 bg-background/50 focus:border-primary focus:ring-primary/20 w-full rounded-[4px] border px-3 py-2 font-sans text-xs text-white shadow-inner transition-all outline-none focus:ring-1"
                      />
                    </div>

                    <div>
                      <label className="text-muted-foreground mb-2.5 block text-[10px] font-semibold tracking-[0.1em] uppercase">
                        Model Geometry (Arm Width)
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            updateSkin(currentSkin.id, {
                              geometry: "geometry.humanoid.custom",
                            })
                          }
                          className={`cursor-pointer rounded-[4px] border p-3 text-left transition-all ${
                            currentSkin.geometry === "geometry.humanoid.custom"
                              ? "border-primary bg-primary/5 text-primary shadow-[0_0_10px_rgba(0,230,118,0.08)]"
                              : "border-border bg-background text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          <p className="text-[10px] font-bold tracking-[0.05em] uppercase">
                            Steve model
                          </p>
                          <span className="text-muted-foreground mt-1 block font-sans text-[9px]">
                            Standard size (4px arms)
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateSkin(currentSkin.id, {
                              geometry: "geometry.humanoid.customSlim",
                            })
                          }
                          className={`cursor-pointer rounded-[4px] border p-3 text-left transition-all ${
                            currentSkin.geometry ===
                            "geometry.humanoid.customSlim"
                              ? "border-primary bg-primary/5 text-primary shadow-[0_0_10px_rgba(0,230,118,0.08)]"
                              : "border-border bg-background text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          <p className="text-[10px] font-bold tracking-[0.05em] uppercase">
                            Alex model
                          </p>
                          <span className="text-muted-foreground mt-1 block font-sans text-[9px]">
                            Slim size (3px arms)
                          </span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-muted-foreground mb-2.5 block text-[10px] font-semibold tracking-[0.1em] uppercase">
                        Accessibility Tier (Minecraft Store Type)
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            updateSkin(currentSkin.id, { type: "free" })
                          }
                          className={`cursor-pointer rounded-[4px] border p-2.5 text-center text-[9px] font-semibold tracking-[0.05em] uppercase transition-all ${
                            currentSkin.type === "free"
                              ? "border-primary bg-primary/10 text-primary glow-moss shadow-[0_0_10px_rgba(0,230,118,0.1)]"
                              : "border-border bg-background text-muted-foreground hover:border-primary/25"
                          }`}
                        >
                          FREE (EMERALD TIER)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateSkin(currentSkin.id, { type: "paid" })
                          }
                          className={`cursor-pointer rounded-[4px] border p-2.5 text-center text-[9px] font-semibold tracking-[0.05em] uppercase transition-all ${
                            currentSkin.type === "paid"
                              ? "glow-clay border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                              : "border-border bg-background text-muted-foreground hover:border-amber-500/25"
                          }`}
                        >
                          PAID (GOLD TIER)
                        </button>
                      </div>
                    </div>

                    {/* Image Upload Area */}
                    <div>
                      <label className="text-muted-foreground mb-2 block text-[10px] font-semibold tracking-[0.1em] uppercase">
                        Minecraft Skin Texture (PNG)
                      </label>
                      <TextureUploadBox
                        skin={currentSkin}
                        onUpload={(file) =>
                          handleTextureUpload(currentSkin.id, file)
                        }
                      />
                    </div>
                  </div>

                  <div className="border-border/80 text-muted-foreground mt-6 flex items-center gap-2 border-t pt-4 font-sans text-[10px]">
                    <Info className="text-primary h-4 w-4 shrink-0" />
                    <span>
                      Upload a standard 64x64 or 64x32 PNG skin texture file.
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-border bg-card text-muted-foreground hover:border-primary/25 rounded-[4px] border border-dashed p-12 text-center shadow-md transition-all duration-350">
                <HelpCircle className="text-muted/80 mx-auto mb-3 h-12 w-12" />
                <p className="text-xs font-semibold tracking-[0.1em] text-zinc-300 uppercase">
                  NO SKIN SELECTED
                </p>
                <p className="text-muted-foreground mt-1 font-sans text-[10px]">
                  Select a skin from the panel lists or click ADD PNG to create
                  a new skin slot.
                </p>
              </div>
            )}

            {/* Reference info guidelines Card */}
            <div className="border-border bg-card hover:border-primary/25 space-y-4 rounded-[4px] border p-6 shadow-md transition-all duration-350">
              <h3 className="text-primary flex items-center gap-2 text-[10px] font-semibold tracking-[0.15em] uppercase">
                <FolderOpen className="text-muted-foreground h-4 w-4" />
                <span>Bedrock Skinpack Packaging Manifest Schema</span>
              </h3>
              <div className="text-muted-foreground grid grid-cols-1 gap-4 font-sans text-xs md:grid-cols-2">
                <div className="border-border/60 bg-background/20 space-y-2 rounded-[4px] border p-4">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.05em] text-zinc-200 uppercase">
                    <FileJson className="text-muted-foreground h-3.5 w-3.5" />
                    <span>File Manifest Structure</span>
                  </p>
                  <ul className="text-muted-foreground list-disc space-y-1 pl-4 text-[11px]">
                    <li>
                      <code>manifest.json</code>: General metadata structure.
                    </li>
                    <li>
                      <code>skins.json</code>: References textures & geometry
                      models.
                    </li>
                    <li>
                      <code>texts/en_US.lang</code>: Localizes keys on Bedrock
                      systems.
                    </li>
                  </ul>
                </div>
                <div className="border-border/60 bg-background/20 space-y-2 rounded-[4px] border p-4">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.05em] text-zinc-200 uppercase">
                    <Puzzle className="text-muted-foreground h-3.5 w-3.5" />
                    <span>Geometric Parameters</span>
                  </p>
                  <ul className="text-muted-foreground list-disc space-y-1 pl-4 text-[11px]">
                    <li>
                      <strong>Steve:</strong>{" "}
                      <code>geometry.humanoid.custom</code> (4px arms).
                    </li>
                    <li>
                      <strong>Alex:</strong>{" "}
                      <code>geometry.humanoid.customSlim</code> (3px arms).
                    </li>
                    <li>Supports standard 64x64px or 64x32px PNG images.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------
// Subcomponent: Texture Upload Area
// ---------------------------------------------------------------------
interface TextureUploadBoxProps {
  skin: SkinItem
  onUpload: (file: File) => void
}

function TextureUploadBox({ skin, onUpload }: TextureUploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0])
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
      className={`cursor-pointer rounded-[4px] border border-dashed p-6 text-center transition-all ${
        isDragOver
          ? "border-[#00e676] bg-[#00e676]/5 shadow-[0_0_12px_rgba(0,230,118,0.1)]"
          : skin.textureFile
            ? "border-[#00e676]/40 bg-white/[0.02]"
            : "border-zinc-800 bg-[#121212]/50 hover:border-[#00e676]/30 hover:bg-[#121212]/80"
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png"
        className="hidden"
      />
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="rounded-[4px] border border-zinc-800 bg-[#1a1a1a] p-2.5 text-zinc-400 transition-all group-hover:text-[#00e676]">
          <Upload className="h-5 w-5 text-zinc-500" />
        </div>
        <div>
          {skin.textureFile ? (
            <>
              <p className="text-xs font-bold tracking-[0.05em] text-[#00e676] uppercase">
                TEXTURE LOADED
              </p>
              <p
                className="mx-auto mt-1.5 max-w-[280px] truncate font-mono text-[9px] text-zinc-500"
                title={skin.textureFile.name}
              >
                {skin.textureFile.name}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold tracking-[0.05em] text-zinc-300 uppercase">
                DRAG & DROP SKIN PNG HERE
              </p>
              <p className="mt-1.5 font-sans text-[10px] text-zinc-600">
                or click to browse files
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------
// Subcomponent: Skin Pixel-Perfect 2D Avatar projection
// ---------------------------------------------------------------------
interface SkinPreviewCanvasProps {
  textureUrl: string
  geometry: GeometryType
}

interface ExtendedCanvasRenderingContext2D extends CanvasRenderingContext2D {
  mozImageSmoothingEnabled?: boolean
  webkitImageSmoothingEnabled?: boolean
  msImageSmoothingEnabled?: boolean
}

const SkinPreviewCanvas = React.memo(function SkinPreviewCanvas({
  textureUrl,
  geometry,
}: SkinPreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const drawPlaceholder = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number
  ) => {
    // Steve silhouette or empty placeholder grid
    ctx.strokeStyle = "#202020"
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 4])

    // Draw guide lines
    ctx.strokeRect(20, 20, w - 40, h - 40)

    // Head guide
    ctx.strokeRect(w / 2 - 24, 20, 48, 48)
    // Body guide
    ctx.strokeRect(w / 2 - 24, 68, 48, 72)
    // Left Arm guide
    ctx.strokeRect(w / 2 - 48, 68, 24, 72)
    // Right Arm guide
    ctx.strokeRect(w / 2 + 24, 68, 24, 72)
    // Legs guide
    ctx.strokeRect(w / 2 - 24, 140, 24, 72)
    ctx.strokeRect(w / 2, 140, 24, 72)

    // Center text
    ctx.fillStyle = "#444"
    ctx.font = "bold 9px system-ui, sans-serif"
    ctx.textAlign = "center"
    ctx.setLineDash([])
    ctx.fillText("AWAITING PNG", w / 2, h / 2 + 30)
  }

  useEffect(() => {
    let active = true
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Render placeholder grid if no texture is loaded
    if (!textureUrl) {
      drawPlaceholder(ctx, canvas.width, canvas.height)
      return
    }

    const img = new Image()
    img.src = textureUrl
    img.onload = () => {
      if (!active) return
      // Clear again
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Determine format: 64x64 or 64x32
      const isHeight64 =
        img.naturalHeight === 64 || img.naturalHeight === img.naturalWidth
      const isSlim = geometry === "geometry.humanoid.customSlim"

      // We want to draw a blocky projection of Steve/Alex
      // Set image quality settings for pixel art
      const eCtx = ctx as ExtendedCanvasRenderingContext2D
      eCtx.imageSmoothingEnabled = false
      eCtx.mozImageSmoothingEnabled = false
      eCtx.webkitImageSmoothingEnabled = false
      eCtx.msImageSmoothingEnabled = false

      // Standard positions relative to center of a 200x240 canvas:
      // Center X = 100
      const cX = canvas.width / 2

      // Head: 8x8 pixels -> Draw at (cX - 24, 20) with size 48x48
      const headX = cX - 24
      const headY = 20
      const headSize = 48

      // Body: 8x12 pixels -> Draw at (cX - 24, 68) with size 48x72
      const bodyX = cX - 24
      const bodyY = 68
      const bodyW = 48
      const bodyH = 72

      // Left Arm: 4x12 (Steve) or 3x12 (Alex) -> Draw at (cX - 24 - armW, 68)
      const armW = isSlim ? 18 : 24
      const leftArmX = bodyX - armW
      const rightArmX = bodyX + bodyW

      // Legs: 4x12 pixels -> Draw at (cX - 24, 140) and (cX, 140) with size 24x72 each
      const legW = 24
      const legH = 72
      const leftLegX = cX - legW
      const rightLegX = cX

      // Helper function to draw body parts
      // Src coordinates format: [srcX, srcY, srcW, srcH]

      // 1. Draw Legs
      // Right Leg (base): (4, 20) to (8, 32)
      ctx.drawImage(img, 4, 20, 4, 12, leftLegX, 140, legW, legH)

      // Left Leg (base)
      if (isHeight64) {
        // (20, 52) to (24, 64)
        ctx.drawImage(img, 20, 52, 4, 12, rightLegX, 140, legW, legH)
      } else {
        // Mirrored or duplicated right leg
        ctx.drawImage(img, 4, 20, 4, 12, rightLegX, 140, legW, legH)
      }

      // Outer Pants layer (overlays for legs)
      if (isHeight64) {
        // Right Leg pants: (4, 36) -> (8, 48)
        ctx.drawImage(img, 4, 36, 4, 12, leftLegX, 140, legW, legH)
        // Left Leg pants: (4, 52) -> (8, 64)
        ctx.drawImage(img, 4, 52, 4, 12, rightLegX, 140, legW, legH)
      }

      // 2. Draw Body (base): (20, 20) to (28, 32)
      ctx.drawImage(img, 20, 20, 8, 12, bodyX, bodyY, bodyW, bodyH)

      // Outer Body Jacket layer: (20, 36) to (28, 48)
      if (isHeight64) {
        ctx.drawImage(img, 20, 36, 8, 12, bodyX, bodyY, bodyW, bodyH)
      }

      // 3. Draw Arms
      // Right Arm (base): (44, 20) to (48, 32)
      const srcArmW = isSlim ? 3 : 4
      ctx.drawImage(img, 44, 20, srcArmW, 12, leftArmX, 68, armW, bodyH)

      // Left Arm (base)
      if (isHeight64) {
        // (36, 52) to (40, 64)
        ctx.drawImage(img, 36, 52, srcArmW, 12, rightArmX, 68, armW, bodyH)
      } else {
        // Mirror right arm
        ctx.drawImage(img, 44, 20, srcArmW, 12, rightArmX, 68, armW, bodyH)
      }

      // Outer Sleeves layer
      if (isHeight64) {
        // Right Arm sleeve: (44, 36)
        ctx.drawImage(img, 44, 36, srcArmW, 12, leftArmX, 68, armW, bodyH)
        // Left Arm sleeve: (52, 52)
        ctx.drawImage(img, 52, 52, srcArmW, 12, rightArmX, 68, armW, bodyH)
      }

      // 4. Draw Head (base): (8, 8) to (16, 16)
      ctx.drawImage(img, 8, 8, 8, 8, headX, headY, headSize, headSize)

      // Outer Hat layer: (40, 8) to (48, 16)
      ctx.drawImage(img, 40, 8, 8, 8, headX, headY, headSize, headSize)
    }

    img.onerror = () => {
      if (!active) return
      drawPlaceholder(ctx, canvas.width, canvas.height)
    }

    return () => {
      active = false
    }
  }, [textureUrl, geometry])

  return (
    <div className="relative flex aspect-[4/5] w-full max-w-[240px] items-center justify-center overflow-hidden bg-transparent p-1 select-none">
      <canvas
        ref={canvasRef}
        width={200}
        height={240}
        className="pixelated relative z-10 select-none"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  )
})
