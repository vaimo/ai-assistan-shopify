import type { KeyboardEvent, RefObject } from "react";
import { assistantTheme as theme } from "~/styles/assistant-theme";

interface ChatInputBoxProps {
  textareaRef: RefObject<HTMLTextAreaElement>;
  value: string;
  placeholder: string;
  disabled: boolean;
  isLoading: boolean;
  focused: boolean;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSend: () => void;
}

export function ChatInputBox({
  textareaRef,
  value,
  placeholder,
  disabled,
  isLoading,
  focused,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  onSend,
}: ChatInputBoxProps) {
  return (
    <div
      style={{
        background: theme.colors.surface,
        border: focused
          ? `1px solid ${theme.colors.brand}`
          : `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.input,
        boxShadow: focused
          ? theme.shadows.inputFocus
          : theme.shadows.input,
        overflow: "hidden",
        transition: `border-color ${theme.transitions.fast}, box-shadow ${theme.transitions.fast}`,
        opacity: disabled && !isLoading ? 0.5 : 1,
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
        style={{
          display: "block",
          width: "100%",
          padding: theme.spacing.inputPadding,
          border: "none",
          outline: "none",
          resize: "none",
          fontSize: theme.typography.base,
          lineHeight: "1.5",
          color: theme.colors.textPrimary,
          background: "transparent",
          fontFamily: "inherit",
          overflowY: "auto",
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: theme.spacing.inputFooterPadding,
          gap: theme.spacing.sm,
        }}
      >
        <span
          style={{
            fontSize: theme.typography.small,
            color: theme.colors.textMuted,
            marginRight: "auto",
            userSelect: "none",
          }}
        >
          ↵ Enter to send&nbsp;&nbsp;·&nbsp;&nbsp;Shift+Enter for new line
        </span>
        <button
          type="button"
          onClick={onSend}
          disabled={!value.trim() || disabled}
          aria-label="Send message"
          style={{
            width: theme.sizes.sendButton,
            height: theme.sizes.sendButton,
            borderRadius: theme.radius.round,
            border: "none",
            background:
              !value.trim() || disabled
                ? theme.colors.disabled
                : theme.colors.brand,
            cursor:
              !value.trim() || disabled ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: `background ${theme.transitions.fast}`,
            flexShrink: 0,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={theme.sizes.sendIcon}
            height={theme.sizes.sendIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.white}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
