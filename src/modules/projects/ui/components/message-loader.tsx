import { MessageRole } from "@/generated/prisma";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const MessageLoader = ({ type }: { type: MessageRole }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

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

  const roleMessages: Record<MessageRole, string[]> = {
    USER: ["Processing input", "Understanding request"],
    ASSISTANT: ["Generating response", "Processing query"],
    SYSTEM: ["Initializing system", "Configuring settings"],
    BUSINESS_ANALYST: [
      "Analyzing request",
      "Writing docs",
      "Gathering requirements",
    ],
    SYSTEM_ARCHITECT: [
      "Designing architecture",
      "Planning system",
      "Optimizing structure",
    ],
    DEVELOPER: ["Writing code", "Debugging logic", "Building features"],
    TESTER: ["Running tests", "Validating functionality", "Ensuring quality"],
    SECURITY_ANALYST: [
      "Scanning for vulnerabilities",
      "Securing system",
      "Analyzing threats",
    ],
    DEV_OPS: [
      "Deploying updates",
      "Monitoring systems",
      "Configuring pipelines",
    ],
  };

  const messages = roleMessages[type] || ["Processing..."];
  const imageSrc = roleImageMap[type] || "/agents/assistant.png";

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <Image
        src={imageSrc}
        alt={`${type} loader`}
        width={72}
        height={72}
        className="object-cover"
      />
      <div className="text-gray-600 dark:text-gray-400 text-md animate-pulse mt-1">
        {messages[currentMessageIndex]}
      </div>
    </div>
  );
};

export default MessageLoader;
