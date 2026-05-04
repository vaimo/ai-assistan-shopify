import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useState } from "preact/hooks";

const APP_URL = "https://delay-banner-walnut.ngrok-free.dev";

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const { close, auth, extension: { target } } = shopify;
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! Ask me about this product." },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage() {
    const text = input.trim();
    if (!text || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setIsLoading(true);

    try {
      const token = await auth.idToken();
      const response = await fetch(`${APP_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text }),
      });

      const payload = await response.json();
      const reply = payload?.reply || "No response from assistant.";
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Network error. Try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <s-admin-action>
      <s-stack direction="block" gap="base">
        <s-text type="strong">AI Assistant ({target})</s-text>

        <s-stack direction="block" gap="small">
          {messages.map((message, index) => (
            <s-text key={index}>
              {message.role === "user" ? "You: " : "AI: "}
              {message.text}
            </s-text>
          ))}
          {isLoading && <s-text>Thinking...</s-text>}
        </s-stack>

        <s-text-field
          label="Message"
          value={input}
          onInput={(event) => setInput(event?.currentTarget?.value ?? "")}
        />
      </s-stack>

      <s-button slot="primary-action" onClick={sendMessage} disabled={!input.trim() || isLoading}>
        {isLoading ? "Sending..." : "Send"}
      </s-button>
      <s-button slot="secondary-actions" onClick={() => close()}>
        Close
      </s-button>
    </s-admin-action>
  );
}
