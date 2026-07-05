export type GeometryType =
  | "geometry.humanoid.custom"
  | "geometry.humanoid.customSlim"
export type SkinType = "free" | "paid"

export interface SkinItem {
  id: string
  name: string
  placeholderName: string
  geometry: GeometryType
  type: SkinType
  textureName: string
  textureFile: File | null
  textureUrl: string
}
