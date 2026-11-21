// JSON.parse accepts duplicate keys (last wins), which could hide candidates or
// replace precision evidence. Parse syntax first, then reject repeated decoded
// member names in each object, including escaped spellings of the same name.
export function strictProviderJson(bytes: Uint8Array): unknown {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const value: unknown = JSON.parse(text);
  const stack: ({ keys: Set<string>; keyExpected: boolean } | null)[] = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      const start = i++;
      while (i < text.length) {
        if (text[i] === "\\") i += 2;
        else if (text[i] === '"') break;
        else i++;
      }
      const frame = stack.at(-1);
      if (frame?.keyExpected) {
        const key: string = JSON.parse(text.slice(start, i + 1));
        if (frame.keys.has(key)) throw new Error("Duplicate provider member");
        frame.keys.add(key);
        frame.keyExpected = false;
      }
    } else if (c === "{") stack.push({ keys: new Set(), keyExpected: true });
    else if (c === "[") stack.push(null);
    else if (c === "}" || c === "]") stack.pop();
    else if (c === ",") {
      const frame = stack.at(-1);
      if (frame) frame.keyExpected = true;
    }
  }
  return value;
}
