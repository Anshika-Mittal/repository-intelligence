import { BedrockModel } from "@strands-agents/sdk/models/bedrock";

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export const bedrockModel = new BedrockModel({
  modelId: requiredEnv("BEDROCK_MODEL_ID"),
  region: requiredEnv("AWS_REGION"),

  temperature: 0.2,
  maxTokens: 2048,

  guardrailConfig: {
    guardrailIdentifier: requiredEnv("BEDROCK_GUARDRAIL_ID"),
    guardrailVersion: requiredEnv("BEDROCK_GUARDRAIL_VERSION"),
    trace: "enabled",
    redaction: {
      input: true,
      output: false,
    },

    guardLatestUserMessage: true,
  },
});
