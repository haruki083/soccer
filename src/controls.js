export const CONTROL_ACTIONS = [
  { id: "moveUp", defaultKey: "w" },
  { id: "moveLeft", defaultKey: "a" },
  { id: "moveDown", defaultKey: "s" },
  { id: "moveRight", defaultKey: "d" },
  { id: "sprint", defaultKey: "shift" },
  { id: "slide", defaultKey: "space" },
  { id: "item", defaultKey: "l" },
  { id: "pause", defaultKey: "p" },
  { id: "reset", defaultKey: "r" },
];

export const DEFAULT_CONTROL_BINDINGS = Object.fromEntries(CONTROL_ACTIONS.map((action) => [action.id, action.defaultKey]));

export function normalizeKeyName(key) {
  const lower = String(key || "").toLowerCase();
  if (lower === " " || lower === "spacebar") return "space";
  if (lower === "esc") return "escape";
  return lower;
}

export function keyLabel(key) {
  const labels = {
    arrowdown: "↓",
    arrowleft: "←",
    arrowright: "→",
    arrowup: "↑",
    escape: "Esc",
    shift: "Shift",
    space: "Space",
  };
  return labels[key] || key.toUpperCase();
}

export function isTextEditingTarget(target) {
  const element = target instanceof Element ? target : null;
  if (!element) return false;
  const editor = element.closest("input, textarea, select, [contenteditable='true']");
  if (!editor) return false;
  if (editor.matches("textarea, select, [contenteditable='true']")) return true;
  const type = (editor.getAttribute("type") || "text").toLowerCase();
  return !["button", "checkbox", "color", "file", "radio", "range", "reset", "submit"].includes(type);
}

export function normalizeControlBindings(saved) {
  const bindings = { ...DEFAULT_CONTROL_BINDINGS };
  for (const action of CONTROL_ACTIONS) {
    const savedKey = normalizeKeyName(saved?.[action.id]);
    if (savedKey) bindings[action.id] = savedKey;
  }
  return bindings;
}
