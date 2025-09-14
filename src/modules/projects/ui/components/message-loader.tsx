import { Bot } from "lucide-react";
import React, { useEffect, useState } from "react";

const ShimmerMessages = [
  "Thinking...",
  "Generating response...",
  "Analyzing data...",
  "Processing your request...",
  "Almost there...",
];

const MessageLoader = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) =>
        prevIndex === ShimmerMessages.length - 1 ? 0 : prevIndex + 1
      );
    }, 2000);
  }, []);
  return (
    <div className="flex flex-col group px-2 pb-4">
      <div className="flex items-center gap-2 pl-2 mb-2">
        <Bot className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </div>
      <div className="pl-8.5 flex flex-col gap-y-4">
        <div className="flex items-center gap-2">
          <span className="text-base text-muted-foreground animate-pulse">
            {ShimmerMessages[currentMessageIndex]}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageLoader;
