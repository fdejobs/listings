export const CLASSIFIER_VERSION = "fde-classifier-v2";

export function classifierPrompt(input: {
  title: string;
  company_name: string;
  description: string;
  location: string;
}) {
  return [
    "Classify whether this job is relevant to a jobs board for Forward Deployed Engineers, Deployed Engineers, Customer Engineers, Implementation Engineers, and adjacent hands-on technical deployment roles.",
    "Relevant roles usually combine software engineering, deployment, integration, customer-facing work, technical strategy, implementation, or field engineering.",
    "Not relevant: solution engineer roles, solution architect roles, sales engineer roles, generic sales, account executives, support-only roles, non-technical customer success, pure product management, or generic backend roles with no customer/deployment component.",
    "Infer travel and customer-facing bands only from evidence. If not stated, choose the conservative lower band.",
    "",
    `Title: ${input.title}`,
    `Company: ${input.company_name}`,
    `Location: ${input.location}`,
    `Description:
${input.description.slice(0, 8000)}`
  ].join("\n");
}
