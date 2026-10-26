"use client";

import type { ComponentProps } from "react";

/** A select or checkbox that submits its form on change, so filters apply without a button press. */
export function AutoSubmitSelect(props: ComponentProps<"select">) {
  return <select {...props} onChange={(event) => event.currentTarget.form?.requestSubmit()} />;
}

export function AutoSubmitCheckbox(props: Omit<ComponentProps<"input">, "type">) {
  return <input type="checkbox" {...props} onChange={(event) => event.currentTarget.form?.requestSubmit()} />;
}
