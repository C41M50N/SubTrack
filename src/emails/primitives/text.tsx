import { cn } from "@/utils";
import type React from "react";
import { Text as RE_Text } from "@react-email/components";

type TextProps = {
  className?: string;
  children: React.ReactNode;
}

export function Text({ className, children }: TextProps) {
  return (
    <RE_Text className={cn("m-0", className)}>
      {children}
    </RE_Text>
  )
}
