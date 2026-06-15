import { assistantTheme as theme } from "~/styles/assistant-theme";

interface AssistantHeaderProps {
  historyDialogOpen: boolean;
  chatsCount: number;
  newChatDisabled: boolean;
  onToggleHistory: () => void;
  onNewChat: () => void;
}

export function AssistantHeader({
  historyDialogOpen,
  chatsCount,
  newChatDisabled,
  onToggleHistory,
  onNewChat,
}: AssistantHeaderProps) {
  const historyDisabled = chatsCount === 0;

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
        disabled={historyDisabled}
        aria-label="Toggle chat history"
        aria-expanded={historyDialogOpen}
        title={historyDisabled ? "No chat history" : "Chat history"}
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
          cursor: historyDisabled ? "not-allowed" : "pointer",
          opacity: historyDisabled ? 0.5 : 1,
          transition: `background ${theme.transitions.fast}, opacity ${theme.transitions.fast}`,
          height: "32px",
        }}
        onMouseEnter={(e) => {
          if (historyDisabled) return;
          if (!historyDialogOpen) (e.currentTarget as HTMLButtonElement).style.background = theme.colors.suggestionHover;
        }}
        onMouseLeave={(e) => {
          if (historyDisabled) return;
          if (!historyDialogOpen) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11.9098 12.3258L15.6597 15.1757C15.9359 15.3856 16.3274 15.3289 16.5346 15.049C16.7418 14.7691 16.6859 14.3723 16.4096 14.1624L12.9379 11.4994V6.1164C12.9379 5.76651 12.6582 5.48311 12.3129 5.48311C11.9676 5.48311 11.688 5.76651 11.688 6.1164V11.816C11.688 12.0263 11.7748 12.2156 11.9098 12.3258Z"/>
          <path d="M12.6254 2C8.05095 2 4.14457 5.34569 3.38211 9.91616L3.14462 9.55835C2.95119 9.26798 2.56246 9.19136 2.27591 9.38736C1.98936 9.58336 1.91374 9.97727 2.10717 10.2676L3.35711 12.1675C3.45992 12.3258 3.62741 12.4294 3.81334 12.4493H3.87584C4.04145 12.4487 4.19988 12.3816 4.31644 12.2625L5.87887 10.6793C6.12292 10.432 6.12292 10.0305 5.87887 9.78317C5.63482 9.53587 5.23858 9.53587 4.99453 9.78317L4.60705 10.179C5.32671 5.69083 9.50058 2.64406 13.9294 3.3733C18.3583 4.10253 21.3657 8.33166 20.646 12.8198C20.007 16.8051 16.6099 19.7328 12.6254 19.7322C10.1124 19.7784 7.73566 18.5771 6.2601 16.5151C6.0598 16.2301 5.6695 16.1633 5.38827 16.3662C5.10703 16.5692 5.04109 16.9647 5.2414 17.2497C6.95007 19.6473 9.70744 21.0472 12.6254 20.9988C17.803 20.9988 22 16.7459 22 11.4994C22 6.25288 17.803 2 12.6254 2Z"/>
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
              padding: "0 2px",
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
        disabled={newChatDisabled}
        title={newChatDisabled ? "Current chat is already empty" : "Start a new chat"}
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
          cursor: newChatDisabled ? "not-allowed" : "pointer",
          opacity: newChatDisabled ? 0.5 : 1,
          transition: `background ${theme.transitions.fast}, opacity ${theme.transitions.fast}`,
          height: "32px",
        }}
        onMouseEnter={(e) => {
          if (newChatDisabled) return;
          (e.currentTarget as HTMLButtonElement).style.background = theme.colors.suggestionHover;
        }}
        onMouseLeave={(e) => {
          if (newChatDisabled) return;
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }}
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
