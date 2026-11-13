import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { scorePassword } from "@/lib/password";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** Show the live strength meter (sign-up / reset flows). */
  showStrength?: boolean;
  placeholder?: string;
  autoComplete?: string;
};

const BARS = [
  "bg-destructive",
  "bg-destructive",
  "bg-amber-400",
  "bg-primary/70",
  "bg-primary",
];

export function PasswordField({
  label,
  value,
  onChange,
  showStrength = false,
  placeholder = "At least 8 characters",
  autoComplete = "current-password",
}: Props) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const strength = scorePassword(value);

  return (
    <div className="block">
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          required
          minLength={8}
          maxLength={72}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input pr-11"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-3 grid place-items-center text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {showStrength && value.length > 0 && (
        <div className="mt-2" aria-live="polite">
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i < strength.score ? BARS[strength.score] : "bg-border"
                }`}
              />
            ))}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {strength.label}
            {strength.hints.length > 0 && ` — add ${strength.hints.slice(0, 2).join(", ")}`}
          </p>
        </div>
      )}
    </div>
  );
}