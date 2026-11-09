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
    trace: 'enabled_full', // Options: 'enabled', 'disabled', 'enabled_full'
    streamProcessingMode: 'sync', // Options: 'sync', 'async'
    redaction: {
      input: true, // Default: true
      inputMessage: '[User input redacted.]', // Custom redaction message
      output: false, // Default: false
      outputMessage: '[Assistant output redacted.]', // Custom redaction message
    },
  },
});
