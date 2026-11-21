"use client";

import type { ComponentProps } from "react";
import { BotsWorkspace } from "./bots-workspace";

type Props = Omit<
  ComponentProps<typeof BotsWorkspace>,
  "initialBotId" | "initialView" | "flashbackOnly" | "onLeaveFlashback"
> & {
  onBackToBots: () => void;
};

export function FlashbackWorkspace({ onBackToBots, ...props }: Props) {
  return (
    <BotsWorkspace
      {...props}
      initialView="flashback"
      flashbackOnly
      onLeaveFlashback={onBackToBots}
    />
  );
}
