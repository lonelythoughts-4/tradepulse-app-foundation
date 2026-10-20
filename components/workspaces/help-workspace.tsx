"use client";

import type { ComponentProps } from "react";
import { LiveHelpScreen } from "../tradepulse-shell";

export function HelpWorkspace(props: ComponentProps<typeof LiveHelpScreen>) {
  return <LiveHelpScreen {...props} />;
}
