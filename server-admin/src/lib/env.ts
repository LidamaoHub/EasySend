export function getEnvValue(...names: string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return value;
    }
  }

  return undefined;
}

export function getRequiredEnv(...names: string[]) {
  const value = getEnvValue(...names);
  if (!value) {
    throw new Error(`Missing required environment variable. Tried: ${names.join(", ")}`);
  }

  return value;
}
