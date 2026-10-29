/** Colores sólidos alrededor de la marca. Sin pasteles. */
const TONES = [
  { bg: "#1E5DA1", fg: "#ffffff" },
  { bg: "#163E73", fg: "#ffffff" },
  { bg: "#0F2D54", fg: "#ffffff" },
  { bg: "#2563EB", fg: "#ffffff" },
  { bg: "#0F766E", fg: "#ffffff" },
  { bg: "#334155", fg: "#ffffff" },
  { bg: "#1E3A5F", fg: "#ffffff" },
  { bg: "#0369A1", fg: "#ffffff" },
] as const

export function avatarTone(name: string) {
  const seed = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return TONES[seed % TONES.length]
}
