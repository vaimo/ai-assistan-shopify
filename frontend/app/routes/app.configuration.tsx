import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useEffect, useState } from "react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Select as PolarisSelect,
  Spinner,
  SkeletonBodyText,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { assistantTheme as theme } from "~/styles/assistant-theme";

// ── Types (mirror of backend config-meta.types.ts) ──────────────────────────
type FieldType = "select" | "text" | "toggle" | "number" | "secret";

interface SelectOption {
  label: string;
  value: string | number | boolean | null;
}

interface ConfigFieldMeta {
  groupLabel: string;
  keyLabel: string;
  helpText?: string;
  fieldType: FieldType;
  options?: SelectOption[];
  min?: number;
  max?: number;
  validationMessage?: string;
  /** Exactly [onOption, offOption] for toggle fields. */
  toggleOptions?: [SelectOption, SelectOption];
}

interface ConfigNamespaceMeta {
  moduleLabel: string;
  fields: Record<string, ConfigFieldMeta>;
}

type Schema = Record<string, ConfigNamespaceMeta>;
type ConfigValues = Record<string, Record<string, unknown>>;
type FaqStatus = {
  questions: string[] | null;
  lastGeneratedAt: string | null;
  enabled?: boolean;
};

// ── Server ───────────────────────────────────────────────────────────────────
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return json({ shopId: session.shop });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);
  const { sessionToken, shopId, intent, changes } = await request.json();

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${sessionToken}`,
  };

  if (intent === "load") {
    const [schemaRes, valuesRes] = await Promise.all([
      fetch(`${process.env.BACKEND_URL}/config/schema`, { headers: authHeaders }),
      fetch(`${process.env.BACKEND_URL}/config/${shopId}`, { headers: authHeaders }),
    ]);
    return json({
      schema: (await schemaRes.json()) as Schema,
      values: (await valuesRes.json()) as ConfigValues,
    });
  }

  if (intent === "loadFaqStatus") {
    const res = await fetch(
      `${process.env.BACKEND_URL}/faq/${shopId}`,
      { headers: { Authorization: `Bearer ${sessionToken}` } },
    );
    const data = res.ok
      ? (await res.json() as { questions: string[] | null; lastGeneratedAt: string | null })
      : { questions: null, lastGeneratedAt: null };
    return json(data);
  }

  if (intent === "forceRunFaq") {
    const res = await fetch(
      `${process.env.BACKEND_URL}/faq/${shopId}/generate`,
      { method: "POST", headers: authHeaders },
    );
    const data = res.ok
      ? (await res.json() as { questions: string[] | null; lastGeneratedAt: string | null })
      : { questions: null, lastGeneratedAt: null };
    return json({ ...data, forceRunOk: res.ok });
  }

  // Bulk save: one backend call per changed field, run in parallel
  const results = await Promise.all(
    (changes as Array<{ path: string; value: unknown }>).map((change) =>
      fetch(`${process.env.BACKEND_URL}/config/${shopId}`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(change),
      })
    )
  );
  const allOk = results.every((r) => r.ok);
  return json({ saved: allOk }, { status: allOk ? 200 : 500 });
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getNestedValue(obj: Record<string, unknown>, dotPath: string): unknown {
  return dotPath.split(".").reduce<unknown>((acc, key) => {
    if (acc != null && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function setNestedValue(
  obj: Record<string, unknown>,
  dotPath: string,
  value: unknown
): Record<string, unknown> {
  const parts = dotPath.split(".");
  const result = { ...obj };
  let cursor = result as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    cursor[parts[i]] = { ...(cursor[parts[i]] as Record<string, unknown> ?? {}) };
    cursor = cursor[parts[i]] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;
  return result;
}

/** Groups field entries by their groupLabel, preserving insertion order. */
function groupFields(fields: Record<string, ConfigFieldMeta>) {
  const map = new Map<string, Array<[string, ConfigFieldMeta]>>();
  for (const entry of Object.entries(fields)) {
    const label = entry[1].groupLabel;
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(entry);
  }
  return Array.from(map.entries()).map(([groupLabel, entries]) => ({
    groupLabel,
    entries,
  }));
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        boxSizing: "border-box",
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 12,
        background: checked ? theme.colors.brand : theme.colors.disabled,
        border: `1px solid ${checked ? theme.colors.brand : theme.colors.border}`,
        position: "relative",
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
        transition: `background ${theme.transitions.fast}, border-color ${theme.transitions.fast}`,
      }}
    >
      <span
        style={{
          display: "block",
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: "50%",
          left: checked ? 23 : 3,
          transform: "translateY(-50%)",
          transition: "left 0.2s",
          boxShadow: theme.shadows.bubble,
        }}
      />
    </button>
  );
}

// ── Shared plain input style (matches Polaris aesthetics without Polaris overhead) ─
function plainInputStyle(isInvalid = false): React.CSSProperties {
  return {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "6px 12px",
    border: `1px solid ${isInvalid ? "#d82c0d" : "#8c9196"}`,
    borderRadius: "6px",
    fontSize: "14px",
    lineHeight: "20px",
    color: "#202223",
    background: "#fff",
    outline: "none",
    fontFamily: "inherit",
  };
}

function getNumberBounds(fieldMeta: ConfigFieldMeta) {
  return {
    min: fieldMeta.min ?? 1,
    max: fieldMeta.max ?? 168,
    message: fieldMeta.validationMessage ?? "Must be between 1 and 168 hours (1 week)",
  };
}

function HelpTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
      <button
        type="button"
        aria-label={text}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          border: `1px solid ${theme.colors.border}`,
          background: theme.colors.surface,
          color: theme.colors.textSecondary,
          cursor: "help",
          fontFamily: "inherit",
          fontSize: theme.typography.small,
          fontWeight: 700,
          lineHeight: "22px",
          padding: 0,
          textAlign: "center",
        }}
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            zIndex: 20,
            width: 240,
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            borderRadius: theme.radius.button,
            border: `1px solid ${theme.colors.borderSubtle}`,
            background: theme.colors.surface,
            boxShadow: theme.shadows.bubble,
            color: theme.colors.textSecondary,
            fontSize: theme.typography.small,
            lineHeight: 1.4,
            pointerEvents: "none",
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

function PlainInput({
  id,
  type = "text",
  inputMode,
  value,
  autoComplete,
  isInvalid,
  onChange,
}: {
  id: string;
  type?: "text" | "password";
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  value: string;
  autoComplete?: string;
  isInvalid?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <input
      id={id}
      type={type}
      inputMode={inputMode}
      value={value}
      autoComplete={autoComplete ?? "off"}
      onChange={(e) => onChange(e.target.value)}
      style={plainInputStyle(isInvalid)}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = isInvalid ? "#d82c0d" : "#005bd3";
        e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,91,211,0.2)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = isInvalid ? "#d82c0d" : "#8c9196";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

// ── Accordion body — overflow:visible when open so error messages are never clipped ─
function AccordionBody({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        maxHeight: open ? "2000px" : "0",
        overflow: open ? "visible" : "hidden",
        transition: open ? "max-height 0.25s ease" : "max-height 0.15s ease",
      }}
    >
      {children}
    </div>
  );
}

// ── Field renderer ────────────────────────────────────────────────────────────
function ConfigField({
  namespace,
  fieldPath,
  fieldMeta,
  value,
  onChange,
}: {
  namespace: string;
  fieldPath: string;
  fieldMeta: ConfigFieldMeta;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const id = `field-${namespace}-${fieldPath.replace(/\./g, "-")}`;

  // Number validation (computed here so error can occupy its own grid row)
  const numVal = fieldMeta.fieldType === "number" ? String(value ?? "") : "";
  const numParsed = Number(numVal);
  const numBounds = getNumberBounds(fieldMeta);
  const numError =
    fieldMeta.fieldType === "number" && numVal !== "" && (isNaN(numParsed) || numParsed < numBounds.min || numParsed > numBounds.max)
      ? numBounds.message
      : null;

  const renderControl = () => {
    switch (fieldMeta.fieldType) {
      case "select":
        return (
          <PolarisSelect
            label=""
            labelHidden
            id={id}
            options={(fieldMeta.options ?? []).map((o) => ({
              label: o.label,
              value: String(o.value),
            }))}
            value={String(value ?? "")}
            onChange={(v) => {
              const opt = fieldMeta.options?.find((o) => String(o.value) === v);
              onChange(opt !== undefined ? opt.value : v);
            }}
          />
        );

      case "toggle": {
        const isOn = Boolean(value);
        const stateLabel = fieldMeta.toggleOptions
          ? (isOn ? fieldMeta.toggleOptions[0].label : fieldMeta.toggleOptions[1].label)
          : (isOn ? "On" : "Off");
        return (
          <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.md }}>
            <ToggleSwitch
              checked={isOn}
              onChange={(newChecked) => {
                if (fieldMeta.toggleOptions) {
                  onChange(newChecked ? fieldMeta.toggleOptions[0].value : fieldMeta.toggleOptions[1].value);
                } else {
                  onChange(newChecked);
                }
              }}
            />
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 24,
                color: theme.colors.textSecondary,
                fontSize: theme.typography.body,
                lineHeight: "24px",
                fontFamily: "inherit",
              }}
            >
              {stateLabel}
            </span>
          </div>
        );
      }

      case "number":
        return (
          <PlainInput
            id={id}
            inputMode="numeric"
            value={numVal}
            isInvalid={!!numError}
            onChange={(v) => {
              const stripped = v.replace(/[^\d]/g, "");
              onChange(stripped === "" ? "" : Number(stripped));
            }}
          />
        );

      case "secret":
        return (
          <PlainInput
            id={id}
            type="password"
            value={String(value ?? "")}
            autoComplete="new-password"
            onChange={(v) => onChange(v)}
          />
        );

      default: // "text"
        return (
          <PlainInput
            id={id}
            value={String(value ?? "")}
            onChange={(v) => onChange(v)}
          />
        );
    }
  };

  // 2-row CSS grid: row 1 = [label | control], row 2 = [empty | error]
  // label uses align-self:center so it centers against row-1 height (the input) only.
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        columnGap: theme.spacing.lg,
        padding: `${theme.spacing.md} 0`,
      }}
    >
      <label
        htmlFor={id}
        style={{ gridColumn: 1, gridRow: 1, alignSelf: "center", paddingRight: theme.spacing.sm }}
      >
        <Text variant="bodyMd" as="span" fontWeight="medium">
          {fieldMeta.keyLabel}
        </Text>
      </label>
      <div
        style={{
          gridColumn: 2,
          gridRow: 1,
          display: "flex",
          alignItems: "center",
          gap: theme.spacing.sm,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>{renderControl()}</div>
        {fieldMeta.helpText && <HelpTooltip text={fieldMeta.helpText} />}
      </div>
      {numError && (
        <p
          style={{
            gridColumn: 2,
            gridRow: 2,
            margin: "4px 0 0",
            fontSize: "12px",
            color: "#d82c0d",
            lineHeight: "16px",
          }}
        >
          {numError}
        </p>
      )}
    </div>
  );
}

// ── Collapsible group (Magento-style) ─────────────────────────────────────────
function ConfigGroup({
  groupLabel,
  namespace,
  entries,
  nsValues,
  onFieldChange,
}: {
  groupLabel: string;
  namespace: string;
  entries: Array<[string, ConfigFieldMeta]>;
  nsValues: Record<string, unknown>;
  onFieldChange: (fieldPath: string, value: unknown) => void;
}) {
  const [open, setOpen] = useState(false);
  const id = `grp-${namespace}-${groupLabel.replace(/\W+/g, "-").toLowerCase()}`;

  return (
    <div>
      {/* Group header */}
      <button
        type="button"
        aria-controls={id}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: `${theme.spacing.md} ${theme.spacing.lg}`,
          background: theme.colors.pageBackground,
          border: `1px solid ${theme.colors.borderSubtle}`,
          borderRadius: open ? "6px 6px 0 0" : "6px",
          cursor: "pointer",
          textAlign: "left",
          transition: "border-radius 0.15s",
        }}
      >
        <Text variant="headingSm" as="span">
          {groupLabel}
        </Text>
        <span
          aria-hidden
          style={{
            display: "inline-block",
            color: theme.colors.textSecondary,
            fontSize: "0.65rem",
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.2s",
            lineHeight: 1,
          }}
        >
          ▼
        </span>
      </button>

      {/* Collapsible body */}
      <AccordionBody open={open}>
        <div
          style={{
            border: `1px solid ${theme.colors.borderSubtle}`,
            borderTop: "none",
            borderRadius: "0 0 6px 6px",
            padding: `0 ${theme.spacing.lg}`,
            background: theme.colors.surface,
          }}
        >
          {entries.map(([fieldPath, fieldMeta], i) => (
            <div
              key={fieldPath}
              style={
                i < entries.length - 1
                  ? { borderBottom: `1px solid ${theme.colors.borderSubtle}` }
                  : undefined
              }
            >
              <ConfigField
                namespace={namespace}
                fieldPath={fieldPath}
                fieldMeta={fieldMeta}
                value={getNestedValue(nsValues, fieldPath)}
                onChange={(v) => onFieldChange(fieldPath, v)}
              />
            </div>
          ))}
        </div>
      </AccordionBody>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Configuration() {
  const { shopId } = useLoaderData<typeof loader>();
  const shopify = useAppBridge();

  const loadFetcher = useFetcher<{ schema: Schema; values: ConfigValues }>();
  const saveFetcher = useFetcher<{ saved: boolean }>();
  const faqFetcher = useFetcher<FaqStatus & { forceRunOk?: boolean }>();

  const [localValues, setLocalValues] = useState<ConfigValues>({});
  const [savedBanner, setSavedBanner] = useState(false);
  const [faqStatus, setFaqStatus] = useState<FaqStatus>({ lastGeneratedAt: null, questions: null });
  const [faqRunError, setFaqRunError] = useState(false);
  const schema: Schema = loadFetcher.data?.schema ?? {};

  useEffect(() => {
    (async () => {
      const sessionToken = await shopify.idToken();
      loadFetcher.submit(
        JSON.stringify({ intent: "load", sessionToken, shopId }),
        { method: "POST", encType: "application/json" }
      );
      faqFetcher.submit(
        JSON.stringify({ intent: "loadFaqStatus", sessionToken, shopId }),
        { method: "POST", encType: "application/json" }
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  useEffect(() => {
    if (loadFetcher.data?.values) {
      setLocalValues(loadFetcher.data.values);
    }
  }, [loadFetcher.data?.values]);

  // Update FAQ status display from both load and force-run responses.
  // On force-run failure (forceRunOk === false) keep the existing displayed state — don't overwrite with nulls.
  useEffect(() => {
    const data = faqFetcher.data;
    if (!data) return;
    if (data.forceRunOk === false) {
      setFaqRunError(true);
      return;
    }
    setFaqRunError(false);
    setFaqStatus({
      lastGeneratedAt: data.lastGeneratedAt ?? null,
      questions: data.questions ?? null,
      enabled: data.enabled,
    });
  }, [faqFetcher.data]);

  useEffect(() => {
    if (saveFetcher.data?.saved) {
      setSavedBanner(true);
      const t = setTimeout(() => setSavedBanner(false), 3000);
      return () => clearTimeout(t);
    }
  }, [saveFetcher.data]);

  const handleChange = (namespace: string, fieldPath: string, value: unknown) => {
    setLocalValues((prev) => ({
      ...prev,
      [namespace]: setNestedValue(
        (prev[namespace] as Record<string, unknown>) ?? {},
        fieldPath,
        value
      ),
    }));
  };

  const handleForceRunFaq = async () => {
    if (!isFaqSuggestionsEnabled) return;

    const sessionToken = await shopify.idToken();
    faqFetcher.submit(
      JSON.stringify({ intent: "forceRunFaq", sessionToken, shopId }),
      { method: "POST", encType: "application/json" }
    );
  };

  const handleSave = async () => {
    const sessionToken = await shopify.idToken();
    const changes: Array<{ path: string; value: unknown }> = [];

    for (const [namespace, nsMeta] of Object.entries(schema)) {
      for (const [fieldPath, fieldMeta] of Object.entries(nsMeta.fields)) {
        const value = getNestedValue(
          (localValues[namespace] as Record<string, unknown>) ?? {},
          fieldPath
        );
        // Skip secret fields that haven't been modified (still showing the mask)
        if (fieldMeta.fieldType === "secret" && value === "****") continue;
        changes.push({ path: `${namespace}.${fieldPath}`, value });
      }
    }

    saveFetcher.submit(
      JSON.stringify({ sessionToken, shopId, changes }),
      { method: "POST", encType: "application/json" }
    );
  };

  const isLoading = loadFetcher.state !== "idle";
  const isSaving = saveFetcher.state !== "idle";
  const isFaqRunning = faqFetcher.state !== "idle";
  const isFaqSuggestionsEnabled =
    Number(getNestedValue(
      (localValues.faq_suggestions as Record<string, unknown>) ?? {},
      "general.enable"
    ) ?? 1) === 1;
  const isFaqButtonDisabled = isFaqRunning || !isFaqSuggestionsEnabled;

  // Block Save if any number field has an out-of-range value
  const hasValidationErrors = Object.entries(schema).some(([namespace, nsMeta]) =>
    Object.entries(nsMeta.fields).some(([fieldPath, fieldMeta]) => {
      if (fieldMeta.fieldType !== "number") return false;
      const raw = String(getNestedValue((localValues[namespace] as Record<string, unknown>) ?? {}, fieldPath) ?? "");
      if (raw === "") return false;
      const n = Number(raw);
      const bounds = getNumberBounds(fieldMeta);
      return isNaN(n) || n < bounds.min || n > bounds.max;
    })
  );

  return (
    <div style={{ fontFamily: theme.typography.fontFamily, margin: `0 ${theme.spacing.lg}` }}>
      <Page>
        <Layout>
        <Layout.Section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: theme.spacing.md,
              flexWrap: "wrap",
            }}
          >
            <Text variant="headingLg" as="h1">
              Configuration
            </Text>
            <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm }}>
              {isSaving && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: theme.spacing.xs,
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    borderRadius: theme.radius.button,
                    border: `1px solid ${theme.colors.borderSubtle}`,
                    background: theme.colors.surface,
                  }}
                >
                  <Spinner size="small" />
                  <span
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.small,
                      lineHeight: "16px",
                    }}
                  >
                    Saving changes...
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isLoading || hasValidationErrors}
                style={{
                  background: isSaving || isLoading || hasValidationErrors ? theme.colors.disabled : theme.colors.brand,
                  color: isSaving || isLoading || hasValidationErrors ? theme.colors.textSecondary : theme.colors.white,
                  border: `1px solid ${isSaving || isLoading || hasValidationErrors ? theme.colors.border : theme.colors.brand}`,
                  borderRadius: theme.radius.button,
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  fontFamily: "inherit",
                  fontSize: theme.typography.body,
                  fontWeight: 700,
                  cursor: isSaving || isLoading || hasValidationErrors ? "not-allowed" : "pointer",
                  boxShadow: isSaving || isLoading || hasValidationErrors ? "none" : theme.shadows.bubble,
                  transition: `background ${theme.transitions.fast}, color ${theme.transitions.fast}, border-color ${theme.transitions.fast}`,
                }}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </Layout.Section>

        {savedBanner && (
          <Layout.Section>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: theme.spacing.sm,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                border: `1px solid ${theme.colors.borderSubtle}`,
                borderLeft: `4px solid ${theme.colors.brand}`,
                borderRadius: theme.radius.button,
                background: theme.colors.surface,
              }}
            >
              <span
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.body,
                  lineHeight: "20px",
                }}
              >
                Configuration saved successfully.
              </span>
              <button
                type="button"
                onClick={() => setSavedBanner(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: theme.colors.textSecondary,
                  cursor: "pointer",
                  fontSize: theme.typography.body,
                  lineHeight: "20px",
                  padding: 0,
                }}
                aria-label="Dismiss saved message"
              >
                Dismiss
              </button>
            </div>
          </Layout.Section>
        )}

        {isLoading && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: theme.spacing.sm,
                  }}
                >
                  <Spinner size="small" />
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Loading configuration...
                  </Text>
                </div>
                <SkeletonBodyText lines={6} />
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {!isLoading &&
          Object.entries(schema).map(([namespace, nsMeta]) => {
            const groups = groupFields(nsMeta.fields);
            const nsValues =
              (localValues[namespace] as Record<string, unknown>) ?? {};

            return (
              <Layout.Section key={namespace}>
                <Card>
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h3">
                      {nsMeta.moduleLabel}
                    </Text>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {groups.map(({ groupLabel, entries }) => (
                        <ConfigGroup
                          key={groupLabel}
                          groupLabel={groupLabel}
                          namespace={namespace}
                          entries={entries}
                          nsValues={nsValues}
                          onFieldChange={(fieldPath, value) =>
                            handleChange(namespace, fieldPath, value)
                          }
                        />
                      ))}
                    </div>
                  </BlockStack>
                </Card>
              </Layout.Section>
            );
          })}

        {/* ── FAQ Management card ── */}
        {!isLoading && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h3">
                  FAQ Suggestions — Management
                </Text>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: theme.spacing.sm,
                  }}
                >
                  <div
                    style={{
                      fontSize: theme.typography.body,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    {faqStatus.lastGeneratedAt
                      ? `Last generated: ${new Date(faqStatus.lastGeneratedAt).toLocaleString()}`
                      : "No FAQ suggestions have been generated yet."}
                  </div>
                  {faqStatus.questions && faqStatus.questions.length > 0 && (
                    <div
                      style={{
                        fontSize: theme.typography.small,
                        color: theme.colors.textMuted,
                        paddingLeft: theme.spacing.md,
                        borderLeft: `3px solid ${theme.colors.borderSubtle}`,
                      }}
                    >
                      {faqStatus.questions.map((q, i) => (
                        <div key={i} style={{ marginBottom: theme.spacing.xxs }}>
                          {i + 1}. {q}
                        </div>
                      ))}
                    </div>
                  )}
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        if (isFaqButtonDisabled) return;
                        setFaqRunError(false);
                        void handleForceRunFaq();
                      }}
                      disabled={isFaqButtonDisabled}
                      style={{
                        background: isFaqButtonDisabled ? theme.colors.disabled : theme.colors.surface,
                        color: isFaqButtonDisabled ? theme.colors.textMuted : theme.colors.brand,
                        border: `1px solid ${isFaqButtonDisabled ? theme.colors.borderSubtle : theme.colors.brand}`,
                        borderRadius: theme.radius.button,
                        padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                        fontFamily: "inherit",
                        fontSize: theme.typography.body,
                        fontWeight: 600,
                        cursor: isFaqButtonDisabled ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: theme.spacing.xs,
                        transition: `opacity ${theme.transitions.fast}`,
                        marginBottom: theme.spacing.xl,
                      }}
                    >
                      {isFaqRunning && <Spinner size="small" />}
                      {isFaqRunning ? "Generating…" : "Force Regenerate FAQ Now"}
                    </button>
                  </div>
                  {faqRunError && (
                    <div
                      style={{
                        fontSize: theme.typography.small,
                        color: theme.colors.errorText,
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        background: theme.colors.errorBg,
                        border: `1px solid ${theme.colors.errorBorder}`,
                        borderRadius: theme.radius.button,
                      }}
                    >
                      FAQ generation failed. Check that Lokte is configured and reachable.
                    </div>
                  )}
                </div>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
        </Layout>
      </Page>
    </div>
  );
}
