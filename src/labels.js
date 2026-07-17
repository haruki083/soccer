export function translate(i18n, language, fallbackLanguage, path) {
  const read = (sourceLanguage) =>
    path.split(".").reduce((value, key) => (value && value[key] !== undefined ? value[key] : undefined), i18n[sourceLanguage]);
  return read(language) ?? read(fallbackLanguage) ?? path;
}

export function itemName(tr, type) {
  return tr(`items.${type}`);
}

export function itemIcon(tr, type) {
  return tr(`itemIcons.${type}`);
}

export function itemCharges(itemTypes, type) {
  return Math.max(1, itemTypes[type]?.charges || 1);
}

export function heldItemLabel(tr, itemTypes, player) {
  if (!player?.heldItem) return tr("ui.empty");
  const charges = player.heldItemCharges || itemCharges(itemTypes, player.heldItem);
  return charges > 1 ? `${itemName(tr, player.heldItem)} x${charges}` : itemName(tr, player.heldItem);
}

export function tacticLabel(tr, tacticId) {
  return tr(`tactics.${tacticId}`);
}

export function matchRuleLabel(tr, ruleId) {
  return tr(`matchRules.${ruleId}`);
}

export function aiDifficultyLabel(tr, difficultyId) {
  return tr(`aiDifficulties.${difficultyId}`);
}

export function kitLabel(tr, kitId) {
  return tr(`kits.${kitId}`);
}
