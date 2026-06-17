type StrictBoardContext = {
  companySlug?: string | null;
  companyName?: string | null;
};

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
  },
  {
    pattern: /\bfield engineers?\b|\bfield engineering\b/i,
    reason: "Field engineering roles are excluded from the stricter forward-deployed definition."
  },
  {
    pattern: /\bdeployment managers?\b|\bdeployment management\b/i,
    reason: "Deployment manager roles are excluded from the stricter forward-deployed definition."
  },
  {
    pattern: /\bdeployment engineers?\b|\bdeployment engineering\b/i,
    reason: "Deployment engineer roles are excluded from the stricter forward-deployed definition."
  }
];

const adjacentNonFdePattern =
  /\bcustomer engineers?\b|\bcustomer engineering\b|\bimplementation engineers?\b|\bimplementation engineering\b|\btechnical consultants?\b/i;

function isOpenAiContext({ companySlug, companyName }: StrictBoardContext) {
  return companySlug === "openai" || /\bopenai\b/i.test(companyName ?? "");
}

function hasFdeTeamSignal(title: string) {
  return /\bforward deployed\b|\bfde\b|\b(partner )?deployed engineers?\b/i.test(title);
}

export function getStrictFdeExclusionReason(title: string, context: StrictBoardContext = {}) {
  for (const { pattern, reason } of strictFdeTitlePatterns) {
    if (pattern.test(title)) {
      return reason;
    }
  }

  if (adjacentNonFdePattern.test(title) && !hasFdeTeamSignal(title)) {
    return "Adjacent customer engineer, implementation engineer, and technical consultant roles must explicitly be FDE-team roles to stay on the stricter board.";
  }

  if (isOpenAiContext(context) && !/\bforward deployed\b/i.test(title)) {
    return "OpenAI roles must explicitly be forward-deployed roles to stay on the stricter board.";
  }

  return null;
}

export function isStrictFdeTitle(title: string, context: StrictBoardContext = {}) {
  return getStrictFdeExclusionReason(title, context) === null;
}
