import { assistantTheme as theme } from "~/styles/assistant-theme";

export function ChatLoadingSpinner() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          border: `2px solid ${theme.colors.brand}`,
          borderTopColor: theme.colors.textSecondary,
          animation: "spin 0.8s linear infinite",
        }}
      />
    </div>
  );
}
