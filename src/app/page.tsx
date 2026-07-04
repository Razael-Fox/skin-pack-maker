"use client"

import React from "react"
import {
  Sparkles,
  HelpCircle,
  FolderOpen,
  FileJson,
  Puzzle,
} from "lucide-react"

import { useSkinPack } from "../hooks/useSkinPack"
import { PackSettings } from "../components/PackSettings"
import { SkinList } from "../components/SkinList"
import { SkinEditor } from "../components/SkinEditor"
import { SkinPreviewCanvas } from "../components/SkinPreviewCanvas"

export default function SkinPackMaker() {
  const {
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
  } = useSkinPack()

  const currentSkin = skins.find((s) => s.id === selectedSkinId)

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0a0a0a] pb-12 font-sans text-white antialiased selection:bg-blue-500/30 selection:text-white">
      {/* Background ambient glows (macOS style glassmorphism) */}
      <div className="pointer-events-none absolute top-[-20%] left-[-10%] h-[800px] w-[800px] rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-10%] bottom-[-20%] h-[600px] w-[600px] rounded-full bg-purple-600/10 blur-[120px]" />

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        {/* Banner Title */}
        <div className="mb-10 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20 transition-transform duration-300 hover:scale-105 hover:rotate-3">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider text-white">
                MC Bedrock Skin Pack Maker
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">
                  Modern Edition
                </span>
                <span className="h-1 w-1 rounded-full bg-white/30" />
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/70">
                  v1.21+ COMPATIBLE
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left panel: configurations */}
          <section className="flex flex-col space-y-6 lg:col-span-4">
            <PackSettings
              packName={packName}
              packVersion={packVersion}
              onNameChange={setPackName}
              onVersionChange={setPackVersion}
            />

            <SkinList
              skins={skins}
              selectedSkinId={selectedSkinId}
              onSelectSkin={setSelectedSkinId}
              onAddSkin={addNewSkin}
              onRemoveSkin={removeSkin}
            />

            {/* Export Card */}
            <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-6 text-center shadow-xl shadow-black/20 backdrop-blur-md transition-all duration-300 hover:border-white/20">
              <button
                onClick={handleExport}
                disabled={exporting || skins.length === 0}
                className="w-full cursor-pointer rounded-lg bg-blue-500 py-3.5 text-xs font-bold tracking-widest text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:bg-blue-600 disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none"
              >
                {exporting ? "Generating..." : "Export .mcpack"}
              </button>
              {exportMessage && (
                <p className="mt-3 animate-pulse text-xs font-medium text-blue-400">
                  {exportMessage}
                </p>
              )}
            </div>
          </section>

          {/* Right panel: detail workspace */}
          <section className="space-y-6 lg:col-span-8">
            {currentSkin ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                {/* 2D Projection view */}
                <div className="flex flex-col items-center justify-between rounded-xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/20 backdrop-blur-md transition-all duration-300 hover:border-white/20 md:col-span-5">
                  <div className="mb-6 flex w-full items-center justify-between border-b border-white/10 pb-4">
                    <h3 className="text-xs font-semibold tracking-widest text-white/90 uppercase">
                      Skin Projection
                    </h3>
                    <span className="rounded bg-blue-500/20 px-1.5 py-0.5 font-mono text-[9px] text-blue-300 uppercase">
                      2D Live View
                    </span>
                  </div>
                  <div className="group relative flex w-full justify-center rounded-xl border border-white/5 bg-black/40 p-6 shadow-inner transition-all duration-300 hover:border-white/10">
                    <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-tr from-white/5 to-transparent opacity-50" />
                    <SkinPreviewCanvas
                      textureUrl={currentSkin.textureUrl}
                      geometry={currentSkin.geometry}
                    />
                  </div>
                  <div className="mt-6 space-y-1.5 text-center">
                    <p className="text-sm font-semibold tracking-wide text-white">
                      {currentSkin.name}
                    </p>
                    <p className="mx-auto max-w-[200px] text-[10px] leading-relaxed text-white/50">
                      Real-time projection showing the loaded head, body, limbs,
                      and clothing layers.
                    </p>
                  </div>
                </div>

                {/* Edit Form */}
                <SkinEditor
                  skin={currentSkin}
                  onUpdateSkin={updateSkin}
                  onTextureUpload={handleTextureUpload}
                />
              </div>
            ) : (
              <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/5 text-center shadow-xl shadow-black/20 transition-all duration-300">
                <HelpCircle className="mb-4 h-12 w-12 text-white/30" />
                <p className="text-sm font-semibold tracking-widest text-white/70 uppercase">
                  NO SKIN SELECTED
                </p>
                <p className="mt-2 font-sans text-xs text-white/40">
                  Select a skin from the list or click ADD PNG to create a new
                  one.
                </p>
              </div>
            )}

            {/* Reference info guidelines Card */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 backdrop-blur-md transition-all duration-300 hover:border-white/20">
              <h3 className="mb-5 flex items-center gap-2 text-xs font-semibold tracking-widest text-white/90 uppercase">
                <FolderOpen className="h-4 w-4 text-white/50" />
                <span>Bedrock Skinpack Packaging Schema</span>
              </h3>
              <div className="grid grid-cols-1 gap-4 font-sans text-xs md:grid-cols-2">
                <div className="rounded-lg border border-white/5 bg-black/20 p-5 shadow-inner">
                  <p className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-wider text-blue-400 uppercase">
                    <FileJson className="h-3.5 w-3.5" />
                    <span>File Manifest Structure</span>
                  </p>
                  <ul className="list-disc space-y-2 pl-4 text-white/60">
                    <li>
                      <code className="text-blue-300">manifest.json</code>:
                      General metadata structure.
                    </li>
                    <li>
                      <code className="text-blue-300">skins.json</code>:
                      References textures & geometry.
                    </li>
                    <li>
                      <code className="text-blue-300">texts/en_US.lang</code>:
                      Localizes keys on Bedrock systems.
                    </li>
                  </ul>
                </div>
                <div className="rounded-lg border border-white/5 bg-black/20 p-5 shadow-inner">
                  <p className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-wider text-purple-400 uppercase">
                    <Puzzle className="h-3.5 w-3.5" />
                    <span>Geometric Parameters</span>
                  </p>
                  <ul className="list-disc space-y-2 pl-4 text-white/60">
                    <li>
                      <strong>Steve:</strong>{" "}
                      <code className="text-[10px] text-purple-300">
                        geometry.humanoid.custom
                      </code>{" "}
                      (4px arms).
                    </li>
                    <li>
                      <strong>Alex:</strong>{" "}
                      <code className="text-[10px] text-purple-300">
                        geometry.humanoid.customSlim
                      </code>{" "}
                      (3px arms).
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
