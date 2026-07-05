"use client"

import React from "react"
import { HelpCircle, Download } from "lucide-react"

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
    pendingDownload,
    confirmDownload,
    cancelDownload,
  } = useSkinPack()

  const [theme, setTheme] = React.useState<"light" | "dark">("dark")
  const currentSkin = skins.find((s) => s.id === selectedSkinId)

  React.useEffect(() => {
    const root = window.document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [theme])

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-slate-50/20 pb-12 font-sans text-zinc-900 antialiased transition-colors duration-300 dark:bg-black/40 dark:text-white">
      {/* Background ambient glows */}
      <div className="pointer-events-none absolute top-[-20%] left-[-10%] h-[800px] w-[800px] rounded-full bg-purple-600/5 blur-[120px] dark:bg-purple-900/10" />
      <div className="pointer-events-none absolute right-[-10%] bottom-[-20%] h-[600px] w-[600px] rounded-full bg-indigo-600/5 blur-[120px] dark:bg-indigo-900/10" />

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left panel: configurations */}
          <section className="flex flex-col space-y-6 lg:col-span-4">
            <PackSettings
              packName={packName}
              packVersion={packVersion}
              onNameChange={setPackName}
              onVersionChange={setPackVersion}
              theme={theme}
              setTheme={setTheme}
            />

            <SkinList
              skins={skins}
              selectedSkinId={selectedSkinId}
              onSelectSkin={setSelectedSkinId}
              onAddSkin={addNewSkin}
              onRemoveSkin={removeSkin}
            />

            {/* Export Card */}
            <div className="mt-auto rounded-xl border border-purple-500/10 bg-white/90 p-6 text-center shadow-md backdrop-blur-md transition-all duration-300 hover:border-purple-500/20 dark:border-purple-500/20 dark:bg-zinc-900/60 dark:shadow-xl dark:shadow-black/20 dark:hover:border-purple-500/30">
              <button
                onClick={handleExport}
                disabled={exporting || skins.length === 0}
                className="w-full cursor-pointer rounded-lg bg-purple-600 py-3.5 text-xs font-bold tracking-widest text-white shadow-lg shadow-purple-600/20 transition-all duration-200 hover:bg-purple-700 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none dark:disabled:bg-white/10 dark:disabled:text-white/30"
              >
                {exporting ? "Generating..." : "Export .mcpack"}
              </button>
              {exportMessage && (
                <p className="mt-3 animate-pulse text-xs font-medium text-purple-600 dark:text-purple-400">
                  {exportMessage}
                </p>
              )}
            </div>
          </section>

          {/* Right panel: detail workspace */}
          <section className="space-y-6 lg:col-span-8">
            {currentSkin ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                {/* 3D Projection view */}
                <div className="flex flex-col items-center justify-between rounded-xl border border-purple-500/10 bg-white/90 p-8 shadow-md backdrop-blur-md transition-all duration-300 hover:border-purple-500/20 md:col-span-5 dark:border-purple-500/20 dark:bg-zinc-900/60 dark:shadow-xl dark:shadow-black/20 dark:hover:border-purple-500/30">
                  <div className="mb-6 flex w-full items-center justify-between border-b border-zinc-200 pb-4 dark:border-white/10">
                    <h3 className="text-xs font-semibold tracking-widest text-zinc-900 uppercase dark:text-white/90">
                      Skin Projection
                    </h3>
                    <span className="rounded bg-purple-600/10 px-1.5 py-0.5 font-mono text-[9px] text-purple-700 uppercase dark:bg-purple-500/20 dark:text-purple-300">
                      3D Preview
                    </span>
                  </div>
                  <div className="group relative flex w-full justify-center rounded-xl border border-zinc-200/50 bg-zinc-100/50 p-6 shadow-inner transition-all duration-300 hover:border-zinc-300 dark:border-white/5 dark:bg-black/40 dark:hover:border-white/10">
                    <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-tr from-white/5 to-transparent opacity-50" />
                    <SkinPreviewCanvas
                      textureUrl={currentSkin.textureUrl}
                      geometry={currentSkin.geometry}
                    />
                  </div>
                  <div className="mt-6 space-y-1.5 text-center">
                    <p className="text-sm font-semibold tracking-wide text-zinc-900 dark:text-white">
                      {currentSkin.name}
                    </p>
                    <p className="mx-auto max-w-[200px] text-[10px] leading-relaxed text-zinc-500 dark:text-white/50">
                      Drag to rotate. Real-time 3D projection showing base skin
                      and outer clothing layers.
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
              <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-purple-500/20 bg-white/90 text-center shadow-md transition-all duration-300 dark:border-purple-500/30 dark:bg-zinc-900/60 dark:shadow-xl dark:shadow-black/20">
                <HelpCircle className="mb-4 h-12 w-12 text-zinc-300 dark:text-white/30" />
                <p className="text-sm font-semibold tracking-widest text-zinc-500 uppercase dark:text-white/70">
                  NO SKIN SELECTED
                </p>
                <p className="mt-2 font-sans text-xs text-zinc-400 dark:text-white/40">
                  Select a skin from the list or click ADD PNG to create a new
                  one.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Confirmation Download Modal */}
      {pendingDownload && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200">
          <div className="animate-in zoom-in-95 w-full max-w-md rounded-xl border border-purple-500/20 bg-white/95 p-6 text-zinc-900 shadow-2xl duration-200 dark:bg-zinc-900/95 dark:text-white">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold tracking-wider uppercase">
                  Confirm Download
                </h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Verify pack details before exporting
                </p>
              </div>
            </div>

            <div className="mb-6 space-y-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 font-sans text-xs dark:border-white/5 dark:bg-black/20">
              <div className="flex justify-between">
                <span className="font-medium text-zinc-500 dark:text-zinc-400">
                  Pack Name:
                </span>
                <span className="font-semibold">{packName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-zinc-500 dark:text-zinc-400">
                  Version:
                </span>
                <span className="font-mono font-semibold">{packVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-zinc-500 dark:text-zinc-400">
                  Total Skins:
                </span>
                <span className="font-semibold">{skins.length} skins</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-zinc-200 pt-2 dark:border-white/5">
                <span className="font-medium text-zinc-500 dark:text-zinc-400">
                  File Size:
                </span>
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {(pendingDownload.blob.size / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelDownload}
                className="flex-1 cursor-pointer rounded-lg border border-zinc-300 bg-zinc-100 py-2.5 text-xs font-bold tracking-wider text-zinc-700 uppercase transition-all hover:bg-zinc-200 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={confirmDownload}
                className="flex-1 cursor-pointer rounded-lg bg-purple-600 py-2.5 text-xs font-bold tracking-wider text-white uppercase shadow-lg shadow-purple-600/20 transition-all hover:bg-purple-700"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
