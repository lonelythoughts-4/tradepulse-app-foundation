"use client";

import type { ComponentProps } from "react";
import { LiveAdminScreen } from "../tradepulse-shell";

export function AdminWorkspace(props: ComponentProps<typeof LiveAdminScreen>) {
  return <LiveAdminScreen {...props} />;
}
