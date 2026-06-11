import type { ReactNode } from "react";
import { assistantTheme as theme } from "~/styles/assistant-theme";

interface EmptyChatStateProps {
  inputBox: ReactNode;
  suggestedQuestions: string[];
  configured: boolean;
  onSelectQuestion: (question: string) => void;
}

export function EmptyChatState({
  inputBox,
  suggestedQuestions,
  configured,
  onSelectQuestion,
}: EmptyChatStateProps) {
  return (
    <div
      style={{
        flex: 1,
        display: "grid",
        gridTemplateRows: "0.85fr auto 1.15fr",
        width: "100%",
        maxWidth: theme.sizes.maxContentWidth,
        margin: "0 auto",
        padding: `0 ${theme.spacing.lg}`,
        height: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          paddingBottom: theme.spacing.xxl,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: theme.spacing.lg,
          }}
        >
          <img
            src="/assets/logo.png"
            alt="AI Assistant logo"
            style={{
              width: theme.sizes.logo,
              height: theme.sizes.logo,
              borderRadius: theme.radius.input,
              objectFit: "contain",
              flexShrink: 0,
            }}
          />
          <h1
            style={{
              fontSize: theme.typography.heading,
              fontWeight: 500,
              margin: 0,
              color: theme.colors.textPrimary,
              lineHeight: 1.3,
              maxWidth: theme.sizes.greetingMaxWidth,
            }}
          >
            What would you like to{" "}
            <span style={{ color: theme.colors.brand }}>explore</span> today?
          </h1>
        </div>
      </div>

      <div>{inputBox}</div>

      <div style={{ marginTop: theme.spacing.xl }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing.xxs,
          }}
        >
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              type="button"
              disabled={!configured}
              onClick={() => onSelectQuestion(question)}
              style={{
                textAlign: "left",
                fontSize: theme.typography.body,
                margin: `0 ${theme.spacing.lg}`,
                padding: `10px ${theme.spacing.md}`,
                borderRadius: theme.radius.button,
                border: "none",
                background: "transparent",
                color: theme.colors.textSecondary,
                cursor: configured ? "pointer" : "not-allowed",
                opacity: configured ? 1 : 0.4,
                transition: `background ${theme.transitions.fast}`,
              }}
              onMouseEnter={(e) => {
                if (!configured) return;
                (e.currentTarget as HTMLButtonElement).style.background =
                  theme.colors.suggestionHover;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
              }}
            >
              <div
                style={{
                  fontWeight: 500,
                  color: theme.colors.textPrimary,
                  lineHeight: 1.4,
                }}
              >
                {question}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
