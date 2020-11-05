import config from "../config";

export default function env(key?: string, fallback?: any) {
  const value = !key
    ? config
    : key && key.indexOf(".") >= 0
    ? key.split(".").reduce((p, c) => (p && p[c]) || null, config)
    : key && typeof config[key] !== "undefined"
    ? config[key]
    : null;

  return fallback &&
    ((!value && value !== false && value !== 0) ||
      typeof value === "undefined" ||
      value === null)
    ? fallback
    : value;
}
