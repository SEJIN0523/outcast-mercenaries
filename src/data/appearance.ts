import type { ClassId } from "../domain/types";

export const EYE_COLORS = [
  "#7893a0",
  "#a47a4c",
  "#749568",
  "#b39555",
  "#9a80b5",
  "#6e626a",
];
/** Curated palettes keep each class readable instead of arbitrary RGB noise. */
export const OUTFIT_COLORS: Record<ClassId, readonly string[]> = {
  warrior: ["#b87055", "#8c6670", "#73829a", "#8d885c", "#6a8a82", "#ae9066"],
  archer: ["#7b9b65", "#9b626d", "#637e9c", "#ac945b", "#8d729b", "#609a91"],
  mage: ["#9983b5", "#6d8fae", "#af718c", "#6b9d96", "#a38d62", "#756f9d"],
  priest: ["#d5be87", "#bdc6ad", "#cfa8b6", "#a6bccc", "#c5b1d2", "#c7b09a"],
  rogue: ["#8c9cad", "#806c92", "#6d8e85", "#956777", "#9b855f", "#66788d"],
  lancer: ["#758eae", "#9c6c72", "#728b7b", "#a18c65", "#8375a0", "#648e96"],
  guardian: ["#a79463", "#899ba7", "#9b7770", "#718f7f", "#9181a3", "#a58b76"],
  bard: ["#bd7f9b", "#769e95", "#a78cb6", "#bca269", "#7495b0", "#bd8c70"],
};
export const OUTFIT_STYLES = [
  "standard",
  "short-jacket",
  "split-coat",
] as const;
export const WEAPON_STYLES = ["standard", "broad", "curved"] as const;
