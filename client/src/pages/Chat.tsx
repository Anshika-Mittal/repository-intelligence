import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { Send, Bot, User, LoaderCircle } from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { chatService } from "../services/chatService";
import type { ChatMessage } from "../types/chat";

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(searchParams.get("prompt") || "");

  const [conversationId, setConversationId] = useState<string | undefined>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      setMessages([]);
      setConversationId(undefined);
    }
  }, [id]);

  const sendMessage = async () => {
    const question = input.trim();

    if (!question || !id || loading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await chatService.sendMessage({
        repositoryId: id,
        message: question,
        conversationId,
      });

      if (response.conversationId) {
        setConversationId(response.conversationId);
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.answer,
        sources: response.sources || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError("Unable to generate a response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-heading">
        <Bot size={25} />
        <div>
          <h2>Repository AI Assistant</h2>
          <p>Ask questions about your indexed codebase.</p>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <Bot size={45} />
            <h2>What would you like to understand?</h2>
            <p>
              Ask about architecture, code flow, features or contribution
              opportunities.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            {message.role === "user" ? <User size={19} /> : <Bot size={19} />}

            <div className="message-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>

              {message.sources?.length ? (
                <div className="message-sources">
                  <strong>Sources</strong>

                  {message.sources.map((source, index) => (
                    <div key={index}>
                      <code>{source.filePath}</code>

                      {source.excerpt && <p>{source.excerpt}</p>}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}

        {loading && (
          <div className="typing-indicator">
            <LoaderCircle size={18} className="spin" />
            AI is thinking...
          </div>
        )}

        {error && <p className="error-message">{error}</p>}
      </div>

      <div className="chat-input-container">
        <textarea
          placeholder="Ask anything about this repository..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        <button
          className="primary-button"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
