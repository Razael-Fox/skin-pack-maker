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
    const id = Math.random().toString(36).substr(2, 9)
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

    // Create a local URL for rendering preview
    const url = URL.createObjectURL(file)
    updateSkin(id, {
      textureFile: file,
      textureUrl: url,
      textureName: file.name.replace(/\s+/g, "_"),
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

      // 1. manifest.json
      const manifestJson = {
        header: {
          name: "pack.name",
          version: versionArr,
          uuid: uuidHeader,
        },
        modules: [
          {
            version: versionArr,
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
    <div className="min-h-screen bg-[#0d0f12] pb-12 font-sans text-zinc-100 selection:bg-[#3b82f6] selection:text-white">
      {/* Dynamic glow effect background */}
      <div className="pointer-events-none absolute top-0 left-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-[128px]" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-[128px]" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-[#12161b]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="animate-pulse rounded-lg border border-emerald-500/30 bg-emerald-500/20 p-2 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-roboto text-xl font-bold tracking-wider text-emerald-400">
                MC Bedrock Skin Pack Maker
              </h1>
              <p className="text-xs text-zinc-400">
                Generate fully compliant Minecraft Bedrock skin packs (.mcpack)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://learn.microsoft.com/en-us/minecraft/creator/documents/packagingaskinpack?view=minecraft-bedrock-stable"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#181c23] px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800"
            >
              <Info className="h-3.5 w-3.5 text-zinc-400" />
              <span>Microsoft Creator Docs</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT PANEL: Pack settings (Columns: 4) */}
          <section className="space-y-6 lg:col-span-4">
            {/* Metadata Card */}
            <div className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-[#12161b]/70 p-5 backdrop-blur-sm">
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-widest text-zinc-300 uppercase">
                <Settings className="h-4 w-4 text-emerald-400" />
                <span>Pack Settings</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-400">
                    Skin Pack Name
                  </label>
                  <input
                    type="text"
                    value={packName}
                    onChange={(e) => setPackName(e.target.value)}
                    placeholder="E.g. Warrior Pack"
                    className="w-full rounded-lg border border-zinc-800 bg-[#181c23] px-3 py-2 text-sm text-zinc-100 transition-all outline-none hover:border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-400">
                      Pack Version
                    </label>
                    <input
                      type="text"
                      value={packVersion}
                      onChange={(e) => setPackVersion(e.target.value)}
                      placeholder="1.0.0"
                      className="w-full rounded-lg border border-zinc-800 bg-[#181c23] px-3 py-2 text-sm text-zinc-100 transition-all outline-none hover:border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-400">
                      Geometry Base
                    </label>
                    <div className="rounded-lg border border-zinc-800/80 bg-[#181c23]/50 px-3 py-2 text-xs text-zinc-400">
                      Auto-detected per skin
                    </div>
                  </div>
                </div>

                {/* UUID Config */}
                <div className="space-y-3 border-t border-zinc-800/80 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
                      <FileCode className="h-3.5 w-3.5 text-zinc-500" />
                      <span>Pack Unique UUIDs</span>
                    </span>
                    <button
                      onClick={regenerateUUIDs}
                      title="Regenerate unique UUIDs"
                      className="flex items-center gap-1 text-xs text-emerald-400 transition-colors hover:text-emerald-300"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Regen</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between rounded border border-zinc-800/50 bg-[#181c23] p-1.5 font-mono text-[10px] text-zinc-500">
                      <span className="text-zinc-400">Header:</span>
                      <span
                        className="max-w-[200px] truncate"
                        title={uuidHeader}
                      >
                        {uuidHeader || "Generating..."}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded border border-zinc-800/50 bg-[#181c23] p-1.5 font-mono text-[10px] text-zinc-500">
                      <span className="text-zinc-400">Module:</span>
                      <span
                        className="max-w-[200px] truncate"
                        title={uuidModule}
                      >
                        {uuidModule || "Generating..."}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skin List Card */}
            <div className="rounded-xl border border-zinc-800/80 bg-[#12161b]/70 p-5 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold tracking-widest text-zinc-300 uppercase">
                  <User className="h-4 w-4 text-emerald-400" />
                  <span>Skins ({skins.length})</span>
                </h2>
                <button
                  onClick={addNewSkin}
                  className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white shadow-[0_2px_8px_rgba(16,185,129,0.2)] transition-all hover:bg-emerald-600"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Skin</span>
                </button>
              </div>

              {skins.length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-800 py-8 text-center text-sm text-zinc-500">
                  No skins added yet. Click &quot;Add Skin&quot; above.
                </div>
              ) : (
                <div className="custom-scrollbar max-h-[350px] space-y-2 overflow-y-auto pr-1">
                  {skins.map((skin) => (
                    <div
                      key={skin.id}
                      onClick={() => setSelectedSkinId(skin.id)}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-left transition-all ${
                        selectedSkinId === skin.id
                          ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.05)]"
                          : "border-zinc-800 bg-[#181c23]/60 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {/* Mini preview thumbnail */}
                        <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded border border-zinc-800 bg-[#0d0f12]">
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
                          <p className="truncate text-sm font-medium text-zinc-200">
                            {skin.name}
                          </p>
                          <span className="rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-400 uppercase">
                            {skin.geometry === "geometry.humanoid.customSlim"
                              ? "Alex (Slim)"
                              : "Steve (Standard)"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize ${skin.type === "free" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"}`}
                        >
                          {skin.type}
                        </span>
                        <button
                          onClick={(e) => removeSkin(skin.id, e)}
                          className="rounded p-1 text-zinc-500 transition-all hover:bg-red-500/20 hover:text-red-400"
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
            <div className="rounded-xl border border-zinc-800/80 bg-[#12161b]/70 p-5 text-center backdrop-blur-sm">
              <button
                onClick={handleExport}
                disabled={exporting || skins.length === 0}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 font-bold tracking-wide text-white shadow-[0_4px_16px_rgba(16,185,129,0.25)] transition-all hover:from-emerald-600 hover:to-teal-600 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600"
              >
                <Download className="h-5 w-5" />
                <span>
                  {exporting ? "Creating MCPack..." : "Export .mcpack"}
                </span>
              </button>
              {exportMessage && (
                <div
                  className={`mt-3 flex items-start gap-2 rounded-lg border p-3 text-left text-xs ${
                    exportMessage.startsWith("Success")
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {exportMessage.startsWith("Success") ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  )}
                  <span>{exportMessage}</span>
                </div>
              )}
              <p className="mt-2 text-[11px] text-zinc-500">
                Double-clicking the downloaded <code>.mcpack</code> file opens
                and imports it directly into Minecraft Bedrock.
              </p>
            </div>
          </section>

          {/* RIGHT PANEL: Selected Skin Edit (Columns: 8) */}
          <section className="space-y-6 lg:col-span-8">
            {currentSkin ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                {/* 3D-Like Canvas Rendering Preview (Columns: 5) */}
                <div className="flex flex-col items-center justify-between rounded-xl border border-zinc-800/80 bg-[#12161b]/70 p-5 backdrop-blur-sm md:col-span-5">
                  <div className="mb-4 flex w-full items-center justify-between border-b border-zinc-800 pb-2">
                    <h3 className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                      Live Skin Avatar
                    </h3>
                    <span className="font-mono text-[10px] text-zinc-500">
                      {currentSkin.textureFile ? "Source Loaded" : "No Texture"}
                    </span>
                  </div>

                  <SkinPreviewCanvas skin={currentSkin} />

                  <div className="mt-4 text-center">
                    <p className="text-xs font-semibold text-zinc-300">
                      {currentSkin.name}
                    </p>
                    <p className="mt-1 max-w-[200px] text-[10px] text-zinc-500">
                      Real-time projection showing the loaded head, body, limbs,
                      and optional hat/clothing layers.
                    </p>
                  </div>
                </div>

                {/* Edit Form (Columns: 7) */}
                <div className="flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-[#12161b]/70 p-5 backdrop-blur-sm md:col-span-7">
                  <div className="space-y-5">
                    <div className="border-b border-zinc-800 pb-3">
                      <h3 className="text-sm font-semibold text-zinc-200">
                        Edit Skin Metadata
                      </h3>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        Customize properties of the selected skin model
                      </p>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-zinc-400">
                        Skin Display Name
                      </label>
                      <input
                        type="text"
                        value={currentSkin.name}
                        onChange={(e) =>
                          updateSkin(currentSkin.id, { name: e.target.value })
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-[#181c23] px-3 py-2 text-sm text-zinc-100 transition-all outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold text-zinc-400">
                        Model Geometry (Arms Width)
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            updateSkin(currentSkin.id, {
                              geometry: "geometry.humanoid.custom",
                            })
                          }
                          className={`rounded-lg border p-3 text-left transition-all ${
                            currentSkin.geometry === "geometry.humanoid.custom"
                              ? "border-emerald-500/50 bg-emerald-500/10"
                              : "border-zinc-800/80 bg-[#181c23]/60 hover:border-zinc-700"
                          }`}
                        >
                          <p className="text-xs font-bold text-zinc-200">
                            Steve model
                          </p>
                          <span className="text-[10px] text-zinc-500">
                            Standard model size (4px arms)
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateSkin(currentSkin.id, {
                              geometry: "geometry.humanoid.customSlim",
                            })
                          }
                          className={`rounded-lg border p-3 text-left transition-all ${
                            currentSkin.geometry ===
                            "geometry.humanoid.customSlim"
                              ? "border-emerald-500/50 bg-emerald-500/10"
                              : "border-zinc-800/80 bg-[#181c23]/60 hover:border-zinc-700"
                          }`}
                        >
                          <p className="text-xs font-bold text-zinc-200">
                            Alex model
                          </p>
                          <span className="text-[10px] text-zinc-500">
                            Slim model size (3px arms)
                          </span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold text-zinc-400">
                        Skin Accessibility
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            updateSkin(currentSkin.id, { type: "free" })
                          }
                          className={`rounded-lg border p-2.5 text-center text-xs font-medium transition-all ${
                            currentSkin.type === "free"
                              ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                              : "border-zinc-800 bg-[#181c23]/60 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          Free Skin
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateSkin(currentSkin.id, { type: "paid" })
                          }
                          className={`rounded-lg border p-2.5 text-center text-xs font-medium transition-all ${
                            currentSkin.type === "paid"
                              ? "border-blue-500/40 bg-blue-500/20 text-blue-400"
                              : "border-zinc-800 bg-[#181c23]/60 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          Paid Skin (In-App Store)
                        </button>
                      </div>
                    </div>

                    {/* Image Upload Area */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-zinc-400">
                        Minecraft Skin PNG Texture
                      </label>
                      <TextureUploadBox
                        skin={currentSkin}
                        onUpload={(file) =>
                          handleTextureUpload(currentSkin.id, file)
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-2 border-t border-zinc-800/60 pt-4 text-xs text-zinc-500">
                    <Info className="h-4 w-4 shrink-0" />
                    <span>
                      Upload a standard 64x64 or 64x32 PNG skin texture.
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-[#12161b]/70 p-12 text-center text-zinc-500">
                <HelpCircle className="mx-auto mb-3 h-12 w-12 text-zinc-600" />
                <p className="text-base font-semibold">No skin selected</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Select a skin from the left sidebar or create a new one to
                  edit.
                </p>
              </div>
            )}

            {/* Reference info guidelines Accordion/Card */}
            <div className="space-y-4 rounded-xl border border-zinc-800/60 bg-[#12161b]/50 p-5">
              <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-emerald-500 uppercase">
                <FolderOpen className="h-4 w-4" />
                <span>Minecraft Bedrock Packaging Guidelines Reference</span>
              </h3>
              <div className="grid grid-cols-1 gap-4 text-xs text-zinc-400 md:grid-cols-2">
                <div className="space-y-2 rounded-lg border border-zinc-800/60 bg-[#181c23]/40 p-3">
                  <p className="font-semibold text-zinc-300">
                    📁 Folder & File Structure
                  </p>
                  <p className="leading-5">The resulting pack contains:</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px]">
                    <li>
                      <code>manifest.json</code>: contains metadata, format
                      version & unique UUID keys.
                    </li>
                    <li>
                      <code>skins.json</code>: maps geometry, paths, and
                      accessibility parameters.
                    </li>
                    <li>
                      <code>texts/en_US.lang</code>: holds localizations mapping
                      IDs to names.
                    </li>
                    <li>
                      <code>texts/languages.json</code>: specifies supported
                      languages (defaults to <code>en_US</code>).
                    </li>
                  </ul>
                </div>
                <div className="space-y-2 rounded-lg border border-zinc-800/60 bg-[#181c23]/40 p-3">
                  <p className="font-semibold text-zinc-300">
                    🧩 Skin Geometries
                  </p>
                  <p className="leading-5">
                    Minecraft Bedrock supports standard formats:
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px]">
                    <li>
                      <strong>Steve Model:</strong> Uses{" "}
                      <code>geometry.humanoid.custom</code> (standard 4px wide
                      arms).
                    </li>
                    <li>
                      <strong>Alex Model:</strong> Uses{" "}
                      <code>geometry.humanoid.customSlim</code> (slim 3px wide
                      arms).
                    </li>
                    <li>
                      <strong>Image resolutions:</strong> Standard 64x64px or
                      64x32px textures.
                    </li>
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
      className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
        isDragOver
          ? "border-emerald-500 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
          : skin.textureFile
            ? "border-emerald-500/35 bg-[#181c23]/80"
            : "border-zinc-800 bg-[#181c23]/30 hover:border-zinc-700 hover:bg-[#181c23]/50"
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png"
        className="hidden"
      />
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="rounded-full border border-zinc-700 bg-zinc-800/80 p-3 text-zinc-400 transition-all group-hover:border-emerald-500/30 group-hover:text-emerald-400">
          <Upload className="h-5 w-5 text-zinc-400" />
        </div>
        <div>
          {skin.textureFile ? (
            <>
              <p className="text-sm font-semibold text-emerald-400">
                Texture Loaded!
              </p>
              <p
                className="mx-auto mt-1 max-w-[280px] truncate text-xs text-zinc-500"
                title={skin.textureFile.name}
              >
                {skin.textureFile.name}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-zinc-300">
                Drag & Drop skin PNG here
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                or click to browse from device
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
    ctx.strokeStyle = "#27272a"
    ctx.lineWidth = 2
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

    // Center icon
    ctx.fillStyle = "#3f3f46"
    ctx.font = "11px system-ui"
    ctx.textAlign = "center"
    ctx.setLineDash([])
    ctx.fillText("Awaiting Skin PNG", w / 2, h / 2 + 30)
  }

  useEffect(() => {
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
      drawPlaceholder(ctx, canvas.width, canvas.height)
    }
  }, [skin.textureUrl, skin.geometry])

  return (
    <div className="relative flex aspect-[4/5] w-full max-w-[240px] items-center justify-center overflow-hidden rounded-xl border border-zinc-800/80 bg-[#0d0f12] p-3 shadow-inner">
      <div className="bg-grid-white/[0.02] pointer-events-none absolute inset-0" />
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
