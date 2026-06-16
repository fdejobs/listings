const strictFdeTitlePatterns: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /\bsales engineers?\b|\bsales engineering\b/i,
    reason: "Sales engineer roles are excluded from the stricter forward-deployed definition."
  },
  {
    pattern: /\bsolutions? engineers?\b|\bsolutions? engineering\b/i,
    reason: "Solutions engineer roles are excluded from the stricter forward-deployed definition."
  },
  {
    pattern: /\bsolutions? architects?\b|\bsolutions? architecture\b/i,
    reason: "Solution architect roles are excluded from the stricter forward-deployed definition."
  }
];

export function getStrictFdeExclusionReason(title: string) {
  for (const { pattern, reason } of strictFdeTitlePatterns) {
    if (pattern.test(title)) {
      return reason;
    }
  }

  return null;
}

export function isStrictFdeTitle(title: string) {
  return getStrictFdeExclusionReason(title) === null;
}
