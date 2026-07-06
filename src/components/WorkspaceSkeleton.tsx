import React from "react"
import { Settings, User, HelpCircle } from "lucide-react"

export function WorkspaceSkeleton() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-slate-50/20 pb-12 font-sans text-zinc-900 antialiased transition-colors duration-300 dark:bg-black/40 dark:text-white">
      {/* Hardware-accelerated fixed background image */}
      <div
        className="pointer-events-none fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg.jpg')" }}
      />
      {/* Background ambient glows wrapped to prevent vertical scroll overflow */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] h-[800px] w-[800px] rounded-full bg-purple-600/5 blur-[120px] dark:bg-purple-900/10" />
        <div className="absolute right-[-10%] bottom-[-20%] h-[600px] w-[600px] rounded-full bg-indigo-600/5 blur-[120px] dark:bg-indigo-900/10" />
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        <div className="grid animate-pulse grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left panel: configurations */}
          <section className="flex flex-col space-y-6 lg:col-span-4">
            {/* PackSettings Skeleton */}
            <div className="relative overflow-hidden rounded-xl border border-purple-500/10 bg-white/90 p-6 shadow-md backdrop-blur-md dark:border-purple-500/20 dark:bg-zinc-900/60 dark:shadow-xl dark:shadow-black/20">
              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-purple-500/30 to-indigo-500/30" />
              <div className="mb-5 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-zinc-300 uppercase dark:text-white/30">
                  <Settings className="h-4 w-4 text-zinc-300 dark:text-white/20" />
                  <span>Pack Settings</span>
                </h2>
                <div className="h-7 w-7 rounded-lg bg-zinc-200 dark:bg-white/5" />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 h-3.5 w-24 rounded bg-zinc-200 dark:bg-white/5" />
                  <div className="h-10 w-full rounded-lg bg-zinc-100 dark:bg-white/5" />
                </div>
                <div>
                  <div className="mb-2 h-3.5 w-20 rounded bg-zinc-200 dark:bg-white/5" />
                  <div className="h-10 w-full rounded-lg bg-zinc-100 dark:bg-white/5" />
                </div>
              </div>
            </div>

            {/* SkinList Skeleton */}
            <div className="rounded-xl border border-purple-500/10 bg-white/90 p-6 shadow-md backdrop-blur-md dark:border-purple-500/20 dark:bg-zinc-900/60 dark:shadow-xl dark:shadow-black/20">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-zinc-300 uppercase dark:text-white/30">
                  <User className="h-4 w-4 text-zinc-300 dark:text-white/20" />
                  <span>Skins</span>
                </h2>
                <div className="h-7 w-20 rounded-lg bg-zinc-200 dark:bg-white/5" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50/50 p-3 dark:border-white/5 dark:bg-zinc-800/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-zinc-200 dark:bg-white/10" />
                      <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-white/10" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-10 rounded bg-zinc-200 dark:bg-white/10" />
                      <div className="h-4 w-4 rounded bg-zinc-200 dark:bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Card Skeleton */}
            <div className="mt-auto rounded-xl border border-purple-500/10 bg-white/90 p-6 text-center shadow-md backdrop-blur-md dark:border-purple-500/20 dark:bg-zinc-900/60 dark:shadow-xl dark:shadow-black/20">
              <div className="h-12 w-full rounded-lg bg-zinc-200 dark:bg-white/10" />
            </div>
          </section>

          {/* Right panel: detail workspace */}
          <section className="space-y-6 lg:col-span-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              {/* 3D Projection Skeleton */}
              <div className="flex flex-col items-center justify-between rounded-xl border border-purple-500/10 bg-white/90 p-8 shadow-md backdrop-blur-md md:col-span-5 dark:border-purple-500/20 dark:bg-zinc-900/60 dark:shadow-xl dark:shadow-black/20">
                <div className="mb-6 flex w-full items-center justify-between border-b border-zinc-200 pb-4 dark:border-white/10">
                  <h3 className="text-xs font-semibold tracking-widest text-zinc-300 uppercase dark:text-white/30">
                    Skin Projection
                  </h3>
                  <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-white/10" />
                </div>
                <div className="relative flex h-[240px] w-full items-center justify-center rounded-xl border border-zinc-200/50 bg-zinc-100/50 p-6 dark:border-white/5 dark:bg-black/40">
                  <HelpCircle className="h-10 w-10 text-zinc-200 dark:text-white/10" />
                </div>
                <div className="mt-6 flex w-full flex-col items-center space-y-2.5 text-center">
                  <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-white/10" />
                  <div className="h-8 w-4/5 rounded bg-zinc-100 dark:bg-white/5" />
                  <div className="h-6 w-2/3 rounded bg-zinc-100 dark:bg-white/5" />
                </div>
              </div>

              {/* Edit Form Skeleton */}
              <div className="flex flex-col justify-between rounded-xl border border-purple-500/10 bg-white/90 p-8 shadow-md backdrop-blur-md md:col-span-7 dark:border-purple-500/20 dark:bg-zinc-900/60 dark:shadow-xl dark:shadow-black/20">
                <div className="space-y-6">
                  <div className="border-b border-zinc-200 pb-4 dark:border-white/10">
                    <div className="h-4 w-36 rounded bg-zinc-200 dark:bg-white/10" />
                    <div className="mt-2 h-3.5 w-60 rounded bg-zinc-100 dark:bg-white/5" />
                  </div>

                  <div>
                    <div className="mb-2 h-3.5 w-28 rounded bg-zinc-200 dark:bg-white/10" />
                    <div className="h-11 w-full rounded-lg bg-zinc-100 dark:bg-white/5" />
                  </div>

                  <div>
                    <div className="mb-2.5 h-3.5 w-44 rounded bg-zinc-200 dark:bg-white/10" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-16 rounded-xl border border-zinc-200 bg-zinc-50/50 dark:border-white/5 dark:bg-black/20" />
                      <div className="h-16 rounded-xl border border-zinc-200 bg-zinc-50/50 dark:border-white/5 dark:bg-black/20" />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 h-3.5 w-24 rounded bg-zinc-200 dark:bg-white/10" />
                    <div className="h-32 w-full rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/20 dark:border-white/5 dark:bg-black/10" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
