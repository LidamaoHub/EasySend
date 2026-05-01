const adjectives = ["开心的", "沉稳的", "灵活的", "安静的"];
const nouns = ["菠萝", "橙子", "鲸鱼", "山雀"];

export function generateDeviceName(deviceType: string) {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${deviceType}-${adjective}${noun}`;
}
