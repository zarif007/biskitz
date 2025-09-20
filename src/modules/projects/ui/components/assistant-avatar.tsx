import { MessageRole } from "@/generated/prisma";
import Image from "next/image";
import React from "react";

const AssistantAvatar = ({ type }: { type: MessageRole }) => {
  const roleImageMap: Record<MessageRole, string> = {
    USER: "/agents/user.png",
    ASSISTANT: "/agents/assistant.png",
    SYSTEM: "/agents/system.png",
    BUSINESS_ANALYST: "/agents/ba.png",
    SYSTEM_ARCHITECT: "/agents/sys_arch.png",
    DEVELOPER: "/agents/dev.png",
    TESTER: "/agents/tester.png",
    SECURITY_ANALYST: "/agents/security.png",
    DEV_OPS: "/agents/devops.png",
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
