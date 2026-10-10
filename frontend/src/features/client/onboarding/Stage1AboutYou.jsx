import { useState } from "react";
import { toast } from "sonner";
import WhyWeAsk from "./WhyWeAsk";
import SkipButton from "./SkipButton";
import { ONBOARDING } from "@/constants/testIds";

const FIELDS = [
  { key: "preferred_name", label: "What should we call you?", required: true },
  {
    key: "pronouns", label: "Pronouns", placeholder: "e.g. she/her, he/him, they/them",
    whyWeAsk: "So we always address you the way you want.",
  },
  {
    key: "gender_text", label: "Gender",
    whyWeAsk: "Only if you'd like to share it.",
  },
  {
    key: "age", label: "Age", type: "number",
    whyWeAsk: "Some approaches differ by life stage.", // TODO(confirm): is this field needed at all
  },
  {
    key: "city", label: "City", required: true,
    whyWeAsk: "So session times show correctly, and for fees if you're outside India.",
  },
  { key: "timezone", label: "Timezone", required: true, placeholder: "e.g. Asia/Kolkata" },
  {
    key: "occupation", label: "Occupation or what fills your days",
    whyWeAsk: "Helps Anushka understand your week.",
  },
];

function Field({ field, value, onChange, onBlur }) {
  return (
    <label className="block">
      <span className="text-sm text-bb-forest/80">
        {field.label} {field.required && <span className="text-bb-forest/40">(required)</span>}
      </span>
      <input
        type={field.type || "text"}
        value={value ?? ""}
        onChange={(e) => onChange(field.key, e.target.value)}
        onBlur={onBlur}
        placeholder={field.placeholder}
        data-testid={`${ONBOARDING.fieldPrefix}-${field.key}`}
        className="mt-1.5 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-2.5 text-bb-forest min-h-[44px]"
      />
      {field.whyWeAsk && <WhyWeAsk>{field.whyWeAsk}</WhyWeAsk>}
    </label>
  );
}

export default function Stage1AboutYou({ profile, structureMode, onSave, onContinue, onSkipAll }) {
  const [form, setForm] = useState(() => {
    const f = {};
    for (const field of FIELDS) f[field.key] = profile?.[field.key] ?? "";
    return f;
  });
  const [fieldIndex, setFieldIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const change = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const persist = async (extra = {}) => {
    setSaving(true);
    try {
      // Number inputs always yield a string via onChange's e.target.value --
      // the backend's `age` column is a real integer, so convert at this
      // boundary rather than relaxing the schema to accept loose types.
      const age = form.age === "" ? null : Number(form.age);
      await onSave({ ...form, age, ...extra });
    } catch (err) {
      toast.error("Couldn't save that just now. It'll try again as you continue.");
    } finally {
      setSaving(false);
    }
  };

  const finishStage = async () => {
    await persist({ stage1_status: "done" });
    onContinue();
  };

  if (structureMode === "call") {
    return (
      <div className="mt-8">
        <p className="text-bb-forest/70 leading-relaxed">
          No problem — you and Anushka will go through this together on your call instead.
        </p>
        <div className="mt-6">
          <button
            onClick={async () => { await persist({ stage1_status: "deferred_to_call" }); onContinue(); }}
            data-testid={ONBOARDING.stage1Continue}
            className="px-6 py-2.5 rounded-full bg-bb-forest text-bb-cream text-sm hover:bg-bb-forest-2 transition-colors min-h-[44px]"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (structureMode === "step") {
    const field = FIELDS[fieldIndex];
    const isLast = fieldIndex === FIELDS.length - 1;
    return (
      <div className="mt-8 max-w-md">
        <Field field={field} value={form[field.key]} onChange={change} onBlur={() => persist({ stage1_status: "in_progress" })} />
        {saving && <p data-testid={ONBOARDING.savedIndicator} className="mt-2 text-xs text-bb-forest/40">Saving…</p>}
        <div className="mt-6 flex items-center gap-2">
          {fieldIndex > 0 && (
            <button
              onClick={() => setFieldIndex((i) => i - 1)}
              data-testid={ONBOARDING.stage1Back}
              className="px-5 py-2.5 rounded-full text-sm text-bb-forest/70 hover:text-bb-forest min-h-[44px]"
            >
              Back
            </button>
          )}
          <button
            onClick={async () => {
              if (isLast) { await finishStage(); }
              else { await persist({ stage1_status: "in_progress" }); setFieldIndex((i) => i + 1); }
            }}
            data-testid={ONBOARDING.stage1Continue}
            className="px-6 py-2.5 rounded-full bg-bb-forest text-bb-cream text-sm hover:bg-bb-forest-2 transition-colors min-h-[44px]"
          >
            {isLast ? "Continue" : "Next"}
          </button>
          <SkipButton onClick={onSkipAll} />
        </div>
      </div>
    );
  }

  // "single" mode -- everything on one page.
  return (
    <div className="mt-8 max-w-xl" data-testid={ONBOARDING.stage1Form}>
      <div className="grid gap-5">
        {FIELDS.map((field) => (
          <Field
            key={field.key}
            field={field}
            value={form[field.key]}
            onChange={change}
            onBlur={() => persist({ stage1_status: "in_progress" })}
          />
        ))}
      </div>
      {saving && <p data-testid={ONBOARDING.savedIndicator} className="mt-2 text-xs text-bb-forest/40">Saving…</p>}
      <div className="mt-6 flex items-center gap-2">
        <button
          onClick={finishStage}
          data-testid={ONBOARDING.stage1Continue}
          className="px-6 py-2.5 rounded-full bg-bb-forest text-bb-cream text-sm hover:bg-bb-forest-2 transition-colors min-h-[44px]"
        >
          Continue
        </button>
        <SkipButton onClick={onSkipAll} />
      </div>
    </div>
  );
}
