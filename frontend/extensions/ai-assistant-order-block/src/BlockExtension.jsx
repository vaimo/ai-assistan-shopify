import "@shopify/ui-extensions/preact";
import {render} from 'preact';
import {useState} from 'preact/hooks';

const APP_URL = "https://delay-banner-walnut.ngrok-free.dev";

export default async () => {
  render(<Extension />, document.body);
}

function Extension() {
  const {auth, extension: {target}} = shopify;
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastReply, setLastReply] = useState('');

  async function askAssistant() {
    const text = input.trim();
    if (!text || isLoading) return;

    setIsLoading(true);
    setLastReply('');

    try {
      const token = await auth.idToken();
      const response = await fetch(`${APP_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? {Authorization: `Bearer ${token}`} : {}),
        },
        body: JSON.stringify({message: text}),
      });

      const payload = await response.json();
      setLastReply(payload?.reply || 'No response from assistant.');
    } catch {
      setLastReply('Network error. Try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <s-admin-block heading="AI Assistant">
      <s-stack direction="block" gap="base">
        <s-text type="strong">Assistant entry ({target})</s-text>
        <s-text>Use this visible button to quickly ask AI about this page context.</s-text>

        <s-text-field
          label="Ask AI"
          value={input}
          onInput={(event) => setInput(event?.currentTarget?.value ?? '')}
        />

        <s-button onClick={askAssistant} disabled={!input.trim() || isLoading}>
          {isLoading ? 'Thinking...' : 'Ask Assistant'}
        </s-button>

        {lastReply ? (
          <s-stack direction="block" gap="small">
            <s-text type="strong">AI Reply</s-text>
            <s-text>{lastReply}</s-text>
          </s-stack>
        ) : null}
      </s-stack>
    </s-admin-block>
  );
}