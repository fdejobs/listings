export const CLASSIFIER_VERSION = "fde-classifier-v4";

export function classifierPrompt(input: {
  title: string;
  company_name: string;
  description: string;
  location: string;
}) {
  return [
    "Classify whether this job is relevant to a jobs board for FDE-team roles: Forward Deployed Engineers, FDE managers, and company-specific Deployed Engineer roles that clearly sit in a forward-deployed engineering motion.",
    "Relevant roles usually combine software engineering, explicit forward-deployed ownership, deployment, integration, and customer-facing execution.",
    "Not relevant: solution engineer roles, solution architect roles, sales engineer roles, field engineering roles, AI deployment engineer roles, deployment manager roles, generic customer engineer roles, implementation engineer roles, technical consultant roles, generic sales, account executives, support-only roles, non-technical customer success, pure product management, or generic backend roles with no customer/deployment component. For OpenAI specifically, keep only titles that are explicitly forward-deployed.",
    "Infer travel and customer-facing bands only from evidence. If not stated, choose the conservative lower band.",
    "",
    `Title: ${input.title}`,
    `Company: ${input.company_name}`,
    `Location: ${input.location}`,
    `Description:\n${input.description.slice(0, 8000)}`
  ].join("\n");
}
