import { MessageRole } from "@/generated/prisma";
import Image from "next/image";
import React from "react";

const AssistantAvatar = ({ type }: { type: MessageRole }) => {
  const roleImageMap: Record<MessageRole, string> = {
    USER: "/agents/gradient/user.png",
    ASSISTANT: "/agents/gradient/assistant.png",
    SYSTEM: "/agents/gradient/system.png",
    BUSINESS_ANALYST: "/agents/gradient/ba.png",
    SYSTEM_ARCHITECT: "/agents/gradient/sys_arch.png",
    DEVELOPER: "/agents/gradient/dev.png",
    TESTER: "/agents/gradient/tester.png",
    SECURITY_ANALYST: "/agents/gradient/security.png",
    DEV_OPS: "/agents/gradient/devops.png",
  };

  const imageSrc = roleImageMap[type] || "/agents/assistant.png";

  return (
    <Image
      src={imageSrc}
      alt={`${type} avatar`}
      width={32}
      height={32}
      className="object-cover"
    />
  );
};

export default AssistantAvatar;
