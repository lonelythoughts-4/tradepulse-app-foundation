"use client";

import type { ComponentProps } from "react";
import { LiveAccountScreen } from "../tradepulse-shell";

export function AccountWorkspace(props: ComponentProps<typeof LiveAccountScreen>) {
  return <LiveAccountScreen {...props} />;
}
