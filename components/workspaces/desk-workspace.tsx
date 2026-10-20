"use client";

import type { ComponentProps } from "react";
import { LiveDeskScreen } from "../tradepulse-shell";

export function DeskWorkspace(props: ComponentProps<typeof LiveDeskScreen>) {
  return <LiveDeskScreen {...props} />;
}
