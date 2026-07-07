import JSZip from "jszip"
import { SkinItem, GeometryType, SkinType } from "../types"

export interface ParsedMcpack {
  packName: string
  packVersion: string
  uuidHeader: string
  uuidModule: string
  skins: SkinItem[]
  warnings: string[]
}

interface MinecraftManifest {
  header?: {
    name?: string
    version?: number[] | string
    uuid?: string
  }
  modules?: Array<{
    type?: string
    uuid?: string
    version?: number[] | string
  }>
}

interface MinecraftSkinsData {
  serialize_name?: string
  skins?: Array<{
    localization_name?: string
    geometry?: string
    texture?: string
    type?: "free" | "paid"
  }>
}

// Generate a random ID for imported skins
function generateShortId(): string {
  return Math.random().toString(36).slice(2, 11)
}

// Convert a Blob to a data URL asynchronously
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

// Validate that the zip archive is a valid skin pack
async function validatePackType(zip: JSZip): Promise<void> {
  const manifestFile = zip.file("manifest.json")
  if (!manifestFile) {
    throw new Error("Missing manifest.json — not a valid Minecraft pack")
  }

  let manifest: MinecraftManifest
  try {
    manifest = JSON.parse(await manifestFile.async("string"))
  } catch {
    throw new Error("Invalid manifest.json — failed to parse JSON structure")
  }

  const modules = manifest?.modules ?? []
  const moduleType = modules[0]?.type ?? "unknown"

  const TYPE_LABELS: Record<string, string> = {
    resources: "Resource Pack (Texture Pack)",
    data: "Behavior Pack",
    world_template: "World Template",
    javascript: "Script Pack",
  }

  if (moduleType !== "skin_pack") {
    const label =
      TYPE_LABELS[moduleType] ?? `Unknown Pack (type: "${moduleType}")`
    throw new Error(
      `This is a ${label}, not a Skin Pack. Please upload a valid skin pack .mcpack file.`
    )
  }
}

// Main parser function
export async function parseMcpack(file: File): Promise<ParsedMcpack> {
  const warnings: string[] = []

  // Open File as ZIP
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(file)
  } catch {
    throw new Error("File is not a valid .mcpack archive (failed to open zip)")
  }

  // Validate Pack Type
  await validatePackType(zip)

  // Parse manifest.json
  const manifestFile = zip.file("manifest.json")
  if (!manifestFile) {
    throw new Error("Missing manifest.json")
  }
  const manifest: MinecraftManifest = JSON.parse(
    await manifestFile.async("string")
  )

  const packName = manifest.header?.name ?? "Imported Skin Pack"

  // Format version to string (Minecraft uses array format [1, 0, 0])
  const versionArr = manifest.header?.version
  const packVersion = Array.isArray(versionArr) ? versionArr.join(".") : "1.0.0"

  const uuidHeader = manifest.header?.uuid ?? ""
  const uuidModule = manifest.modules?.[0]?.uuid ?? ""

  if (!uuidHeader || !uuidModule) {
    warnings.push(
      "Missing UUID header/module in manifest.json. New ones will be generated."
    )
  }

  // Parse texts/en_US.lang for localization mappings
  const langMap: Record<string, string> = {}
  const langFile = zip.file("texts/en_US.lang") || zip.file("texts/en_us.lang")
  if (langFile) {
    const langText = await langFile.async("string")
    const lines = langText.split(/\r?\n/)
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eqIdx = trimmed.indexOf("=")
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim()
        const value = trimmed.slice(eqIdx + 1).trim()
        langMap[key] = value
      }
    }
  } else {
    warnings.push(
      "Missing texts/en_US.lang — skin names may default to serialization keys."
    )
  }

  // Parse skins.json
  const skinsJsonFile = zip.file("skins.json")
  if (!skinsJsonFile) {
    warnings.push("Missing skins.json — no skins loaded from the pack.")
    return {
      packName,
      packVersion,
      uuidHeader,
      uuidModule,
      skins: [],
      warnings,
    }
  }

  let skinsData: MinecraftSkinsData
  try {
    skinsData = JSON.parse(await skinsJsonFile.async("string"))
  } catch {
    throw new Error("Invalid skins.json — failed to parse JSON structure")
  }

  const skinsList = skinsData.skins ?? []
  const parsedSkins: SkinItem[] = []
  const packSlug = skinsData.serialize_name || ""

  for (let i = 0; i < skinsList.length; i++) {
    const s = skinsList[i]
    const rawLocName = s.localization_name ?? ""

    // Find localization in en_US.lang
    let displayName = ""
    if (rawLocName) {
      // 1. Direct match: e.g. skin.slug.locName
      const possibleKeys = [
        `skin.${packSlug}.${rawLocName}`,
        `skin.${rawLocName}`,
        rawLocName,
      ]

      for (const key of possibleKeys) {
        if (langMap[key]) {
          displayName = langMap[key]
          break
        }
      }

      // 2. Scan fallback keys ending with .locName
      if (!displayName) {
        const matchedKey = Object.keys(langMap).find((k) =>
          k.endsWith(`.${rawLocName}`)
        )
        if (matchedKey) {
          displayName = langMap[matchedKey]
        }
      }
    }

    // Default to a cleaner display name if still empty
    if (!displayName) {
      displayName = rawLocName
        ? rawLocName.replace(/[^a-zA-Z0-9 ]/g, " ")
        : `Skin ${i + 1}`
    }

    // Map geometry
    let geometry: GeometryType = "geometry.humanoid.custom"
    if (s.geometry === "geometry.humanoid.customSlim") {
      geometry = "geometry.humanoid.customSlim"
    }

    // Map type
    const skinType: SkinType = s.type === "paid" ? "paid" : "free"

    // Retrieve and process texture
    const origTextureName = s.texture ?? ""
    let textureFile: File | null = null
    let textureUrl = ""

    if (origTextureName) {
      // Try to find file in ZIP
      let zipImg = zip.file(origTextureName)
      if (!zipImg) {
        // Fallback search (case-insensitive base name match)
        const baseName = origTextureName.split("/").pop()?.toLowerCase()
        if (baseName) {
          const matchedKey = Object.keys(zip.files).find((k) => {
            const kBase = k.split("/").pop()?.toLowerCase()
            return kBase === baseName
          })
          if (matchedKey) {
            zipImg = zip.file(matchedKey)
          }
        }
      }

      if (zipImg) {
        try {
          const blob = await zipImg.async("blob")
          const id = generateShortId()
          const sanitizedFilename = `skin_${id}.png`
          textureFile = new File([blob], sanitizedFilename, {
            type: "image/png",
          })
          textureUrl = await blobToDataURL(blob)

          parsedSkins.push({
            id,
            name: displayName,
            placeholderName: `Skin ${i + 1}`,
            geometry,
            type: skinType,
            textureName: sanitizedFilename,
            textureFile,
            textureUrl,
          })
        } catch {
          warnings.push(
            `Failed to read texture file "${origTextureName}" for skin "${displayName}".`
          )
        }
      } else {
        warnings.push(
          `Texture file "${origTextureName}" not found in zip for skin "${displayName}".`
        )
        // Add skin anyway (without texture), as requested by the plan
        const id = generateShortId()
        parsedSkins.push({
          id,
          name: displayName,
          placeholderName: `Skin ${i + 1}`,
          geometry,
          type: skinType,
          textureName: `skin_${id}.png`,
          textureFile: null,
          textureUrl: "",
        })
      }
    } else {
      warnings.push(`No texture specified for skin "${displayName}".`)
      const id = generateShortId()
      parsedSkins.push({
        id,
        name: displayName,
        placeholderName: `Skin ${i + 1}`,
        geometry,
        type: skinType,
        textureName: `skin_${id}.png`,
        textureFile: null,
        textureUrl: "",
      })
    }
  }

  return {
    packName,
    packVersion,
    uuidHeader,
    uuidModule,
    skins: parsedSkins,
    warnings,
  }
}
