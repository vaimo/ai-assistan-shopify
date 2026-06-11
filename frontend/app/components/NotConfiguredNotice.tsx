import { assistantTheme as theme } from "~/styles/assistant-theme";

interface NotConfiguredNoticeProps {
  aiAssistantEnabled: boolean;
  onOpenConfiguration: () => void;
}

export function NotConfiguredNotice({
  aiAssistantEnabled,
  onOpenConfiguration,
}: NotConfiguredNoticeProps) {
  return (
    <div
      style={{
        flexShrink: 0,
        padding: `${theme.spacing.md} ${theme.spacing.lg}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: theme.spacing.md,
          padding: `${theme.spacing.md} ${theme.spacing.lg}`,
          background: theme.colors.surface,
          border: `1px solid ${theme.colors.brand}44`,
          borderLeft: `3px solid ${theme.colors.brand}`,
          borderRadius: theme.radius.button,
          boxShadow: theme.shadows.bubble,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.colors.brand}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>

        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: theme.typography.body,
              color: theme.colors.textPrimary,
              fontWeight: 500,
            }}
          >
            {!aiAssistantEnabled
              ? "AI Assistant is disabled."
              : "Lokte integration is not set up."}
          </span>
          <span
            style={{
              fontSize: theme.typography.body,
              color: theme.colors.textSecondary,
              marginLeft: theme.spacing.xs,
            }}
          >
            {!aiAssistantEnabled
              ? "Enable it in"
              : "Enable it and add your API key and User ID in"}
          </span>
          <button
            onClick={onOpenConfiguration}
            style={{
              marginLeft: theme.spacing.xs,
              fontSize: theme.typography.body,
              color: theme.colors.brand,
              fontWeight: 500,
              textDecoration: "none",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = "underline"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = "none"; }}
          >
            Configuration →
          </button>
        </div>
      </div>
    </div>
  );
}
