export type GeometryType =
  | "geometry.humanoid.custom"
  | "geometry.humanoid.customSlim"
export type SkinType = "free" | "paid"

export interface SkinItem {
  id: string
  name: string
  geometry: GeometryType
  type: SkinType
  textureName: string
  textureFile: File | null
  textureUrl: string
}
