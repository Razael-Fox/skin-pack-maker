import React, { useRef, useEffect, useState } from "react"
import { GeometryType } from "../types"

interface SkinPreviewCanvasProps {
  textureUrl: string
  geometry: GeometryType
}

interface ExtendedContext extends CanvasRenderingContext2D {
  mozImageSmoothingEnabled?: boolean
  webkitImageSmoothingEnabled?: boolean
  msImageSmoothingEnabled?: boolean
}

interface Point3D {
  x: number
  y: number
  z: number
}

interface Point2D {
  x: number
  y: number
}

interface Face {
  name: string
  p0: Point3D
  p1: Point3D
  p2: Point3D
  p3: Point3D
  tx: number
  ty: number
  tw: number
  th: number
  isOuter: boolean
  mirrorX: boolean
}

export const SkinPreviewCanvas = React.memo(function SkinPreviewCanvas({
  textureUrl,
  geometry,
}: SkinPreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [isImgLoaded, setIsImgLoaded] = useState(false)

  // Drag interaction states
  const yawRef = useRef<number>(0.6) // starting rotation angle (yaw)
  const pitchRef = useRef<number>(-0.2) // starting tilt angle (pitch)
  const isDraggingRef = useRef<boolean>(false)
  const lastMousePosRef = useRef<Point2D>({ x: 0, y: 0 })
  const lastInteractTimeRef = useRef<number>(0)

  // Bug #5 fix: cache faces geometry so it's not rebuilt every frame
  const facesRef = useRef<Face[]>([])
  const facesGeometryKeyRef = useRef<string>("")

  // Load the texture image when textureUrl changes
  useEffect(() => {
    if (!textureUrl) {
      imgRef.current = null
      setIsImgLoaded(false)
      return
    }

    let active = true
    const img = new Image()
    img.src = textureUrl
    img.onload = () => {
      if (!active) return
      imgRef.current = img
      setIsImgLoaded(true)
    }
    img.onerror = () => {
      if (!active) return
      imgRef.current = null
      setIsImgLoaded(false)
    }

    return () => {
      active = false
    }
  }, [textureUrl])

  // Mouse / Touch Event Handlers
  const handleStart = (clientX: number, clientY: number) => {
    isDraggingRef.current = true
    lastMousePosRef.current = { x: clientX, y: clientY }
    lastInteractTimeRef.current = Date.now()
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return
    const dx = clientX - lastMousePosRef.current.x
    const dy = clientY - lastMousePosRef.current.y

    yawRef.current -= dx * 0.01
    // Lock pitch to prevent flipping upside down
    pitchRef.current = Math.max(
      -0.6,
      Math.min(0.6, pitchRef.current + dy * 0.01)
    )

    lastMousePosRef.current = { x: clientX, y: clientY }
    lastInteractTimeRef.current = Date.now()
  }

  const handleEnd = () => {
    isDraggingRef.current = false
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY)
  }

  const handleMouseUpOrLeave = () => {
    handleEnd()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  const handleTouchEnd = () => {
    handleEnd()
  }

  // Core 3D Rendering loop
  useEffect(() => {
    let animationFrameId: number
    let active = true

    // Bug #3 fix: cache canvas + ctx outside render loop
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d") as ExtendedContext | null
    if (!ctx) return

    // Bug #4 fix: set imageSmoothingEnabled once, not per face per frame
    ctx.imageSmoothingEnabled = false
    ;(ctx as ExtendedContext).mozImageSmoothingEnabled = false
    ;(ctx as ExtendedContext).webkitImageSmoothingEnabled = false
    ;(ctx as ExtendedContext).msImageSmoothingEnabled = false

    const render = () => {
      if (!active) return

      // 1. Update yaw (auto-rotate if not interacting recently)
      if (
        !isDraggingRef.current &&
        Date.now() - lastInteractTimeRef.current > 4000
      ) {
        yawRef.current += 0.012
      }

      // 2. Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 3. Define 3D projection parameters
      const scale = 5.8
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2 + 15

      const cosY = Math.cos(yawRef.current)
      const sinY = Math.sin(yawRef.current)
      const cosP = Math.cos(pitchRef.current)
      const sinP = Math.sin(pitchRef.current)

      // 3D rotation and projection helpers
      const rotate = (p: Point3D): Point3D => {
        // Rotate around Y-axis (Yaw)
        const x1 = p.x * cosY - p.z * sinY
        const z1 = p.x * sinY + p.z * cosY
        const y1 = p.y

        // Rotate around X-axis (Pitch)
        const x2 = x1
        const y2 = y1 * cosP - z1 * sinP
        const z2 = y1 * sinP + z1 * cosP

        return { x: x2, y: y2, z: z2 }
      }

      const project = (p: Point3D): Point2D => ({
        x: centerX + p.x * scale,
        y: centerY - p.y * scale,
      })

      // 4. Build skin geometry faces (Bug #5 fix: cache and only rebuild when key changes)
      const img = imgRef.current
      const isHeight64 = img
        ? img.naturalHeight === 64 || img.naturalHeight === img.naturalWidth
        : true
      const isSlim = geometry === "geometry.humanoid.customSlim"
      const armW = isSlim ? 3 : 4

      const geometryKey = `${String(isHeight64)}-${String(isSlim)}`
      let faces: Face[]
      if (facesGeometryKeyRef.current === geometryKey && facesRef.current.length > 0) {
        faces = facesRef.current
      } else {
        faces = []

        // Helper function to create standard cube faces
        const addBox = (
          xmin: number,
          xmax: number,
          ymin: number,
          ymax: number,
          zmin: number,
          zmax: number,
          tx: number,
          ty: number,
          dx: number,
          dy: number,
          dz: number,
          isOuter: boolean,
          mirrorX: boolean = false
        ) => {
          const createFace = (
            name: string,
            p0: Point3D,
            p1: Point3D,
            p2: Point3D,
            p3: Point3D,
            txFace: number,
            tyFace: number,
            twFace: number,
            thFace: number
          ) => {
            faces.push({
              name,
              p0,
              p1,
              p2,
              p3,
              tx: txFace,
              ty: tyFace,
              tw: twFace,
              th: thFace,
              isOuter,
              mirrorX,
            })
          }

          // Front
          createFace(
            "front",
            { x: xmin, y: ymax, z: zmax },
            { x: xmax, y: ymax, z: zmax },
            { x: xmin, y: ymin, z: zmax },
            { x: xmax, y: ymin, z: zmax },
            tx + dz,
            ty + dz,
            dx,
            dy
          )

          // Back
          createFace(
            "back",
            { x: xmax, y: ymax, z: zmin },
            { x: xmin, y: ymax, z: zmin },
            { x: xmax, y: ymin, z: zmin },
            { x: xmin, y: ymin, z: zmin },
            tx + dz + dx + dz,
            ty + dz,
            dx,
            dy
          )

          // Right (West side of model)
          createFace(
            "right",
            { x: xmax, y: ymax, z: zmax },
            { x: xmax, y: ymax, z: zmin },
            { x: xmax, y: ymin, z: zmax },
            { x: xmax, y: ymin, z: zmin },
            tx + dz + dx,
            ty + dz,
            dz,
            dy
          )

          // Left (East side of model)
          createFace(
            "left",
            { x: xmin, y: ymax, z: zmin },
            { x: xmin, y: ymax, z: zmax },
            { x: xmin, y: ymin, z: zmin },
            { x: xmin, y: ymin, z: zmax },
            tx,
            ty + dz,
            dz,
            dy
          )

          // Top
          createFace(
            "top",
            { x: xmin, y: ymax, z: zmin },
            { x: xmax, y: ymax, z: zmin },
            { x: xmin, y: ymax, z: zmax },
            { x: xmax, y: ymax, z: zmax },
            tx + dz,
            ty,
            dx,
            dz
          )

          // Bottom
          createFace(
            "bottom",
            { x: xmin, y: ymin, z: zmax },
            { x: xmax, y: ymin, z: zmax },
            { x: xmin, y: ymin, z: zmin },
            { x: xmax, y: ymin, z: zmin },
            tx + dz + dx,
            ty,
            dx,
            dz
          )
        }

        // Outer layers have a slight inflation factor
        const o = 0.375

        // Base Head
        addBox(-4, 4, 6, 14, -4, 4, 0, 0, 8, 8, 8, false)
        // Head Hat layer
        addBox(-4 - o, 4 + o, 6 - o, 14 + o, -4 - o, 4 + o, 32, 0, 8, 8, 8, true)

        // Base Torso
        addBox(-4, 4, -6, 6, -2, 2, 16, 16, 8, 12, 4, false)
        if (isHeight64) {
          // Jacket layer
          addBox(
            -4 - o,
            4 + o,
            -6 - o,
            6 + o,
            -2 - o,
            2 + o,
            16,
            32,
            8,
            12,
            4,
            true
          )
        }

        // Base Right Arm
        addBox(-4 - armW, -4, -6, 6, -2, 2, 40, 16, armW, 12, 4, false)
        if (isHeight64) {
          // Right Sleeve layer
          addBox(
            -4 - armW - o,
            -4 + o,
            -6 - o,
            6 + o,
            -2 - o,
            2 + o,
            40,
            32,
            armW,
            12,
            4,
            true
          )
        }

        // Base Left Arm
        if (isHeight64) {
          addBox(4, 4 + armW, -6, 6, -2, 2, 32, 48, armW, 12, 4, false)
          // Left Sleeve layer
          addBox(
            4 - o,
            4 + armW + o,
            -6 - o,
            6 + o,
            -2 - o,
            2 + o,
            48,
            48,
            armW,
            12,
            4,
            true
          )
        } else {
          // Mirror from Right Arm for 64x32 legacy skins
          addBox(4, 4 + armW, -6, 6, -2, 2, 40, 16, armW, 12, 4, false, true)
        }

        // Base Right Leg
        addBox(-4, 0, -18, -6, -2, 2, 0, 16, 4, 12, 4, false)
        if (isHeight64) {
          // Right Pant layer
          addBox(
            -4 - o,
            0 + o,
            -18 - o,
            -6 + o,
            -2 - o,
            2 + o,
            0,
            32,
            4,
            12,
            4,
            true
          )
        }

        // Base Left Leg
        if (isHeight64) {
          addBox(0, 4, -18, -6, -2, 2, 16, 48, 4, 12, 4, false)
          // Left Pant layer
          addBox(
            0 - o,
            4 + o,
            -18 - o,
            -6 + o,
            -2 - o,
            2 + o,
            0,
            48,
            4,
            12,
            4,
            true
          )
        } else {
          // Mirror from Right Leg for 64x32 legacy skins
          addBox(0, 4, -18, -6, -2, 2, 0, 16, 4, 12, 4, false, true)
        }

        // Cache rebuilt faces
        facesRef.current = faces
        facesGeometryKeyRef.current = geometryKey
      }

      // 5. Project vertices and calculate depth
      interface RenderFace {
        face: Face
        r0: Point3D
        r1: Point3D
        r2: Point3D
        r3: Point3D
        s0: Point2D
        s1: Point2D
        s2: Point2D
        s3: Point2D
        avgZ: number
        normalZ: number
        shading: number
      }

      const renderedFaces: RenderFace[] = []

      // Light vector from front-top-right: (0.45, 0.77, 0.45)
      const lx = 0.45
      const ly = 0.77
      const lz = 0.45
      const lLen = Math.sqrt(lx * lx + ly * ly + lz * lz)

      faces.forEach((face) => {
        const r0 = rotate(face.p0)
        const r1 = rotate(face.p1)
        const r2 = rotate(face.p2)
        const r3 = rotate(face.p3)

        const avgZ = (r0.z + r1.z + r2.z + r3.z) / 4

        const s0 = project(r0)
        const s1 = project(r1)
        const s2 = project(r2)
        const s3 = project(r3)

        // Compute outward face normal vector N = B x A
        const ax = r1.x - r0.x
        const ay = r1.y - r0.y
        const az = r1.z - r0.z

        const bx = r2.x - r0.x
        const by = r2.y - r0.y
        const bz = r2.z - r0.z

        const nx = by * az - bz * ay
        const ny = bz * ax - bx * az
        const nz = bx * ay - by * ax

        const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz)
        let normalZ = 0
        let shading = 0.8 // default fallback

        if (nLen > 0) {
          const normX = nx / nLen
          const normY = ny / nLen
          const normZ = nz / nLen

          // Normal facing camera check
          normalZ = normZ

          // Light Shading Dot Product
          const dot = (normX * lx + normY * ly + normZ * lz) / lLen
          shading = Math.max(0.35, Math.min(1.0, (dot + 1) / 2 + 0.1))
        }

        renderedFaces.push({
          face,
          r0,
          r1,
          r2,
          r3,
          s0,
          s1,
          s2,
          s3,
          avgZ,
          normalZ,
          shading,
        })
      })

      // 6. Depth Sort (painter's algorithm)
      // Draw faces from back (lowest avgZ) to front (highest avgZ)
      renderedFaces.sort((a, b) => a.avgZ - b.avgZ)

      // 7. Draw faces on Canvas
      renderedFaces.forEach(({ face, s0, s1, s2, s3, normalZ, shading }) => {
        // Backface Culling:
        // For base layers, we can cull faces pointing away from the camera (normalZ < 0).
        // For outer layers, we do NOT cull since transparency is very common and we want to see inner parts of the hat/jacket.
        if (!face.isOuter && normalZ < 0) {
          return
        }

        ctx.save()

        if (img && isImgLoaded) {
          // Texture mode: Render using affine transformation matrix on Canvas
          let pStart = s0
          let pHoriz = s1
          let pVert = s2

          if (face.mirrorX) {
            pStart = s1
            pHoriz = s0
            pVert = s3
          }

          const m11 = (pHoriz.x - pStart.x) / face.tw
          const m12 = (pHoriz.y - pStart.y) / face.tw
          const m21 = (pVert.x - pStart.x) / face.th
          const m22 = (pVert.y - pStart.y) / face.th

          // Bug #4 fix: imageSmoothingEnabled is set once outside forEach, no need to repeat here
          ctx.setTransform(m11, m12, m21, m22, pStart.x, pStart.y)
          ctx.drawImage(
            img,
            face.tx,
            face.ty,
            face.tw,
            face.th,
            0,
            0,
            face.tw,
            face.th
          )

          // Restore normal coordinate system for shading overlay
          ctx.restore()
          ctx.save()

          // Draw shading overlay
          ctx.beginPath()
          ctx.moveTo(s0.x, s0.y)
          ctx.lineTo(s1.x, s1.y)
          ctx.lineTo(s3.x, s3.y)
          ctx.lineTo(s2.x, s2.y)
          ctx.closePath()

          // Shading overlay color
          if (shading < 0.6) {
            ctx.fillStyle = `rgba(0, 0, 0, ${(0.6 - shading) * 0.7})`
            ctx.fill()
          } else if (shading > 0.6) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(shading - 0.6) * 0.25})`
            ctx.fill()
          }
        } else {
          // Dummy mannequin mode: solid color shading
          ctx.beginPath()
          ctx.moveTo(s0.x, s0.y)
          ctx.lineTo(s1.x, s1.y)
          ctx.lineTo(s3.x, s3.y)
          ctx.lineTo(s2.x, s2.y)
          ctx.closePath()

          // Dummy Slate/Purple shade
          const baseColor = face.isOuter ? [139, 92, 246] : [113, 113, 122] // purple for outer, gray for inner
          const r = Math.round(baseColor[0] * shading)
          const g = Math.round(baseColor[1] * shading)
          const b = Math.round(baseColor[2] * shading)

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
          ctx.fill()

          // Thin elegant outline
          ctx.strokeStyle = "rgba(0, 0, 0, 0.15)"
          ctx.lineWidth = 0.5
          ctx.stroke()
        }

        ctx.restore()
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      active = false
      cancelAnimationFrame(animationFrameId)
      // Reset ctx transform on cleanup to avoid stale state
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    }
  }, [isImgLoaded, geometry])

  return (
    <div
      className="relative flex aspect-[4/5] w-full max-w-[240px] cursor-grab items-center justify-center overflow-hidden bg-transparent p-1 select-none active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <canvas
        ref={canvasRef}
        width={200}
        height={240}
        className="relative z-10 drop-shadow-[0_12px_15px_rgba(0,0,0,0.55)] select-none"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  )
})
