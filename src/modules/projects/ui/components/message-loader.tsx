import { MessageRole } from "@/generated/prisma";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const MessageLoader = ({ type }: { type: MessageRole }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

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
        width={60}
        height={60}
        className="object-cover"
      />
      <div className="text-gray-600 dark:text-gray-400 text-md animate-pulse mt-1">
        {messages[currentMessageIndex]}
      </div>
    </div>
  );
};

export default MessageLoader;
