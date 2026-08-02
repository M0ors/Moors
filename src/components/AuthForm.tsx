"use client";

import { useFormState } from "react-dom";

type FormState = { error?: string } | undefined;

type Props = {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  submitLabel: string;
};

export function AuthForm({ action, children, submitLabel }: Props) {
  const [state, formAction] = useFormState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-sm">
      {children}
      {state?.error ? <p className="text-red-600 text-sm">{state.error}</p> : null}
      <button type="submit">{submitLabel}</button>
    </form>
  );
}
