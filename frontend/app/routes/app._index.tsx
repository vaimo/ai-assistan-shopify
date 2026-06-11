import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { authenticate } from "~/shopify.server";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useAppBridge } from "@shopify/app-bridge-react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { AssistantHeader } from "~/components/AssistantHeader";
import { ChatHistoryDialog } from "~/components/ChatHistoryDialog";
import { ChatInputBox } from "~/components/ChatInputBox";
import { ChatLoadingSpinner } from "~/components/ChatLoadingSpinner";
import { EmptyChatState } from "~/components/EmptyChatState";
import { NotConfiguredNotice } from "~/components/NotConfiguredNotice";
import { assistantTheme as theme } from "~/styles/assistant-theme";

// ── DEV / TEST FLAGS ────────────────────────────────────────────────────────
// Flags are driven by the Dev / Testing section in the Configuration UI
// (backend DevToolsModule, non-production only). No hardcoded constants here.
// ────────────────────────────────────────────────────────────────────────────

import { clearAllChatHistory, type ChatMessageRecord, type ChatSummary } from "~/backend.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return json({ shopId: session.shop });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { intent, sessionToken, shopId, chatId } = await request.json() as {
    intent: string;
    sessionToken: string;
    shopId: string;
    chatId?: string;
  };

  // Prevent a tampered request body from targeting a different shop
  if (shopId && shopId !== session.shop) {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  if (intent === "loadChats") {
    const backendUrl = process.env.BACKEND_URL;
    const res = await fetch(
      `${backendUrl}/lokte/${session.shop}/chats`,
      { headers: { Authorization: `Bearer ${sessionToken}` } },
    );
    const chats = res.ok ? await res.json() : [];
    return json({ chats });
  }

  if (intent === "loadHistory") {
    if (!chatId) return json({ messages: [] });
    const backendUrl = process.env.BACKEND_URL;
    const res = await fetch(
      `${backendUrl}/lokte/${session.shop}/chats/${chatId}/history`,
      { headers: { Authorization: `Bearer ${sessionToken}` } },
    );
    const messages = res.ok ? await res.json() : [];
    return json({ messages });
  }

  if (intent === "clearHistory") {
    if (!chatId) return json({ deleted: false });
    const backendUrl = process.env.BACKEND_URL;
    const res = await fetch(
      `${backendUrl}/lokte/${session.shop}/chats/${chatId}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${sessionToken}` } },
    );
    return json({ deleted: res.ok });
  }

  if (intent === "clearAllHistory") {
    await clearAllChatHistory(session.shop, sessionToken);
    return json({ cleared: true });
  }

  if (intent === "loadLokte") {
    const authHeader = { Authorization: `Bearer ${sessionToken}` };
    const backendUrl = process.env.BACKEND_URL;

    const [lokteRes, aiAssistantRes, devRes] = await Promise.all([
      fetch(`${backendUrl}/config/${session.shop}/lokte`, { headers: authHeader }),
      fetch(`${backendUrl}/config/${session.shop}/ai_assistant`, { headers: authHeader }),
      fetch(`${backendUrl}/config/${session.shop}/dev_testing`, { headers: authHeader }),
    ]);

    const lokte = lokteRes.ok ? await lokteRes.json() : {};
    const aiAssistant = aiAssistantRes.ok
      ? (await aiAssistantRes.json() as { general?: { enable?: unknown } })
      : {};
    const devCfg = devRes.ok
      ? (await devRes.json() as { general?: { force_not_configured?: unknown } })
      : {};
    const aiAssistantEnabled = Number(aiAssistant?.general?.enable) === 1;
    const devForceNotConfigured = Number(devCfg?.general?.force_not_configured) === 1;

    return json({ lokte, aiAssistantEnabled, devForceNotConfigured });
  }

  if (intent === "loadFaq") {
    const backendUrl = process.env.BACKEND_URL;
    const res = await fetch(
      `${backendUrl}/faq/${session.shop}`,
      { headers: { Authorization: `Bearer ${sessionToken}` } },
    );
    if (!res.ok) return json({ faqQuestions: null, faqLastGeneratedAt: null });
    const data = await res.json() as { questions: string[] | null; lastGeneratedAt: string | null };
    return json({ faqQuestions: data.questions, faqLastGeneratedAt: data.lastGeneratedAt });
  }

  return json({});
};

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
  documents?: SourceDocument[];
}

interface SourceDocument {
  title: string;
  link: string;
  source_type: string;
  blurb: string;
  updated_at: string | null;
}

type ChatApiResponse = { reply: string; documents: SourceDocument[]; chatId: string | null } | { error: string };

interface LokteConfig {
  general?: {
    enable?: number | boolean;
    api_key?: string;
    user_id?: string;
  };
}

function isLokteConfigured(cfg: LokteConfig | null): boolean {
  if (!cfg) return false;
  const g = cfg.general;
  if (!g) return false;
  const enabled = Number(g.enable) === 1;
  // Backend masks set secret fields as "****"; empty string means not set
  const hasKey = typeof g.api_key === "string" && g.api_key.length > 0;
  const hasUser = typeof g.user_id === "string" && g.user_id.length > 0;
  return enabled && hasKey && hasUser;
}

/** Absolute fallback questions — used when backend hasn't generated FAQs yet. */
const DEFAULT_FAQ_QUESTIONS: string[] = [
  "What are my top-selling products this month?",
  "Show me recent orders that need attention.",
  "How can I improve my store's conversion rate?",
];


/** Animated "Thinking..." indicator — dots cycle 0→3 every 500ms. */
function ThinkingDots() {
  const [dotCount, setDotCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDotCount((n) => (n + 1) % 4), 500);
    return () => clearInterval(id);
  }, []);
  return (
    <span>
      Thinking
      <span style={{ display: "inline-block", width: "1.6ch", textAlign: "left" }}>
        {".".repeat(dotCount)}
      </span>
    </span>
  );
}

/** Derive a display label from a source_type string or URL hostname.
 *  Returns null if the URL cannot be mapped to a known resource. */
function deriveResourceLabel(sourceType: string, href: string): string | null {
  if (sourceType) {
    // e.g. "confluence" → "Confluence", "google_drive" → "Google Drive"
    return sourceType
      .split(/[_\-]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  try {
    const hostname = new URL(href).hostname.replace(/^www\./, "");
    if (/atlassian\.net/.test(hostname)) return "Confluence";
    if (/slack\.com/.test(hostname)) return "Slack";
    if (/notion\.so/.test(hostname)) return "Notion";
    if (/docs\.google/.test(hostname)) return "Google Docs";
    if (/drive\.google/.test(hostname)) return "Google Drive";
    if (/github\.com/.test(hostname)) return "GitHub";
    if (/sharepoint\.com/.test(hostname)) return "SharePoint";
    if (/confluence\./.test(hostname)) return "Confluence";
    if (/jira\./.test(hostname)) return "Jira";
    // Generic: use second-level domain as label
    const parts = hostname.split(".");
    return parts.length >= 2
      ? parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1)
      : hostname;
  } catch {
    return null;
  }
}

/** Format an ISO / numeric timestamp to "MM/DD/YYYY". */
function formatUpdatedAt(raw: string | null): string | null {
  if (!raw) return null;
  // Unix epoch in seconds (Danswer/Onyx sends floats like 1727740800.0)
  const asNum = parseFloat(raw);
  const date = Number.isFinite(asNum) && asNum > 1e9
    ? new Date(asNum * 1000)
    : new Date(raw);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
}

function MarkdownLink({
  href,
  children,
  documents,
}: {
  href?: string;
  children: React.ReactNode;
  documents: SourceDocument[];
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const badgeRef = useRef<HTMLAnchorElement>(null);

  const normalizedHref = href?.trim() ?? "";
  const hasSafeScheme = /^(https?:|mailto:|tel:)/i.test(normalizedHref);
  const isSafeRelative = /^(\/|#|\?)/.test(normalizedHref);
  const safeHref = hasSafeScheme || isSafeRelative ? normalizedHref : "";

  if (!safeHref) {
    return <span>{children}</span>;
  }

  // Try to find matched document metadata by URL — use progressive fuzzy matching
  const doc = documents.find((d) => {
    try {
      const docUrl = new URL(d.link);
      const linkUrl = new URL(safeHref);

      // 1. Exact match (normalized)
      if (docUrl.href === linkUrl.href) return true;

      // 2. Match ignoring query string and hash (origin + pathname only)
      const docBase = docUrl.origin + docUrl.pathname.replace(/\/+$/, "");
      const linkBase = linkUrl.origin + linkUrl.pathname.replace(/\/+$/, "");
      if (docBase === linkBase) return true;

      // 3. Match after decoding percent-encoding (handles %20 vs + in Confluence paths)
      if (decodeURIComponent(docBase) === decodeURIComponent(linkBase)) return true;

      return false;
    } catch {
      return d.link === safeHref;
    }
  });

  // Derive the resource label — from doc metadata first, then URL hostname
  const label = deriveResourceLabel(doc?.source_type ?? "", safeHref);

  // If we can't derive any label for this URL, render as plain amber link
  if (!label) {
    return (
      <a
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          color: isHovered ? theme.colors.linkHover : theme.colors.link,
          textDecoration: isHovered ? "underline" : "none",
          textUnderlineOffset: "2px",
          fontWeight: 500,
          overflowWrap: "anywhere",
          wordBreak: "break-word",
        }}
      >
        {children}
      </a>
    );
  }

  const updatedDate = formatUpdatedAt(doc?.updated_at ?? null);
  const excerpt = doc?.blurb
    ? doc.blurb.length > 120 ? doc.blurb.slice(0, 117) + "…" : doc.blurb
    : null;

  const rl = theme.resourceLink;

  // Position popup near badge on hover
  const handleMouseEnter = () => {
    if (badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      const popupWidth = 260;
      let left = rect.left;
      if (left + popupWidth > window.innerWidth - 8) {
        left = window.innerWidth - popupWidth - 8;
      }
      setPopupStyle({
        position: "fixed",
        top: rect.bottom + 6,
        left,
        zIndex: 9999,
      });
    }
    setIsHovered(true);
  };

  return (
    <span style={{ position: "relative", display: "inline" }}>
      <a
        ref={badgeRef}
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: "inline-block",
          verticalAlign: "middle",
          marginLeft: "4px",
          padding: `${rl.badgePaddingY} ${rl.badgePaddingX}`,
          borderRadius: rl.badgeBorderRadius,
          background: isHovered ? rl.badgeBgHover : rl.badgeBg,
          color: isHovered ? rl.badgeTextHover : rl.badgeText,
          fontSize: rl.badgeFontSize,
          fontWeight: rl.badgeFontWeight,
          letterSpacing: rl.badgeLetterSpacing,
          lineHeight: 1.4,
          textDecoration: "none",
          cursor: "pointer",
          transition: `background ${theme.transitions.fast}`,
          whiteSpace: "nowrap",
          marginBottom: "2px",
        }}
      >
        {label}
      </a>

      {isHovered && typeof document !== "undefined" && createPortal(
        <div
          style={{
            ...popupStyle,
            width: rl.popupWidth,
            maxWidth: rl.popupWidth,
            background: rl.popupBg,
            border: `1px solid ${rl.popupBorder}`,
            borderRadius: rl.popupBorderRadius,
            boxShadow: rl.popupShadow,
            padding: rl.popupPadding,
            pointerEvents: "none",
            fontFamily: theme.typography.fontFamily,
          }}
        >
          {doc?.title ? (
            <div
              style={{
                fontSize: rl.popupTitleSize,
                fontWeight: rl.popupTitleWeight,
                color: rl.popupTitleColor,
                marginBottom: excerpt || updatedDate ? "6px" : 0,
                lineHeight: 1.35,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                WebkitBoxOrient: "vertical" as any,
                overflow: "hidden",
                wordBreak: "break-word",
              }}
            >
              {doc.title}
            </div>
          ) : (
            /* Fallback: show truncated URL so the popup is never empty */
            <div
              style={{
                fontSize: rl.popupExcerptSize,
                color: rl.popupExcerptColor,
                lineHeight: 1.45,
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {safeHref}
            </div>
          )}
          {excerpt && (
            <div
              style={{
                fontSize: rl.popupExcerptSize,
                color: rl.popupExcerptColor,
                lineHeight: 1.45,
                marginBottom: updatedDate ? "6px" : 0,
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {excerpt}
            </div>
          )}
          {updatedDate && (
            <div style={{ fontSize: rl.popupMetaSize, color: rl.popupMetaColor }}>
              Updated {updatedDate}
            </div>
          )}
        </div>,
        document.body,
      )}
    </span>
  );
}

function AssistantMarkdown({ content, documents }: { content: string; documents: SourceDocument[] }) {
  return (
    <div
      style={{
        overflowWrap: "anywhere",
        wordBreak: "break-word",
      }}
    >
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ href, children }: any) => (
            <MarkdownLink href={href} documents={documents}>{children}</MarkdownLink>
          ),
          p: ({ children }: any) => (
            <p style={{ margin: 0, marginBottom: theme.spacing.sm }}>{children}</p>
          ),
          strong: ({ children }: any) => (
            <strong style={{ fontWeight: 700 }}>{children}</strong>
          ),
          em: ({ children }: any) => <em style={{ fontStyle: "italic" }}>{children}</em>,
          del: ({ children }: any) => (
            <del style={{ textDecoration: "line-through" }}>{children}</del>
          ),
          h1: ({ children }: any) => (
            <h1
              style={{
                margin: `0 0 ${theme.spacing.sm}`,
                fontSize: "22px",
                lineHeight: 1.25,
                fontWeight: 700,
              }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }: any) => (
            <h2
              style={{
                margin: `0 0 ${theme.spacing.sm}`,
                fontSize: "19px",
                lineHeight: 1.3,
                fontWeight: 700,
              }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }: any) => (
            <h3
              style={{
                margin: `0 0 ${theme.spacing.xs}`,
                fontSize: "17px",
                lineHeight: 1.35,
                fontWeight: 700,
              }}
            >
              {children}
            </h3>
          ),
          h4: ({ children }: any) => (
            <h4
              style={{
                margin: `0 0 ${theme.spacing.xs}`,
                fontSize: theme.typography.base,
                lineHeight: 1.4,
                fontWeight: 700,
              }}
            >
              {children}
            </h4>
          ),
          ul: ({ children }: any) => (
            <ul style={{ margin: `0 0 ${theme.spacing.sm}`, paddingLeft: theme.spacing.xl }}>
              {children}
            </ul>
          ),
          ol: ({ children }: any) => (
            <ol style={{ margin: `0 0 ${theme.spacing.sm}`, paddingLeft: theme.spacing.xl }}>
              {children}
            </ol>
          ),
          li: ({ children }: any) => (
            <li style={{ marginBottom: theme.spacing.xs }}>{children}</li>
          ),
          blockquote: ({ children }: any) => (
            <blockquote
              style={{
                margin: `0 0 ${theme.spacing.sm}`,
                paddingLeft: theme.spacing.md,
                borderLeft: `3px solid ${theme.colors.borderSubtle}`,
                color: theme.colors.textSecondary,
              }}
            >
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr
              style={{
                border: "none",
                borderTop: `1px solid ${theme.colors.borderSubtle}`,
                margin: `${theme.spacing.md} 0`,
              }}
            />
          ),
          code: ({ children, className }: any) => {
            const isBlock = Boolean(className);

            if (!isBlock) {
              return (
                <code
                  style={{
                    padding: `0 ${theme.spacing.xs}`,
                    borderRadius: theme.radius.button,
                    background: theme.colors.pageBackground,
                    fontSize: theme.typography.small,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  }}
                >
                  {children}
                </code>
              );
            }

            return (
              <code
                className={className}
                style={{
                  display: "block",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  fontSize: theme.typography.small,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }: any) => (
            <pre
              style={{
                margin: `0 0 ${theme.spacing.sm}`,
                padding: theme.spacing.md,
                borderRadius: theme.radius.button,
                background: theme.colors.pageBackground,
                overflowX: "auto",
              }}
            >
              {children}
            </pre>
          ),
          table: ({ children }: any) => (
            <div style={{ overflowX: "auto", marginBottom: theme.spacing.sm }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: theme.typography.small,
                }}
              >
                {children}
              </table>
            </div>
          ),
          th: ({ children }: any) => (
            <th
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                border: `1px solid ${theme.colors.borderSubtle}`,
                background: theme.colors.pageBackground,
                textAlign: "left",
                fontWeight: 700,
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }: any) => (
            <td
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                border: `1px solid ${theme.colors.borderSubtle}`,
                verticalAlign: "top",
              }}
            >
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function AssistantPage() {
  const { shopId } = useLoaderData<typeof loader>();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const fetcher = useFetcher<ChatApiResponse>();
  const clearFetcher = useFetcher<{ deleted?: boolean; cleared?: boolean }>();
  const historyFetcher = useFetcher<{ messages: ChatMessageRecord[] }>();
  const chatsFetcher = useFetcher<{ chats: ChatSummary[] }>();
  const configFetcher = useFetcher<{ lokte: LokteConfig; aiAssistantEnabled: boolean; devForceNotConfigured: boolean }>();
  const faqFetcher = useFetcher<{ faqQuestions: string[] | null; faqLastGeneratedAt: string | null }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaFocused, setTextareaFocused] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(DEFAULT_FAQ_QUESTIONS);
  // true when the user navigated away while the AI was processing and we're polling for the result
  const [isRestoredThinking, setIsRestoredThinking] = useState(false);
  // Ref mirror so effects can read the current value without re-running on every state change
  const isRestoredThinkingRef = useRef(false);
  const pendingQuestionRef = useRef<string | null>(null);
  // Track the last fetcher.data we already processed so the resolve effect doesn't re-fire
  // when historyReady transitions false→true (chat switch) with stale data from a previous chat.
  const lastProcessedFetcherData = useRef<unknown>(null);

  // ── Multi-chat state ────────────────────────────────────────────────────────
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const activeChatIdRef = useRef<string | null>(null);
  // Guard: chatsFetcher effect must only auto-activate + load history on the initial mount load.
  // Subsequent refreshes (e.g. after a new chat is created) should only update the dialog list.
  const initialChatLoadDone = useRef(false);
  // Detect real fetch completions: only process history when fetcher transitions non-idle → idle.
  const prevHistoryFetcherState = useRef<string>("idle");
  useEffect(() => { activeChatIdRef.current = activeChatId; }, [activeChatId]);

  const lokteConfig: LokteConfig | null = (configFetcher.data?.lokte as LokteConfig) ?? null;
  const aiAssistantEnabled = configFetcher.data?.aiAssistantEnabled !== false; // true until data arrives (avoid flicker)
  const devForceNotConfigured = Boolean(configFetcher.data?.devForceNotConfigured);
  // Both AI Assistant AND Lokte must be enabled+configured
  const configured = !devForceNotConfigured && aiAssistantEnabled && isLokteConfigured(lokteConfig);
  const configChecked = configFetcher.state === "idle" && configFetcher.data !== undefined;

  const isLoading = fetcher.state !== "idle" || isRestoredThinking;
  const hasMessages = messages.length > 0;

  // Populate suggested questions from backend response (or keep defaults)
  useEffect(() => {
    const questions = faqFetcher.data?.faqQuestions;
    if (Array.isArray(questions) && questions.length > 0) {
      setSuggestedQuestions(questions);
    }
  }, [faqFetcher.data]);

  // Load Lokte config + chats list + FAQ suggestions on mount
  useEffect(() => {
    (async () => {
      const sessionToken = await shopify.idToken();
      configFetcher.submit(
        { intent: "loadLokte", sessionToken, shopId },
        { method: "POST", encType: "application/json" },
      );
      chatsFetcher.submit(
        { intent: "loadChats", sessionToken, shopId },
        { method: "POST", encType: "application/json" },
      );
      faqFetcher.submit(
        { intent: "loadFaq", sessionToken, shopId },
        { method: "POST", encType: "application/json" },
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  // Sync ref so effects can read isRestoredThinking without stale closures
  useEffect(() => { isRestoredThinkingRef.current = isRestoredThinking; }, [isRestoredThinking]);

  // When chats list loads: update dialog list; auto-activate on initial mount only.
  useEffect(() => {
    if (chatsFetcher.data?.chats === undefined) return;
    const loadedChats = chatsFetcher.data.chats;
    setChats(loadedChats);

    // Subsequent refreshes (e.g. after a new chat is created) only update the list —
    // do NOT override activeChatId or reload history, that would wipe the current view.
    if (initialChatLoadDone.current) return;
    initialChatLoadDone.current = true;

    if (loadedChats.length === 0) {
      // No chats yet — show empty state immediately
      setHistoryReady(true);
      return;
    }

    // Check sessionStorage for a pending message that belongs to a specific chat
    let targetChatId: string = loadedChats[0].id;
    try {
      const raw = sessionStorage.getItem("ai-chat-pending");
      if (raw) {
        const pending = JSON.parse(raw) as { message: string; shopId: string; chatId?: string; ts: number };
        const ageOk = Date.now() - (pending.ts ?? 0) < 10 * 60 * 1000;
        if (pending.shopId === shopId && ageOk && pending.chatId) {
          const found = loadedChats.find((c) => c.id === pending.chatId);
          if (found) targetChatId = found.id;
        }
      }
    } catch { /* ignore */ }

    setActiveChatId(targetChatId);
    activeChatIdRef.current = targetChatId;

    // Load history for the target chat
    (async () => {
      const sessionToken = await shopify.idToken();
      historyFetcher.submit(
        { intent: "loadHistory", sessionToken, shopId, chatId: targetChatId },
        { method: "POST", encType: "application/json" },
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatsFetcher.data]);

  // Hydrate messages from history. Only fires when historyFetcher transitions non-idle → idle,
  // i.e. a real fetch just completed. This avoids processing stale cached data when deps change
  // for unrelated reasons (e.g. historyReady flip during a chat switch).
  useEffect(() => {
    // Track state transitions; only process on non-idle → idle (a fetch just completed)
    const wasLoading = prevHistoryFetcherState.current !== "idle";
    prevHistoryFetcherState.current = historyFetcher.state;
    if (!wasLoading || historyFetcher.state !== "idle") return;
    if (historyFetcher.data?.messages === undefined) return;

    const msgs: ChatMessage[] = historyFetcher.data.messages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      isError: m.isError,
      documents: m.documents ?? [],
    }));

    if (!historyReady) {
      // ── First load after mount OR after a chat switch ─────────────────────
      let pendingMsg: ChatMessage | null = null;
      try {
        const raw = sessionStorage.getItem("ai-chat-pending");
        if (raw) {
          const pending = JSON.parse(raw) as { message: string; shopId: string; chatId?: string; ts: number };
          const ageOk = Date.now() - (pending.ts ?? 0) < 10 * 60 * 1000;
          if (pending.shopId === shopId && ageOk) {
            const lastUserInMsgs = [...msgs].reverse().find((m) => m.role === "user");
            const alreadyInHistory = lastUserInMsgs?.content === pending.message;
            const successInHistory = alreadyInHistory && msgs[msgs.length - 1]?.role === "assistant";

            if (successInHistory) {
              sessionStorage.removeItem("ai-chat-pending");
            } else {
              pendingQuestionRef.current = pending.message;
              isRestoredThinkingRef.current = true;
              setIsRestoredThinking(true);
              if (!alreadyInHistory) {
                pendingMsg = { id: "pending-user", role: "user", content: pending.message };
              }
            }
          } else {
            sessionStorage.removeItem("ai-chat-pending");
          }
        }
      } catch { /* ignore sessionStorage errors */ }

      setMessages(pendingMsg ? [...msgs, pendingMsg] : msgs);
      setHistoryReady(true);

    } else if (isRestoredThinkingRef.current) {
      // ── Poll result — check whether the AI answer has landed in history ────
      const lastUserInMsgs = [...msgs].reverse().find((m) => m.role === "user");
      const answerInHistory =
        lastUserInMsgs?.content === pendingQuestionRef.current &&
        msgs[msgs.length - 1]?.role === "assistant";

      if (answerInHistory) {
        setMessages(msgs);
        isRestoredThinkingRef.current = false;
        setIsRestoredThinking(false);
        pendingQuestionRef.current = null;
        try { sessionStorage.removeItem("ai-chat-pending"); } catch { /* ignore */ }
      }
    } else {
      // historyReady already true (e.g. polling refresh with no pending message)
      setMessages(msgs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyFetcher.state, historyFetcher.data]);

  // Poll history while waiting for a restored-thinking answer
  useEffect(() => {
    if (!isRestoredThinking || !historyReady || historyFetcher.state !== "idle") return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      const sessionToken = await shopify.idToken();
      if (!cancelled) {
        historyFetcher.submit(
          { intent: "loadHistory", sessionToken, shopId, chatId: activeChatIdRef.current },
          { method: "POST", encType: "application/json" },
        );
      }
    }, 2500);
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRestoredThinking, historyReady, historyFetcher.state]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, theme.sizes.textareaMaxHeight)}px`;
  }, [inputValue]);

  // Reset confirmClearAll once the clear-all action finishes
  useEffect(() => {
    if (clearFetcher.state === "idle" && clearFetcher.data && "cleared" in clearFetcher.data) {
      setConfirmClearAll(false);
    }
  }, [clearFetcher.state, clearFetcher.data]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading || !configured) return;

      // If there was a stale "restored thinking" context from a prior navigation,
      // supersede it — the new question is now the active one.
      if (isRestoredThinkingRef.current) {
        isRestoredThinkingRef.current = false;
        setIsRestoredThinking(false);
        pendingQuestionRef.current = null;
      }

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: trimmed },
      ]);
      setInputValue("");

      // Persist BEFORE the async idToken call — if the user navigates during idToken(),
      // the JS context is destroyed and nothing after the await would execute.
      try {
        const payload = JSON.stringify({ message: trimmed, shopId, chatId: activeChatIdRef.current, ts: Date.now() });
        sessionStorage.setItem("ai-chat-pending", payload);
      } catch { /* ignore sessionStorage errors */ }

      const sessionToken = await shopify.idToken();

      // fetcher is intentionally omitted from deps — useFetcher() returns a stable reference in Remix v2
      fetcher.submit(
        JSON.stringify({ message: trimmed, sessionToken, ...(activeChatIdRef.current ? { chatId: activeChatIdRef.current } : {}) }),
        {
          method: "POST",
          action: "/api/chat",
          encType: "application/json",
        },
      );
    },
    [isLoading, configured, shopify], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleSend = useCallback(() => {
    void sendMessage(inputValue);
  }, [inputValue, sendMessage]);

  // Append assistant reply (or error) when fetcher resolves (normal flow — no navigation away).
  // Guard: skip when isRestoredThinking is active — in that flow the page was reloaded so the
  // fetcher always starts fresh (data = undefined) and the polling path owns state cleanup.
  // Guard: skip if we already processed this exact fetcher.data object — prevents re-firing
  // when historyReady transitions false→true after a chat switch (stale data from previous chat).
  useEffect(() => {
    if (
      fetcher.state === "idle" &&
      fetcher.data &&
      historyReady &&
      !isRestoredThinkingRef.current &&
      fetcher.data !== lastProcessedFetcherData.current
    ) {
      lastProcessedFetcherData.current = fetcher.data;
      const data = fetcher.data;
      if ("reply" in data) {
        // If the backend created a new chat session, update our chat list + activeChatId
        if (data.chatId && data.chatId !== activeChatIdRef.current) {
          const newChatId = data.chatId;
          setActiveChatId(newChatId);
          activeChatIdRef.current = newChatId;
          // Refresh chats list to pick up the new entry with its auto-generated title
          (async () => {
            const sessionToken = await shopify.idToken();
            chatsFetcher.submit(
              { intent: "loadChats", sessionToken, shopId },
              { method: "POST", encType: "application/json" },
            );
          })();
        }
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.reply,
            documents: data.documents ?? [],
          },
        ]);
      } else if ("error" in data) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: data.error, isError: true },
        ]);
      }
      // Fetcher resolved means the request completed without navigation interruption —
      // clear any stale restored-thinking state that may not have been polled away yet.
      isRestoredThinkingRef.current = false;
      setIsRestoredThinking(false);
      pendingQuestionRef.current = null;
      try { sessionStorage.removeItem("ai-chat-pending"); } catch { /* ignore */ }
    }
  }, [fetcher.state, fetcher.data, historyReady]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Delete a single chat — direct delete, no double-click confirmation needed */
  const handleDeleteChat = useCallback(async (chatId: string) => {
    // Optimistically remove from the history dialog
    setChats((prev) => prev.filter((c) => c.id !== chatId));

    // If this was the active chat, switch to the next available one
    if (activeChatIdRef.current === chatId) {
      setChats((prev) => {
        const remaining = prev.filter((c) => c.id !== chatId);
        const next = remaining[0] ?? null;
        setActiveChatId(next?.id ?? null);
        activeChatIdRef.current = next?.id ?? null;
        setHistoryReady(false);
        if (next) {
          (async () => {
            const sessionToken = await shopify.idToken();
            historyFetcher.submit(
              { intent: "loadHistory", sessionToken, shopId, chatId: next.id },
              { method: "POST", encType: "application/json" },
            );
          })();
        } else {
          setMessages([]);
          setHistoryReady(true);
        }
        return remaining;
      });
    }

    setIsRestoredThinking(false);
    isRestoredThinkingRef.current = false;
    pendingQuestionRef.current = null;
    try { sessionStorage.removeItem("ai-chat-pending"); } catch { /* ignore */ }

    const sessionToken = await shopify.idToken();
    clearFetcher.submit(
      JSON.stringify({ intent: "clearHistory", sessionToken, shopId, chatId }),
      { method: "POST", encType: "application/json" },
    );
  }, [shopify, shopId]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Clear ALL chat sessions */
  const handleClearAll = useCallback(async () => {
    if (!confirmClearAll) { setConfirmClearAll(true); return; }
    setConfirmClearAll(false);
    setChats([]);
    setMessages([]);
    setActiveChatId(null);
    activeChatIdRef.current = null;
    setIsRestoredThinking(false);
    isRestoredThinkingRef.current = false;
    pendingQuestionRef.current = null;
    try { sessionStorage.removeItem("ai-chat-pending"); } catch { /* ignore */ }
    const sessionToken = await shopify.idToken();
    clearFetcher.submit(
      JSON.stringify({ intent: "clearAllHistory", sessionToken, shopId }),
      { method: "POST", encType: "application/json" },
    );
  }, [confirmClearAll, shopify, shopId]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Start a fresh (empty) chat — first message will create the session */
  const handleNewChat = useCallback(() => {
    setHistoryDialogOpen(false);
    setActiveChatId(null);
    activeChatIdRef.current = null;
    setMessages([]);
    setIsRestoredThinking(false);
    isRestoredThinkingRef.current = false;
    pendingQuestionRef.current = null;
    lastProcessedFetcherData.current = null;
    try { sessionStorage.removeItem("ai-chat-pending"); } catch { /* ignore */ }
    setHistoryReady(true);
  }, []);

  /** Switch to an existing chat */
  const handleSwitchChat = useCallback(async (chatId: string) => {
    if (chatId === activeChatIdRef.current) { setHistoryDialogOpen(false); return; }
    setHistoryDialogOpen(false);
    setActiveChatId(chatId);
    activeChatIdRef.current = chatId;
    setMessages([]);
    setHistoryReady(false);
    setIsRestoredThinking(false);
    isRestoredThinkingRef.current = false;
    pendingQuestionRef.current = null;
    // Mark current fetcher data as processed so the resolve effect skips it on historyReady flip
    lastProcessedFetcherData.current = fetcher.data ?? null;
    const sessionToken = await shopify.idToken();
    historyFetcher.submit(
      { intent: "loadHistory", sessionToken, shopId, chatId },
      { method: "POST", encType: "application/json" },
    );
  }, [shopify, shopId, fetcher.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  function renderInputBox() {
    const inputDisabled = !configured || isLoading;
    return (
      <ChatInputBox
        textareaRef={textareaRef}
        value={inputValue}
        placeholder={
          configured
            ? "How can AI Assistant help you today?"
            : !aiAssistantEnabled
              ? "AI Assistant is disabled. Enable it in Configuration…"
              : "Configure Lokte integration to start chatting…"
        }
        disabled={inputDisabled}
        isLoading={isLoading}
        focused={textareaFocused}
        onChange={setInputValue}
        onKeyDown={handleKeyDown}
        onFocus={() => setTextareaFocused(true)}
        onBlur={() => setTextareaFocused(false)}
        onSend={handleSend}
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: theme.colors.pageBackground,
        fontFamily: theme.typography.fontFamily,
        color: theme.colors.textPrimary,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <ChatHistoryDialog
        open={historyDialogOpen}
        chats={chats}
        activeChatId={activeChatId}
        confirmClearAll={confirmClearAll}
        onClose={() => setHistoryDialogOpen(false)}
        onNewChat={handleNewChat}
        onSwitchChat={(chatId) => void handleSwitchChat(chatId)}
        onDeleteChat={(chatId) => void handleDeleteChat(chatId)}
        onClearAll={() => void handleClearAll()}
        onClearAllBlur={() => setConfirmClearAll(false)}
      />

      {configChecked && !configured && (
        <NotConfiguredNotice
          aiAssistantEnabled={aiAssistantEnabled}
          onOpenConfiguration={() => navigate("/app/configuration")}
        />
      )}

      <AssistantHeader
        historyDialogOpen={historyDialogOpen}
        chatsCount={chats.length}
        onToggleHistory={() => setHistoryDialogOpen((o) => !o)}
        onNewChat={handleNewChat}
      />

      {/* ── Scrollable messages (or centered empty state) ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {!historyReady ? (
          <ChatLoadingSpinner />
        ) : !hasMessages ? (
          <EmptyChatState
            inputBox={renderInputBox()}
            suggestedQuestions={suggestedQuestions}
            configured={configured}
            onSelectQuestion={(question) => void sendMessage(question)}
          />
        ) : (
          /* ── Active conversation ── */
          <div
            style={{
              flex: 1,
              maxWidth: theme.sizes.maxContentWidth,
              width: "100%",
              margin: "0 auto",
              padding: theme.spacing.conversationPadding,
              display: "flex",
              flexDirection: "column",
              gap: theme.spacing.lg,
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: msg.role === "user" ? "column" : "row",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                  gap: theme.spacing.sm,
                }}
              >
                {/* Logo avatar — left side of assistant messages */}
                {msg.role === "assistant" && (
                  <img
                    src="/assets/logo.png"
                    alt="AI Assistant"
                    style={{
                      width: theme.sizes.avatar,
                      height: theme.sizes.avatar,
                      borderRadius: theme.radius.button,
                      objectFit: "contain",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  />
                )}

                <div style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div
                    style={{
                      minWidth: 0,
                      maxWidth: theme.sizes.bubbleMaxWidth,
                      padding: `10px ${theme.spacing.lg}`,
                      borderRadius:
                        msg.role === "user"
                          ? theme.radius.bubbleUser
                          : theme.radius.bubbleAssistant,
                      background: msg.isError
                        ? theme.colors.errorBg
                        : msg.role === "user"
                        ? theme.colors.brand
                        : theme.colors.surface,
                      color: msg.isError
                        ? theme.colors.errorText
                        : msg.role === "user"
                        ? theme.colors.white
                        : theme.colors.textPrimary,
                      border: msg.isError
                        ? `1px solid ${theme.colors.errorBorder}`
                        : "none",
                      fontSize: theme.typography.body,
                      lineHeight: 1.5,
                      boxShadow: msg.isError ? "none" : theme.shadows.bubble,
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                      whiteSpace: msg.role === "user" ? "pre-wrap" : "normal",
                    }}
                  >
                    {msg.isError && (
                      <span style={{ marginRight: theme.spacing.xs }}>⚠️</span>
                    )}
                    {msg.role === "assistant" && !msg.isError ? (
                      <AssistantMarkdown content={msg.content} documents={msg.documents ?? []} />
                    ) : (
                      msg.content
                    )}
                  </div>
                  <span
                    style={{
                      marginTop: theme.spacing.xs,
                      fontSize: theme.typography.tiny,
                      color: msg.isError ? theme.colors.errorText : theme.colors.textMuted,
                    }}
                  >
                    {msg.role === "user" ? "You" : msg.isError ? "Error" : "AI Assistant"}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: theme.spacing.sm,
                }}
              >
                <img
                  src="/assets/logo.png"
                  alt="AI Assistant"
                  style={{
                    width: theme.sizes.avatar,
                    height: theme.sizes.avatar,
                    borderRadius: theme.radius.button,
                    objectFit: "contain",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: theme.spacing.sm,
                    padding: `10px ${theme.spacing.lg}`,
                    borderRadius: theme.radius.bubbleAssistant,
                    background: theme.colors.surface,
                    boxShadow: theme.shadows.bubble,
                    color: theme.colors.textMuted,
                    fontSize: theme.typography.body,
                  }}
                >
                  <ThinkingDots />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        ) /* end !hasMessages ternary */ }
      </div>

      {/* ── Sticky input bar — only shown once conversation starts ── */}
      {hasMessages && (
        <div
          style={{
            flexShrink: 0,
            padding: theme.spacing.stickyInputPadding,
            background: theme.colors.pageBackground,
            borderTop: `1px solid ${theme.colors.borderSubtle}`,
          }}
        >
          <div style={{ maxWidth: theme.sizes.maxContentWidth, margin: "0 auto" }}>
            {renderInputBox()}
          </div>
        </div>
      )}
    </div>
  );
}
