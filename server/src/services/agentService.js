async function generateAgentResponse({
    question,
    repositoryId,
    chatId,
    conversationHistory
}) {
    /*
      CONNECT YOUR EXISTING BEDROCK AGENT HERE.

      Inputs:
        question
        repositoryId
        chatId
        conversationHistory

      Expected output:
        A string containing the assistant response.
    */

    // Temporary response for testing the chat UI.
    return `I received your question: ${question}

Your repository ID is ${repositoryId}.

The Bedrock agent integration will be connected here.`;
}

module.exports = {
    generateAgentResponse
};