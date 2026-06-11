import { assistantTheme as theme } from "~/styles/assistant-theme";

interface AssistantHeaderProps {
  historyDialogOpen: boolean;
  chatsCount: number;
  onToggleHistory: () => void;
  onNewChat: () => void;
}

export function AssistantHeader({
  historyDialogOpen,
  chatsCount,
  onToggleHistory,
  onNewChat,
}: AssistantHeaderProps) {
  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: theme.spacing.sm,
        padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
        borderBottom: `1px solid ${theme.colors.borderSubtle}`,
        background: theme.colors.surface,
      }}
    >
      <button
        type="button"
        onClick={onToggleHistory}
        aria-label="Toggle chat history"
        title="Chat history"
        style={{
          display: "flex",
          alignItems: "center",
          gap: theme.spacing.xs,
          padding: `6px ${theme.spacing.sm}`,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.button,
          background: historyDialogOpen ? theme.colors.suggestionHover : "transparent",
          color: theme.colors.textSecondary,
          fontSize: theme.typography.small,
          cursor: "pointer",
          transition: `background ${theme.transitions.fast}`,
        }}
        onMouseEnter={(e) => {
          if (!historyDialogOpen) (e.currentTarget as HTMLButtonElement).style.background = theme.colors.suggestionHover;
        }}
        onMouseLeave={(e) => {
          if (!historyDialogOpen) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="15" y2="18"/>
        </svg>
        History
        {chatsCount > 0 && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "18px",
              height: "18px",
              padding: "0 4px",
              borderRadius: "9px",
              background: theme.colors.brand,
              color: theme.colors.white,
              fontSize: "11px",
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            {chatsCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={onNewChat}
        title="Start a new chat"
        style={{
          display: "flex",
          alignItems: "center",
          gap: theme.spacing.xs,
          padding: `6px ${theme.spacing.sm}`,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.button,
          background: "transparent",
          color: theme.colors.textSecondary,
          fontSize: theme.typography.small,
          cursor: "pointer",
          transition: `background ${theme.transitions.fast}`,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.colors.suggestionHover; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        New chat
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: theme.spacing.sm,
          marginLeft: "auto",
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
          }}
        />
        <span
          style={{
            fontSize: theme.typography.small,
            fontWeight: 500,
            color: theme.colors.textPrimary,
          }}
        >
          AI Assistant
        </span>
      </div>
    </div>
  );
}
