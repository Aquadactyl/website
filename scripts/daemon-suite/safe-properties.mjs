// Keep workload settings while withholding automatically generated game secrets.
export function safeProperties(text) {
  return text
    .split(/\r?\n/)
    .map((line) => {
      if (line.startsWith("#") || !line.includes("=")) return line;
      const at = line.indexOf("="),
        key = line.slice(0, at),
        value = line.slice(at + 1);
      return /secret|password|token/i.test(key) && value
        ? key + "=<redacted>"
        : line;
    })
    .join("\n");
}
