import React, { useRef, useEffect } from "react"
import { GeometryType } from "../types"

interface SkinPreviewCanvasProps {
  textureUrl: string
  geometry: GeometryType
}

interface ExtendedCanvasRenderingContext2D extends CanvasRenderingContext2D {
  mozImageSmoothingEnabled?: boolean
  webkitImageSmoothingEnabled?: boolean
  msImageSmoothingEnabled?: boolean
}

export const SkinPreviewCanvas = React.memo(function SkinPreviewCanvas({
  textureUrl,
  geometry,
}: SkinPreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const drawPlaceholder = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number
  ) => {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
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
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)"
    ctx.font = "bold 10px system-ui, sans-serif"
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

      const isHeight64 =
        img.naturalHeight === 64 || img.naturalHeight === img.naturalWidth
      const isSlim = geometry === "geometry.humanoid.customSlim"

      const eCtx = ctx as ExtendedCanvasRenderingContext2D
      eCtx.imageSmoothingEnabled = false
      eCtx.mozImageSmoothingEnabled = false
      eCtx.webkitImageSmoothingEnabled = false
      eCtx.msImageSmoothingEnabled = false

      const cX = canvas.width / 2
      const headX = cX - 24
      const headY = 20
      const headSize = 48
      const bodyX = cX - 24
      const bodyY = 68
      const bodyW = 48
      const bodyH = 72
      const armW = isSlim ? 18 : 24
      const leftArmX = bodyX - armW
      const rightArmX = bodyX + bodyW
      const legW = 24
      const legH = 72
      const leftLegX = cX - legW
      const rightLegX = cX

      // 1. Draw Legs
      ctx.drawImage(img, 4, 20, 4, 12, leftLegX, 140, legW, legH)
      if (isHeight64) {
        ctx.drawImage(img, 20, 52, 4, 12, rightLegX, 140, legW, legH)
      } else {
        ctx.drawImage(img, 4, 20, 4, 12, rightLegX, 140, legW, legH)
      }
      if (isHeight64) {
        ctx.drawImage(img, 4, 36, 4, 12, leftLegX, 140, legW, legH)
        ctx.drawImage(img, 4, 52, 4, 12, rightLegX, 140, legW, legH)
      }

      // 2. Draw Body
      ctx.drawImage(img, 20, 20, 8, 12, bodyX, bodyY, bodyW, bodyH)
      if (isHeight64) {
        ctx.drawImage(img, 20, 36, 8, 12, bodyX, bodyY, bodyW, bodyH)
      }

      // 3. Draw Arms
      const srcArmW = isSlim ? 3 : 4
      ctx.drawImage(img, 44, 20, srcArmW, 12, leftArmX, 68, armW, bodyH)
      if (isHeight64) {
        ctx.drawImage(img, 36, 52, srcArmW, 12, rightArmX, 68, armW, bodyH)
      } else {
        ctx.drawImage(img, 44, 20, srcArmW, 12, rightArmX, 68, armW, bodyH)
      }
      if (isHeight64) {
        ctx.drawImage(img, 44, 36, srcArmW, 12, leftArmX, 68, armW, bodyH)
        ctx.drawImage(img, 52, 52, srcArmW, 12, rightArmX, 68, armW, bodyH)
      }

      // 4. Draw Head
      ctx.drawImage(img, 8, 8, 8, 8, headX, headY, headSize, headSize)
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
        className="pixelated relative z-10 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] select-none"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  )
})
