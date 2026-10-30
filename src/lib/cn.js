// Tiny class-name joiner: cn("a", cond && "b") -> "a b"
export function cn(...parts) {
  const out = [];
  const walk = (value) => {
    if (Array.isArray(value)) value.forEach(walk);
    else if (value) out.push(String(value));
  };
  parts.forEach(walk);
  return out.join(" ");
}
