export function selectedMatchRule(matchRules, defaultMatchRule, ruleId) {
  return matchRules[ruleId] || matchRules[defaultMatchRule];
}

export function isTimedMatch(rule) {
  return rule.type === "time";
}

export function targetGoals(rule) {
  return rule.type === "firstTo" ? rule.goals : null;
}
