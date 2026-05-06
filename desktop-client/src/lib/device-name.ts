const adjectives = ["开心的", "沉稳的", "灵活的", "安静的"];
const nouns = ["菠萝", "橙子", "鲸鱼", "山雀"];

export function detectDeviceType() {
  if (typeof navigator === "undefined") return "desktop";

  const platform = `${navigator.platform} ${navigator.userAgent}`.toLowerCase();
  if (platform.includes("mac")) return "macos";
  if (platform.includes("win")) return "windows";
  if (platform.includes("iphone") || platform.includes("ipad") || platform.includes("ios")) return "ios";
  if (platform.includes("android")) return "android";
  if (platform.includes("linux")) return "linux";
  return "desktop";
}

export function generateDeviceName(deviceType: string) {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${deviceType}-${adjective}${noun}`;
}
