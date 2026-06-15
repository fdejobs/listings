import { generateObject } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { classifierOutputSchema, type ClassifierInput, type ClassifierOutput } from "./schema";
import { classifierPrompt } from "./prompt";

function heuristic(input: ClassifierInput): ClassifierOutput {
  const title = input.title.toLowerCase();
  const text = `${input.title} ${input.description}`.toLowerCase();
  const excludedTitle = /account executive|account director|seller|sales development|field marketer|marketer|marketing|recruiter|gtm|partnership|alliances|customer success|program manager|product manager|data scientist|mobile|revenue strategy|growth|strategic enterprise|strategic sales|governance|compliance/.test(title);
  const titleSignals = [
    "forward deployed",
    "deployed engineer",
    "ai deployment engineer",
    "ai deployment manager",
    "ai success engineer",
    "solutions engineer",
    "solution engineer",
    "solutions architect",
    "solution architect",
    "customer engineer",
    "field engineer",
    "sales engineer",
    "implementation engineer",
    "technical consultant",
    "technical deployment lead"
  ];
  const customerTerms = ["customer", "client", "enterprise", "stakeholder", "onsite", "deployment"];
  const matches = titleSignals.filter((term) => title.includes(term));
  const descriptionBackstop = false;
  const isRelevant = !excludedTitle && (matches.length > 0 || descriptionBackstop);
  const highCustomer = customerTerms.filter((term) => text.includes(term)).length >= 3;
  const travelHigh = /50\+|travel extensively|onsite with customers|high travel/.test(text);

  return {
    is_fde_relevant: isRelevant,
    confidence: isRelevant ? (matches.length >= 2 ? 0.86 : 0.8) : 0.25,
    role_family: title.includes("solution") || title.includes("sales engineer") ? "solutions_engineer" : title.includes("deployed") || title.includes("deployment") ? "deployed_engineer" : title.includes("ai") ? "ai_engineer" : "fde",
    travel_pct_band: travelHigh ? "high_50_plus" : text.includes("travel") ? "low_0_25" : "none",
    customer_facing_pct_band: highCustomer ? "high_50_plus" : isRelevant ? "med_25_50" : "low_0_25",
    comp_base_min_usd: null,
    comp_base_max_usd: null,
    reasoning: "Heuristic fallback used because OPENAI_API_KEY was not configured."
  };
}

export async function classifyJob(input: ClassifierInput): Promise<ClassifierOutput> {
  if (!process.env.OPENAI_API_KEY) {
    return heuristic(input);
  }

  const configuredModel = process.env.AI_CLASSIFIER_MODEL || "claude-haiku-4-5";
  const configuredBaseURL = process.env.AI_CLASSIFIER_BASE_URL || "https://api.openai.com/v1";
  if (!process.env.AI_CLASSIFIER_BASE_URL && configuredModel.startsWith("claude")) {
    return {
      ...heuristic(input),
      reasoning: "Deterministic fallback used because the default Claude model requires an OpenAI-compatible gateway base URL."
    };
  }

  const provider = createOpenAICompatible({
    name: "fde-classifier",
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: configuredBaseURL
  });

  const model = provider.chatModel(configuredModel);
  try {
    const result = await generateObject({
      model,
      schema: classifierOutputSchema as any,
      prompt: classifierPrompt(input),
      temperature: 0
    } as any);

    return classifierOutputSchema.parse(result.object);
  } catch {
    const fallback = heuristic(input);
    return {
      ...fallback,
      reasoning: `Classifier API unavailable; used deterministic fallback. ${fallback.reasoning}`
    };
  }
}
