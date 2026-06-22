"use client"
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useRef } from "react"
import JSZip from "jszip"
import {
  Sparkles,
  Plus,
  Trash2,
  Download,
  RefreshCw,
  Upload,
  Info,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  User,
  Settings,
  HelpCircle,
  FileCode,
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
  const [uuidHeader, setUuidHeader] = useState(() => generateUUID())
  const [uuidModule, setUuidModule] = useState(() => generateUUID())

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

  // Status and logs
  const [exporting, setExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState("")

  const regenerateUUIDs = () => {
    setUuidHeader(generateUUID())
    setUuidModule(generateUUID())
  }

  const addNewSkin = () => {
    const id = Math.random().toString(36).slice(2, 11)
    const count = skins.length + 1
    const newSkin: SkinItem = {
      id,
      name: `Skin ${count}`,
      geometry: "geometry.humanoid.custom", // Standard (Steve)
      type: "free",
      textureName: `skin_${id}.png`,
      textureFile: null,
      textureUrl: "",
    }
    setSkins([...skins, newSkin])
    setSelectedSkinId(id)
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

    // Create a local URL for rendering preview
    const url = URL.createObjectURL(file)
    updateSkin(id, {
      textureFile: file,
      textureUrl: url,
      textureName: `skin_${id}.png`, // unique name based on id to prevent collision & traversal
    })
  }

  const currentSkin = skins.find((s) => s.id === selectedSkinId)

  // Export skin pack to .mcpack
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

      const zip = new JSZip()
      const slugName = packName.replace(/[^a-zA-Z0-9]/g, "") || "CustomSkinPack"
      const versionArr = packVersion
        .split(".")
        .map((num) => parseInt(num, 10) || 0)
      while (versionArr.length < 3) versionArr.push(0)
      const finalVersion = versionArr.slice(0, 3)

      // 1. manifest.json
      const manifestJson = {
        header: {
          name: "pack.name",
          version: finalVersion,
          uuid: uuidHeader,
        },
        modules: [
          {
            version: finalVersion,
            type: "skin_pack",
            uuid: uuidModule,
          },
        ],
        format_version: 1,
      }
      zip.file("manifest.json", JSON.stringify(manifestJson, null, 2))

      // 2. skins.json
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

      // 3. texts/en_US.lang & texts/languages.json
      const textsFolder = zip.folder("texts")
      if (textsFolder) {
        // languages.json
        textsFolder.file("languages.json", JSON.stringify(["en_US"], null, 2))

        // en_US.lang
        let langContent = `skinpack.${slugName}=${packName}\n`
        skins.forEach((skin) => {
          const skinKey = skin.name.replace(/[^a-zA-Z0-9]/g, "")
          langContent += `skin.${slugName}.${skinKey}=${skin.name}\n`
        })
        textsFolder.file("en_US.lang", langContent)
      }

      // 4. PNG textures at root
      for (const skin of skins) {
        if (skin.textureFile) {
          zip.file(skin.textureName, skin.textureFile)
        }
      }

      setExportMessage("Packaging files into .mcpack...")
      const blob = await zip.generateAsync({ type: "blob" })

      // Download link
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `${packName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.mcpack`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setExportMessage(
        "Success! Download started. Double-click the downloaded file to import into Minecraft."
      )
      setTimeout(() => setExportMessage(""), 8000)
    } catch (err: unknown) {
      console.error(err)
      const errorMsg = err instanceof Error ? err.message : String(err)
      setExportMessage(`Export failed: ${errorMsg}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] pb-12 font-sans text-zinc-100 antialiased selection:bg-[#00e676] selection:text-black">
      {/* Subtle modern accent glow */}
      <div className="pointer-events-none absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-[#00e676]/5 blur-[160px]" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#00e676]/20 bg-[#121212]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="rounded-[4px] border border-[#00e676]/30 bg-[#1a1a1a] p-2 text-[#00e676] shadow-[0_0_12px_rgba(0,230,118,0.15)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-sans text-sm font-semibold tracking-[0.1em] text-white uppercase">
                MC Bedrock Skin Pack Maker
              </h1>
              <p className="font-mono text-[10px] tracking-wider text-zinc-500">
                OREUI EDITION v1.21+
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://learn.microsoft.com/en-us/minecraft/creator/documents/packagingaskinpack?view=minecraft-bedrock-stable"
              target="_blank"
              rel="noreferrer"
              className="rounded-[4px] border border-[#00e676]/20 bg-[#1a1a1a] px-3.5 py-1.5 text-xs font-semibold tracking-[0.05em] text-zinc-300 uppercase transition-all hover:border-[#00e676]/50 hover:bg-[#222222] hover:shadow-[0_0_8px_rgba(0,230,118,0.1)]"
            >
              <Info className="mr-1.5 inline h-3.5 w-3.5 text-[#00e676]" />
              <span>Creator Docs</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT PANEL: Pack settings (Columns: 4) */}
          <section className="space-y-6 lg:col-span-4">
            {/* Metadata Card */}
            <div className="relative overflow-hidden rounded-[4px] border border-[#00e676]/20 bg-[#1a1a1a] p-6 shadow-md">
              <div className="absolute top-0 left-0 h-[2px] w-full bg-[#00e676]" />
              <h2 className="mb-5 flex items-center gap-2 text-[10px] font-semibold tracking-[0.15em] text-[#00e676] uppercase">
                <Settings className="h-4 w-4 text-zinc-500" />
                <span>Pack Settings</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold tracking-[0.1em] text-zinc-400 uppercase">
                    Pack Display Name
                  </label>
                  <input
                    type="text"
                    value={packName}
                    onChange={(e) => setPackName(e.target.value)}
                    placeholder="E.g. My Skin Pack"
                    className="w-full rounded-[4px] border border-[#00e676]/20 bg-[#121212] px-3 py-2 font-sans text-xs text-white shadow-inner transition-all outline-none focus:border-[#00e676] focus:ring-1 focus:ring-[#00e676]/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold tracking-[0.1em] text-zinc-400 uppercase">
                      Pack Version
                    </label>
                    <input
                      type="text"
                      value={packVersion}
                      onChange={(e) => setPackVersion(e.target.value)}
                      placeholder="1.0.0"
                      className="w-full rounded-[4px] border border-[#00e676]/20 bg-[#121212] px-3 py-2 font-sans text-xs text-white shadow-inner transition-all outline-none focus:border-[#00e676] focus:ring-1 focus:ring-[#00e676]/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold tracking-[0.1em] text-zinc-400 uppercase">
                      Format
                    </label>
                    <div className="rounded-[4px] border border-zinc-800/80 bg-white/[0.02] px-3 py-2 font-sans text-xs text-zinc-500">
                      Bedrock Edition
                    </div>
                  </div>
                </div>

                {/* UUID Config */}
                <div className="space-y-3 border-t border-zinc-800/60 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.1em] text-zinc-400 uppercase">
                      <FileCode className="h-3.5 w-3.5 text-zinc-500" />
                      <span>UUID Schemas</span>
                    </span>
                    <button
                      onClick={regenerateUUIDs}
                      className="flex items-center gap-1 rounded-[4px] border border-[#00e676]/20 bg-white/[0.03] px-2 py-1 text-[9px] font-semibold text-[#00e676] transition-all hover:border-[#00e676] hover:text-white"
                    >
                      <RefreshCw className="h-2.5 w-2.5" />
                      <span>REGEN</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 font-mono text-[10px]">
                    <div className="flex items-center justify-between rounded-[4px] border border-zinc-800/60 bg-[#121212] p-2 text-zinc-400">
                      <span className="font-semibold tracking-wide text-zinc-600">
                        HDR:
                      </span>
                      <span
                        className="max-w-[200px] truncate"
                        title={uuidHeader}
                      >
                        {uuidHeader}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-[4px] border border-zinc-800/60 bg-[#121212] p-2 text-zinc-400">
                      <span className="font-semibold tracking-wide text-zinc-600">
                        MDL:
                      </span>
                      <span
                        className="max-w-[200px] truncate"
                        title={uuidModule}
                      >
                        {uuidModule}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skin List Card */}
            <div className="rounded-[4px] border border-[#00e676]/20 bg-[#1a1a1a] p-6 shadow-md">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.15em] text-[#00e676] uppercase">
                  <User className="h-4 w-4 text-zinc-500" />
                  <span>Skins ({skins.length})</span>
                </h2>
                <button
                  onClick={addNewSkin}
                  className="flex items-center gap-1 rounded-[4px] bg-[#00e676] px-3 py-1.5 text-[10px] font-bold text-black transition-all hover:bg-[#00c853] hover:shadow-[0_0_12px_rgba(0,230,118,0.25)] active:scale-[0.98]"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>ADD SKIN</span>
                </button>
              </div>

              {skins.length === 0 ? (
                <div className="rounded-[4px] border border-dashed border-zinc-800 bg-[#121212] py-8 text-center font-mono text-xs text-zinc-500">
                  No skins added yet. Click &quot;ADD SKIN&quot; above.
                </div>
              ) : (
                <div className="custom-scrollbar max-h-[350px] space-y-2 overflow-y-auto pr-1">
                  {skins.map((skin) => (
                    <div
                      key={skin.id}
                      onClick={() => setSelectedSkinId(skin.id)}
                      className={`flex cursor-pointer items-center justify-between rounded-[4px] border p-3 transition-all ${
                        selectedSkinId === skin.id
                          ? "border-[#00e676] bg-white/[0.03] shadow-[0_0_10px_rgba(0,230,118,0.1)]"
                          : "border-zinc-800/80 bg-[#141414] hover:border-[#00e676]/30 hover:shadow-[0_0_8px_rgba(0,230,118,0.05)]"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {/* Mini preview thumbnail */}
                        <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-[2px] border border-zinc-800 bg-[#121212]">
                          {skin.textureUrl ? (
                            <img
                              src={skin.textureUrl}
                              alt={skin.name}
                              className="pixelated h-8 w-8 object-contain"
                              style={{ imageRendering: "pixelated" }}
                            />
                          ) : (
                            <User className="h-4 w-4 text-zinc-600" />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="truncate text-xs font-semibold tracking-wide text-zinc-200">
                            {skin.name}
                          </p>
                          <span className="mt-1 inline-block rounded-[2px] border border-zinc-800 bg-white/[0.04] px-1.5 py-0.5 text-[8px] font-semibold tracking-wider text-zinc-500 uppercase">
                            {skin.geometry === "geometry.humanoid.customSlim"
                              ? "Alex"
                              : "Steve"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-[2px] border px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                            skin.type === "free"
                              ? "border-[#00e676]/20 bg-[#00e676]/10 text-[#00e676]"
                              : "border-blue-500/20 bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {skin.type}
                        </span>
                        <button
                          onClick={(e) => removeSkin(skin.id, e)}
                          className="rounded-[4px] border border-red-500/20 bg-red-500/10 p-1.5 text-red-400 transition-all hover:bg-red-500 hover:text-black active:scale-95"
                          title="Delete skin"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Export Card */}
            <div className="rounded-[4px] border border-[#00e676]/20 bg-[#1a1a1a] p-6 text-center shadow-md">
              <button
                onClick={handleExport}
                disabled={exporting || skins.length === 0}
                className="w-full cursor-pointer rounded-[4px] bg-[#00e676] py-3 text-xs font-bold tracking-[0.1em] text-black uppercase transition-all hover:bg-[#00c853] hover:shadow-[0_0_15px_rgba(0,230,118,0.3)] active:scale-[0.99] disabled:bg-zinc-800 disabled:text-zinc-600 disabled:shadow-none"
              >
                <Download className="mr-1.5 inline h-4 w-4" />
                <span>{exporting ? "Generating..." : "Export .mcpack"}</span>
              </button>
              {exportMessage && (
                <div
                  className={`mt-4 flex items-start gap-2 rounded-[4px] border p-3 text-left font-sans text-xs ${
                    exportMessage.startsWith("Success")
                      ? "border-[#00e676]/20 bg-[#00e676]/5 text-[#00e676]"
                      : "border-red-500/20 bg-red-500/5 text-red-400"
                  }`}
                >
                  {exportMessage.startsWith("Success") ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00e676]" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  )}
                  <span>{exportMessage}</span>
                </div>
              )}
              <p className="mt-3 font-sans text-[10px] leading-relaxed text-zinc-600">
                Double-clicking the downloaded <code>.mcpack</code> file imports
                it directly into Minecraft Bedrock.
              </p>
            </div>
          </section>

          {/* RIGHT PANEL: Selected Skin Edit (Columns: 8) */}
          <section className="space-y-6 lg:col-span-8">
            {currentSkin ? (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
                {/* 3D-Like Canvas Rendering Preview (Columns: 5) */}
                <div className="flex flex-col items-center justify-between rounded-[4px] border border-[#00e676]/20 bg-[#1a1a1a] p-6 shadow-md md:col-span-5">
                  <div className="mb-4 flex w-full items-center justify-between border-b border-zinc-800 pb-2.5">
                    <h3 className="text-[10px] font-semibold tracking-[0.1em] text-zinc-400 uppercase">
                      Skin Projection
                    </h3>
                    <span className="text-[10px] font-semibold tracking-[0.05em] text-[#00e676] uppercase">
                      {currentSkin.textureFile ? "ACTIVE" : "AWAITING"}
                    </span>
                  </div>

                  {/* Character preview background frame - modern dark grid layout */}
                  <div className="group relative rounded-[4px] border border-zinc-800 bg-[#121212] p-4 shadow-inner transition-all duration-300 hover:border-[#00e676]/30">
                    <div className="pointer-events-none absolute inset-0 rounded-[4px] bg-gradient-to-tr from-[#00e676]/2 to-transparent" />
                    <SkinPreviewCanvas skin={currentSkin} />
                  </div>

                  <div className="mt-4 space-y-1 text-center">
                    <p className="text-xs font-semibold tracking-wide text-white">
                      {currentSkin.name}
                    </p>
                    <p className="max-w-[200px] text-[9px] leading-4 text-zinc-500">
                      Real-time projection showing the loaded head, body, limbs,
                      and clothing layers.
                    </p>
                  </div>
                </div>

                {/* Edit Form (Columns: 7) */}
                <div className="flex flex-col justify-between rounded-[4px] border border-[#00e676]/20 bg-[#1a1a1a] p-6 shadow-md md:col-span-7">
                  <div className="space-y-5">
                    <div className="border-b border-zinc-800 pb-3.5">
                      <h3 className="text-xs font-semibold tracking-[0.1em] text-zinc-200 uppercase">
                        Edit Skin Metadata
                      </h3>
                      <p className="mt-1 text-[10px] text-zinc-500">
                        Configure skin settings for the Bedrock metadata bundle
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-[10px] font-semibold tracking-[0.1em] text-zinc-400 uppercase">
                        Skin Display Name
                      </label>
                      <input
                        type="text"
                        value={currentSkin.name}
                        onChange={(e) =>
                          updateSkin(currentSkin.id, { name: e.target.value })
                        }
                        className="w-full rounded-[4px] border border-[#00e676]/20 bg-[#121212] px-3 py-2 font-sans text-xs text-white shadow-inner transition-all outline-none focus:border-[#00e676] focus:ring-1 focus:ring-[#00e676]/30"
                      />
                    </div>

                    <div>
                      <label className="mb-2.5 block text-[10px] font-semibold tracking-[0.1em] text-zinc-400 uppercase">
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
                              ? "border-[#00e676] bg-white/[0.03] text-[#00e676] shadow-[0_0_10px_rgba(0,230,118,0.1)]"
                              : "border-zinc-800 bg-[#121212] text-zinc-400 hover:border-[#00e676]/35"
                          }`}
                        >
                          <p className="text-[10px] font-bold tracking-[0.05em] uppercase">
                            Steve model
                          </p>
                          <span className="mt-1 block font-sans text-[9px] text-zinc-500">
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
                              ? "border-[#00e676] bg-white/[0.03] text-[#00e676] shadow-[0_0_10px_rgba(0,230,118,0.1)]"
                              : "border-zinc-800 bg-[#121212] text-zinc-400 hover:border-[#00e676]/35"
                          }`}
                        >
                          <p className="text-[10px] font-bold tracking-[0.05em] uppercase">
                            Alex model
                          </p>
                          <span className="mt-1 block font-sans text-[9px] text-zinc-500">
                            Slim size (3px arms)
                          </span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2.5 block text-[10px] font-semibold tracking-[0.1em] text-zinc-400 uppercase">
                        Accessibility Tier
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            updateSkin(currentSkin.id, { type: "free" })
                          }
                          className={`cursor-pointer rounded-[4px] border p-2.5 text-center text-[9px] font-semibold tracking-[0.05em] uppercase transition-all ${
                            currentSkin.type === "free"
                              ? "border-[#00e676] bg-[#00e676]/10 text-[#00e676] shadow-[0_0_10px_rgba(0,230,118,0.1)]"
                              : "border-zinc-800 bg-[#121212] text-zinc-400 hover:border-[#00e676]/35"
                          }`}
                        >
                          FREE SKIN
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateSkin(currentSkin.id, { type: "paid" })
                          }
                          className={`cursor-pointer rounded-[4px] border p-2.5 text-center text-[9px] font-semibold tracking-[0.05em] uppercase transition-all ${
                            currentSkin.type === "paid"
                              ? "border-blue-500/40 bg-blue-500/10 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                              : "border-zinc-800 bg-[#121212] text-zinc-400 hover:border-blue-500/35"
                          }`}
                        >
                          PAID SKIN
                        </button>
                      </div>
                    </div>

                    {/* Image Upload Area */}
                    <div>
                      <label className="mb-2 block text-[10px] font-semibold tracking-[0.1em] text-zinc-400 uppercase">
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

                  <div className="mt-6 flex items-center gap-2 border-t border-zinc-800/80 pt-4 font-sans text-[10px] text-zinc-500">
                    <Info className="h-4 w-4 shrink-0 text-[#00e676]" />
                    <span>
                      Upload a standard 64x64 or 64x32 PNG skin texture file.
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[4px] border border-dashed border-zinc-800 bg-[#1a1a1a] p-12 text-center text-zinc-500 shadow-md">
                <HelpCircle className="mx-auto mb-3 h-12 w-12 text-zinc-600" />
                <p className="text-xs font-semibold tracking-[0.1em] text-zinc-400 uppercase">
                  NO SKIN SELECTED
                </p>
                <p className="mt-1 font-sans text-[10px] text-zinc-500">
                  Select a skin from the panel lists or click ADD SKIN.
                </p>
              </div>
            )}

            {/* Reference info guidelines Accordion/Card */}
            <div className="space-y-4 rounded-[4px] border border-[#00e676]/20 bg-[#1a1a1a] p-6 shadow-md">
              <h3 className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.15em] text-[#00e676] uppercase">
                <FolderOpen className="h-4 w-4 text-zinc-400" />
                <span>Bedrock Skinpack Packaging Manifest Schema</span>
              </h3>
              <div className="grid grid-cols-1 gap-4 font-sans text-xs text-zinc-400 md:grid-cols-2">
                <div className="space-y-2 rounded-[4px] border border-zinc-800/60 bg-white/[0.02] p-4">
                  <p className="text-[10px] font-semibold tracking-[0.05em] text-zinc-200 uppercase">
                    📁 File Manifest Structure
                  </p>
                  <ul className="list-disc space-y-1 pl-4 text-[11px] text-zinc-500">
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
                <div className="space-y-2 rounded-[4px] border border-zinc-800/60 bg-white/[0.02] p-4">
                  <p className="text-[10px] font-semibold tracking-[0.05em] text-zinc-200 uppercase">
                    🧩 Geometric Parameters
                  </p>
                  <ul className="list-disc space-y-1 pl-4 text-[11px] text-zinc-500">
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
  skin: SkinItem
}

interface ExtendedCanvasRenderingContext2D extends CanvasRenderingContext2D {
  mozImageSmoothingEnabled?: boolean
  webkitImageSmoothingEnabled?: boolean
  msImageSmoothingEnabled?: boolean
}

function SkinPreviewCanvas({ skin }: SkinPreviewCanvasProps) {
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
    if (!skin.textureUrl) {
      drawPlaceholder(ctx, canvas.width, canvas.height)
      return
    }

    const img = new Image()
    img.src = skin.textureUrl
    img.onload = () => {
      if (!active) return
      // Clear again
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Determine format: 64x64 or 64x32
      const isHeight64 =
        img.naturalHeight === 64 || img.naturalHeight === img.naturalWidth
      const isSlim = skin.geometry === "geometry.humanoid.customSlim"

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
  }, [skin.textureUrl, skin.geometry])

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
}
