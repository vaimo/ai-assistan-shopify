import { assistantTheme as theme } from "~/styles/assistant-theme";

interface ChatHistoryItem {
  id: string;
  title?: string | null;
}

interface ChatHistoryDialogProps {
  open: boolean;
  chats: ChatHistoryItem[];
  activeChatId: string | null;
  confirmClearAll: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSwitchChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onClearAll: () => void;
  onClearAllBlur: () => void;
}

export function ChatHistoryDialog({
  open,
  chats,
  activeChatId,
  confirmClearAll,
  onClose,
  onNewChat,
  onSwitchChat,
  onDeleteChat,
  onClearAll,
  onClearAllBlur,
}: ChatHistoryDialogProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.25)",
          zIndex: 100,
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Chat history"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(520px, calc(100vw - 32px))",
          maxHeight: "min(640px, calc(100vh - 96px))",
          background: theme.colors.surface,
          border: `1px solid ${theme.colors.borderSubtle}`,
          borderRadius: theme.radius.input,
          display: "flex",
          flexDirection: "column",
          zIndex: 101,
          boxShadow: theme.resourceLink.popupShadow,
          overflow: "hidden",
        }}
      >
        {/* Dialog header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: theme.spacing.md,
            padding: `${theme.spacing.md} ${theme.spacing.lg}`,
            borderBottom: `1px solid ${theme.colors.borderSubtle}`,
            flexShrink: 0,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: theme.typography.base, color: theme.colors.textPrimary }}>
            Chat History
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm }}>
            <button
              type="button"
              onClick={onNewChat}
              title="Start a new chat"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: `6px ${theme.spacing.sm}`,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.button,
                background: "transparent",
                color: theme.colors.brand,
                fontSize: theme.typography.small,
                fontWeight: 500,
                cursor: "pointer",
                transition: `background ${theme.transitions.fast}`,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.colors.suggestionHover; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New chat
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close"
              aria-label="Close chat history"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "30px",
                height: "30px",
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.button,
                background: "transparent",
                color: theme.colors.textSecondary,
                cursor: "pointer",
                transition: `background ${theme.transitions.fast}, color ${theme.transitions.fast}`,
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = theme.colors.suggestionHover;
                (e.currentTarget as HTMLButtonElement).style.color = theme.colors.textPrimary;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = theme.colors.textSecondary;
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Chat list */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: theme.spacing.sm }}>
          {chats.length === 0 ? (
            <div style={{ padding: theme.spacing.xl, color: theme.colors.textMuted, fontSize: theme.typography.small, textAlign: "center" }}>
              No previous chats
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: theme.spacing.xs,
                  padding: `10px ${theme.spacing.md}`,
                  marginBottom: theme.spacing.xs,
                  borderRadius: theme.radius.button,
                  cursor: "pointer",
                  background: activeChatId === chat.id ? theme.colors.suggestionHover : "transparent",
                  border: `1px solid ${activeChatId === chat.id ? theme.colors.borderSubtle : "transparent"}`,
                  borderLeft: activeChatId === chat.id ? `3px solid ${theme.colors.brand}` : "3px solid transparent",
                  transition: `background ${theme.transitions.fast}, border-color ${theme.transitions.fast}`,
                }}
                onMouseEnter={(e) => {
                  if (activeChatId !== chat.id)
                    (e.currentTarget as HTMLDivElement).style.background = theme.colors.pageBackground;
                }}
                onMouseLeave={(e) => {
                  if (activeChatId !== chat.id)
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                }}
              >
                <button
                  type="button"
                  onClick={() => onSwitchChat(chat.id)}
                  style={{
                    flex: 1,
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: theme.typography.small,
                      color: activeChatId === chat.id ? theme.colors.textPrimary : theme.colors.textSecondary,
                      fontWeight: activeChatId === chat.id ? 500 : 400,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {chat.title || "New conversation"}
                  </div>
                </button>
                {/* Per-chat delete button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                  title="Delete this chat"
                  aria-label="Delete chat"
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px",
                    borderRadius: theme.radius.button,
                    border: "none",
                    background: "transparent",
                    color: theme.colors.textMuted,
                    cursor: "pointer",
                    opacity: 0.6,
                    transition: `opacity ${theme.transitions.fast}`,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.6"; }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Dialog footer - Clear all */}
        {chats.length > 0 && (
          <div
            style={{
              flexShrink: 0,
              borderTop: `1px solid ${theme.colors.borderSubtle}`,
              padding: theme.spacing.sm,
            }}
          >
            <button
              type="button"
              onClick={onClearAll}
              onBlur={onClearAllBlur}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: theme.spacing.xs,
                padding: `7px ${theme.spacing.sm}`,
                border: `1px solid ${confirmClearAll ? theme.colors.errorBorder : theme.colors.border}`,
                borderRadius: theme.radius.button,
                background: confirmClearAll ? theme.colors.errorBg : "transparent",
                color: confirmClearAll ? theme.colors.errorText : theme.colors.textMuted,
                fontSize: theme.typography.small,
                cursor: "pointer",
                transition: `background ${theme.transitions.fast}, color ${theme.transitions.fast}, border-color ${theme.transitions.fast}`,
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
              </svg>
              {confirmClearAll ? "Confirm? Clear all" : "Clear all history"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
