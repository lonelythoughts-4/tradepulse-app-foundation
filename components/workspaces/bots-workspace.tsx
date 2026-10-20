"use client";

import type { ComponentProps } from "react";
import { LiveBotsScreen } from "../tradepulse-shell";

export function BotsWorkspace(props: ComponentProps<typeof LiveBotsScreen>) {
  return <LiveBotsScreen {...props} />;
}
