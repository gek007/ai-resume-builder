import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

// Small shared form pieces for the editor (plain styling; restyled later).

// No width here: text inputs add w-full; selects size to their content.
export const inputClass =
  "rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 text-xs font-semibold text-muted ${className}`}>
      {label}
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="text" {...props} className={`${inputClass} w-full ${props.className ?? ""}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={4} {...props} className={`${inputClass} w-full resize-y ${props.className ?? ""}`} />;
}

export function SmallButton({
  children,
  onClick,
  disabled,
  label,
  tone = "default",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-2 py-1 text-xs font-semibold hover:bg-background disabled:cursor-not-allowed disabled:opacity-30 ${
        tone === "danger" ? "text-red-700 dark:text-red-300" : "text-muted"
      }`}
    >
      {children}
    </button>
  );
}

export function AddButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="self-start rounded-full border border-dashed border-line px-3 py-1.5 text-xs font-semibold text-accent hover:bg-background disabled:opacity-40"
    >
      {children}
    </button>
  );
}
