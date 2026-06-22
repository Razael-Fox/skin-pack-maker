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
    <div
      className="relative min-h-screen pb-12 text-zinc-100 selection:bg-[#3c8527] selection:text-white"
      style={{
        backgroundColor: "#1c1c1c",
        backgroundImage:
          "linear-gradient(rgba(0, 0, 0, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.2) 1px, transparent 1px)",
        backgroundSize: "8px 8px",
      }}
    >
      {/* Header (OreUI styling with flat gray panel and black borders) */}
      <header className="relative z-40 border-b-4 border-black bg-[#313233] shadow-[inset_0_-2px_0px_#18191a,inset_0_2px_0px_#5e5f60]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-4 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="border-2 border-black bg-[#4c4c4c] p-2 text-[#fbc02d] shadow-[inset_-2px_-2px_0px_#1c1c1c,inset_2px_2px_0px_#8b8b8b]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-pixel text-sm tracking-wider text-[#fbc02d] [text-shadow:2px_2px_0px_#1f1f1f] md:text-base">
                MC BEDROCK SKIN PACK MAKER
              </h1>
              <p className="mt-0.5 font-mono text-[10px] text-zinc-400">
                OreUI System Edition v1.0.0
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://learn.microsoft.com/en-us/minecraft/creator/documents/packagingaskinpack?view=minecraft-bedrock-stable"
              target="_blank"
              rel="noreferrer"
              className="font-pixel flex items-center gap-1.5 border-2 border-black bg-[#4c4c4c] px-3 py-2 text-[9px] text-white shadow-[inset_-2px_-2px_0px_#1e1e1e,inset_2px_2px_0px_#8b8b8b] hover:border-amber-300 active:bg-[#383838]"
            >
              <Info className="h-3 w-3 text-[#fbc02d]" />
              <span>CREATOR DOCS</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT PANEL: Pack settings (Columns: 4) */}
          <section className="space-y-6 lg:col-span-4">
            {/* Metadata Card (Minecraft panel styling) */}
            <div className="border-2 border-black bg-[#313233] p-5 shadow-[inset_-2px_-2px_0px_#1c1c1c,inset_2px_2px_0px_#5c5c5c]">
              <h2 className="font-pixel mb-4 flex items-center gap-2 text-[10px] text-[#fbc02d] [text-shadow:1.5px_1.5px_0px_#1f1f1f]">
                <Settings className="h-4 w-4 text-zinc-400" />
                <span>PACK SETTINGS</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="font-pixel mb-1.5 block text-[10px] text-zinc-400">
                    Pack Display Name
                  </label>
                  <input
                    type="text"
                    value={packName}
                    onChange={(e) => setPackName(e.target.value)}
                    placeholder="E.g. My Skin Pack"
                    className="w-full rounded-none border-2 border-black bg-[#151617] px-3 py-2 font-mono text-xs text-white shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)] outline-none focus:border-amber-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-pixel mb-1.5 block text-[10px] text-zinc-400">
                      Pack Version
                    </label>
                    <input
                      type="text"
                      value={packVersion}
                      onChange={(e) => setPackVersion(e.target.value)}
                      placeholder="1.0.0"
                      className="w-full rounded-none border-2 border-black bg-[#151617] px-3 py-2 font-mono text-xs text-white shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)] outline-none focus:border-amber-300"
                    />
                  </div>
                  <div>
                    <label className="font-pixel mb-1.5 block text-[10px] text-zinc-400">
                      Format
                    </label>
                    <div className="border-2 border-black bg-[#151617]/60 px-3 py-2 font-mono text-xs text-zinc-400 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]">
                      Bedrock Pack
                    </div>
                  </div>
                </div>

                {/* UUID Config */}
                <div className="space-y-3 border-t border-zinc-700/60 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-pixel flex items-center gap-1.5 text-[10px] text-zinc-400">
                      <FileCode className="h-3.5 w-3.5 text-zinc-500" />
                      <span>UUID SCHEMAS</span>
                    </span>
                    <button
                      onClick={regenerateUUIDs}
                      className="font-pixel flex items-center gap-1 border border-black bg-[#4c4c4c] px-2 py-1 text-[9px] text-zinc-300 shadow-[inset_-1px_-1px_0px_#1e1e1e,inset_1px_1px_0px_#8b8b8b] hover:border-amber-300 hover:text-amber-300 active:bg-[#383838]"
                    >
                      <RefreshCw className="h-2.5 w-2.5" />
                      <span>REGEN</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between border-2 border-black bg-[#151617] p-2 font-mono text-[9px] text-zinc-400 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]">
                      <span className="mr-2 text-zinc-500">HEADER:</span>
                      <span
                        className="max-w-[200px] truncate"
                        title={uuidHeader}
                      >
                        {uuidHeader}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-2 border-black bg-[#151617] p-2 font-mono text-[9px] text-zinc-400 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]">
                      <span className="mr-2 text-zinc-500">MODULE:</span>
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
            <div className="border-2 border-black bg-[#313233] p-5 shadow-[inset_-2px_-2px_0px_#1c1c1c,inset_2px_2px_0px_#5c5c5c]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-pixel flex items-center gap-2 text-[10px] text-[#fbc02d] [text-shadow:1.5px_1.5px_0px_#1f1f1f]">
                  <User className="h-4 w-4 text-zinc-400" />
                  <span>SKINS ({skins.length})</span>
                </h2>
                <button
                  onClick={addNewSkin}
                  className="font-pixel flex items-center gap-1 border-2 border-black border-t-[#5da83b] border-r-[#1a3d11] border-b-[#1a3d11] border-l-[#5da83b] bg-[#3c8527] px-2.5 py-1.5 text-[9px] text-white hover:border-amber-300 hover:bg-[#4ea333] active:bg-[#285b19]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>ADD SKIN</span>
                </button>
              </div>

              {skins.length === 0 ? (
                <div className="border-2 border-dashed border-zinc-700 bg-[#151617] py-8 text-center font-mono text-xs text-zinc-500">
                  No skins added yet. Click &quot;ADD SKIN&quot; above.
                </div>
              ) : (
                <div className="custom-scrollbar max-h-[350px] space-y-2 overflow-y-auto pr-1">
                  {skins.map((skin) => (
                    <div
                      key={skin.id}
                      onClick={() => setSelectedSkinId(skin.id)}
                      className={`flex cursor-pointer items-center justify-between border-2 p-3 transition-all ${
                        selectedSkinId === skin.id
                          ? "border-[#4ea333] bg-[#2c3d2e] shadow-[inset_-2px_-2px_0px_#182a1a,inset_2px_2px_0px_#6fbc54]"
                          : "border-[#121212] bg-[#242526] shadow-[inset_-2px_-2px_0px_#161718,inset_2px_2px_0px_#444546] hover:border-zinc-500"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {/* Mini preview thumbnail */}
                        <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden border-2 border-black bg-[#151617] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]">
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
                          <p className="font-pixel truncate text-xs text-zinc-200">
                            {skin.name}
                          </p>
                          <span className="font-pixel mt-1 inline-block rounded-none border border-black bg-[#151617] px-1.5 py-0.5 text-[8px] text-zinc-400 uppercase">
                            {skin.geometry === "geometry.humanoid.customSlim"
                              ? "Alex (Slim)"
                              : "Steve (Std)"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-pixel border border-black px-1 py-0.5 text-[8px] capitalize ${skin.type === "free" ? "bg-[#3c8527]/30 text-emerald-400" : "bg-blue-500/30 text-blue-400"}`}
                        >
                          {skin.type}
                        </span>
                        <button
                          onClick={(e) => removeSkin(skin.id, e)}
                          className="border border-black bg-[#b3312c] p-1.5 text-white shadow-[inset_-1px_-1px_0px_#5c1613,inset_1px_1px_0px_#d85e59] transition-all hover:bg-[#cf3e39]"
                          title="Delete skin"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Export Card */}
            <div className="border-2 border-black bg-[#313233] p-5 text-center shadow-[inset_-2px_-2px_0px_#1c1c1c,inset_2px_2px_0px_#5c5c5c]">
              <button
                onClick={handleExport}
                disabled={exporting || skins.length === 0}
                className="font-pixel flex w-full cursor-pointer items-center justify-center gap-2 border-2 border-black border-t-[#5da83b] border-r-[#1a3d11] border-b-[#1a3d11] border-l-[#5da83b] bg-[#3c8527] py-3 text-xs tracking-wider text-white shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all hover:border-amber-300 hover:bg-[#4ea333] disabled:border-zinc-800 disabled:bg-[#4c4c4c] disabled:text-zinc-500 disabled:shadow-none"
              >
                <Download className="h-4 w-4" />
                <span>{exporting ? "PACKING..." : "EXPORT .MCPACK"}</span>
              </button>
              {exportMessage && (
                <div
                  className={`mt-3 flex items-start gap-2 border-2 border-black p-3 text-left font-mono text-xs ${
                    exportMessage.startsWith("Success")
                      ? "bg-[#2c3d2e] text-emerald-300"
                      : "bg-[#4e2d2a] text-red-300"
                  }`}
                >
                  {exportMessage.startsWith("Success") ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  )}
                  <span>{exportMessage}</span>
                </div>
              )}
              <p className="mt-2.5 font-mono text-[10px] text-zinc-500">
                Double-clicking the downloaded <code>.mcpack</code> file imports
                it directly into Minecraft Bedrock.
              </p>
            </div>
          </section>

          {/* RIGHT PANEL: Selected Skin Edit (Columns: 8) */}
          <section className="space-y-6 lg:col-span-8">
            {currentSkin ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                {/* 3D-Like Canvas Rendering Preview (Columns: 5) */}
                <div className="flex flex-col items-center justify-between border-2 border-black bg-[#313233] p-5 shadow-[inset_-2px_-2px_0px_#1c1c1c,inset_2px_2px_0px_#5c5c5c] md:col-span-5">
                  <div className="mb-4 flex w-full items-center justify-between border-b-2 border-[#121212] pb-2">
                    <h3 className="font-pixel text-[9px] tracking-wider text-zinc-400">
                      LIVE SKIN PREVIEW
                    </h3>
                    <span className="font-pixel text-[9px] text-[#fbc02d]">
                      {currentSkin.textureFile ? "ACTIVE" : "EMPTY"}
                    </span>
                  </div>

                  {/* Character preview background frame representing cobblestone/wood block style */}
                  <div
                    className="mb-2 border-4 border-black bg-[#151617] p-4 shadow-[inset_-4px_-4px_0px_#090909,inset_4px_4px_0px_#3a3a3b]"
                    style={{
                      backgroundImage:
                        "radial-gradient(#2c2c2c 25%, transparent 25%), radial-gradient(#2c2c2c 25%, transparent 25%)",
                      backgroundPosition: "0 0, 4px 4px",
                      backgroundSize: "8px 8px",
                    }}
                  >
                    <SkinPreviewCanvas skin={currentSkin} />
                  </div>

                  <div className="mt-2 space-y-1 text-center">
                    <p className="font-pixel text-xs text-[#fbc02d]">
                      {currentSkin.name}
                    </p>
                    <p className="max-w-[200px] text-[9px] leading-4 text-zinc-500">
                      Real-time projection showing the loaded head, body, limbs,
                      and clothing layers.
                    </p>
                  </div>
                </div>

                {/* Edit Form (Columns: 7) */}
                <div className="flex flex-col justify-between border-2 border-black bg-[#313233] p-5 shadow-[inset_-2px_-2px_0px_#1c1c1c,inset_2px_2px_0px_#5c5c5c] md:col-span-7">
                  <div className="space-y-5">
                    <div className="border-b-2 border-[#121212] pb-3">
                      <h3 className="font-pixel text-xs tracking-widest text-zinc-200 uppercase">
                        Edit Skin Metadata
                      </h3>
                      <p className="mt-1 text-[10px] text-zinc-500">
                        Configure skin settings for the Bedrock metadata bundle
                      </p>
                    </div>

                    <div>
                      <label className="font-pixel mb-2 block text-[10px] text-zinc-400">
                        Skin Display Name
                      </label>
                      <input
                        type="text"
                        value={currentSkin.name}
                        onChange={(e) =>
                          updateSkin(currentSkin.id, { name: e.target.value })
                        }
                        className="w-full rounded-none border-2 border-black bg-[#151617] px-3 py-2 font-mono text-xs text-white shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)] outline-none focus:border-amber-300"
                      />
                    </div>

                    <div>
                      <label className="font-pixel mb-2.5 block text-[10px] text-zinc-400">
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
                          className={`cursor-pointer border-2 p-3 text-left transition-all ${
                            currentSkin.geometry === "geometry.humanoid.custom"
                              ? "border-[#4ea333] bg-[#2c3d2e] shadow-[inset_-2px_-2px_0px_#182a1a,inset_2px_2px_0px_#6fbc54]"
                              : "border-black bg-[#242526] shadow-[inset_-2px_-2px_0px_#161718,inset_2px_2px_0px_#444546] hover:border-zinc-500"
                          }`}
                        >
                          <p className="font-pixel text-[10px] text-zinc-200">
                            Steve Model
                          </p>
                          <span className="mt-1 block font-mono text-[9px] text-zinc-500">
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
                          className={`cursor-pointer border-2 p-3 text-left transition-all ${
                            currentSkin.geometry ===
                            "geometry.humanoid.customSlim"
                              ? "border-[#4ea333] bg-[#2c3d2e] shadow-[inset_-2px_-2px_0px_#182a1a,inset_2px_2px_0px_#6fbc54]"
                              : "border-black bg-[#242526] shadow-[inset_-2px_-2px_0px_#161718,inset_2px_2px_0px_#444546] hover:border-zinc-500"
                          }`}
                        >
                          <p className="font-pixel text-[10px] text-zinc-200">
                            Alex Model
                          </p>
                          <span className="mt-1 block font-mono text-[9px] text-zinc-500">
                            Slim size (3px arms)
                          </span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="font-pixel mb-2.5 block text-[10px] text-zinc-400">
                        Accessibility Tier
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            updateSkin(currentSkin.id, { type: "free" })
                          }
                          className={`font-pixel cursor-pointer border-2 p-2.5 text-center text-[9px] transition-all ${
                            currentSkin.type === "free"
                              ? "border-[#4ea333] bg-[#3c8527]/30 text-emerald-400 shadow-[inset_-2px_-2px_0px_#182a1a,inset_2px_2px_0px_#6fbc54]"
                              : "border-black bg-[#242526] text-zinc-400 shadow-[inset_-2px_-2px_0px_#161718,inset_2px_2px_0px_#444546] hover:border-zinc-500"
                          }`}
                        >
                          FREE SKIN
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateSkin(currentSkin.id, { type: "paid" })
                          }
                          className={`font-pixel cursor-pointer border-2 p-2.5 text-center text-[9px] transition-all ${
                            currentSkin.type === "paid"
                              ? "border-blue-500/40 bg-blue-500/20 text-blue-400 shadow-[inset_-2px_-2px_0px_#12223c,inset_2px_2px_0px_#5493bc]"
                              : "border-black bg-[#242526] text-zinc-400 shadow-[inset_-2px_-2px_0px_#161718,inset_2px_2px_0px_#444546] hover:border-zinc-500"
                          }`}
                        >
                          PAID SKIN
                        </button>
                      </div>
                    </div>

                    {/* Image Upload Area */}
                    <div>
                      <label className="font-pixel mb-2 block text-[10px] text-zinc-400">
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

                  <div className="mt-6 flex items-center gap-2 border-t-2 border-[#121212] pt-4 font-mono text-[10px] text-zinc-500">
                    <Info className="h-4 w-4 shrink-0 text-zinc-600" />
                    <span>Drop a 64x64 or 64x32 PNG file layout to apply.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-black bg-[#313233] p-12 text-center text-zinc-500 shadow-[inset_-2px_-2px_0px_#1c1c1c,inset_2px_2px_0px_#5c5c5c]">
                <HelpCircle className="mx-auto mb-3 h-12 w-12 text-zinc-600" />
                <p className="font-pixel text-sm text-zinc-400">
                  NO SKIN SELECTED
                </p>
                <p className="mt-1 font-mono text-xs text-zinc-500">
                  Select a skin from the panel lists or click ADD SKIN.
                </p>
              </div>
            )}

            {/* Reference info guidelines Accordion/Card */}
            <div className="space-y-4 border-2 border-black bg-[#313233] p-5 shadow-[inset_-2px_-2px_0px_#1c1c1c,inset_2px_2px_0px_#5c5c5c]">
              <h3 className="font-pixel flex items-center gap-2 text-[10px] text-[#fbc02d] [text-shadow:1.5px_1.5px_0px_#1f1f1f]">
                <FolderOpen className="h-4 w-4 text-zinc-400" />
                <span>BEDROCK SKINPACK PACKAGING MANIFEST SCHEMA</span>
              </h3>
              <div className="grid grid-cols-1 gap-4 font-mono text-xs text-zinc-400 md:grid-cols-2">
                <div className="space-y-2 border-2 border-black bg-[#151617] p-3 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]">
                  <p className="font-semibold text-zinc-300">
                    📂 File Manifest Structure
                  </p>
                  <ul className="list-disc space-y-1 pl-4 text-[11px]">
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
                <div className="space-y-2 border-2 border-black bg-[#151617] p-3 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]">
                  <p className="font-semibold text-zinc-300">
                    🧩 Geometric Parameters
                  </p>
                  <ul className="list-disc space-y-1 pl-4 text-[11px]">
                    <li>
                      <strong>Steve:</strong>{" "}
                      <code>geometry.humanoid.custom</code> (4px arms).
                    </li>
                    <li>
                      <strong>Alex:</strong>{" "}
                      <code>geometry.humanoid.customSlim</code> (3px arms).
                    </li>
                    <li>Supports 64x64px or 64x32px PNG images.</li>
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
      className={`cursor-pointer border-2 border-dashed p-6 text-center transition-all ${
        isDragOver
          ? "border-amber-300 bg-amber-500/5"
          : skin.textureFile
            ? "border-[#3c8527] bg-[#151617]"
            : "border-zinc-700 bg-[#151617]/50 hover:border-zinc-500 hover:bg-[#151617]/80"
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
        <div className="border-2 border-black bg-[#4c4c4c] p-3 text-zinc-300 shadow-[inset_-2px_-2px_0px_#1e1e1e,inset_2px_2px_0px_#8b8b8b]">
          <Upload className="h-5 w-5" />
        </div>
        <div>
          {skin.textureFile ? (
            <>
              <p className="font-pixel text-xs text-[#3c8527]">
                TEXTURE LOADED!
              </p>
              <p
                className="mx-auto mt-1.5 max-w-[280px] truncate font-mono text-[10px] text-zinc-500"
                title={skin.textureFile.name}
              >
                {skin.textureFile.name}
              </p>
            </>
          ) : (
            <>
              <p className="font-pixel text-xs text-zinc-300">
                DRAG & DROP SKIN PNG HERE
              </p>
              <p className="mt-1.5 font-mono text-[10px] text-zinc-500">
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
    ctx.strokeStyle = "#404040"
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

    // Center text
    ctx.fillStyle = "#555555"
    ctx.font = "8px 'Press Start 2P', system-ui"
    ctx.textAlign = "center"
    ctx.setLineDash([])
    ctx.fillText("AWAITING PNG", w / 2, h / 2 + 30)
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
