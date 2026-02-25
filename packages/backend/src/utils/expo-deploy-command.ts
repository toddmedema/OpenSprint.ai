/** Build Expo deploy command (beta or prod). Expo/EAS handles build internally; no npm run build. */
export function getExpoDeployCommand(variant: "beta" | "prod"): string {
  const easSuffix = variant === "prod" ? " --prod" : "";
  return "npx expo export --platform web && npx eas-cli deploy" + easSuffix;
}
