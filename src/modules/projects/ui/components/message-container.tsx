import React, { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Clock,
  User,
  Bot,
  Send,
  Code2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Fragment, MessageRole, MessageType } from "@/generated/prisma";
import MessageLoader from "./message-loader";

interface Message {
  role: MessageRole;
  content: string;
  createdAt: Date;
  fragment: Fragment | null;
  type: MessageType;
  id?: string;
  isOptimistic?: boolean;
}

interface Props {
  messages: Message[];
  isMessageCreationPending: boolean;
  onCreateMessage: (content: string) => void;
  activeFragment: Fragment | null;
  onFragmentClicked: (fragment: Fragment | null) => void;
}

const MessageContainer = ({
  messages,
  activeFragment,
  onFragmentClicked,
  isMessageCreationPending,
  onCreateMessage,
}: Props) => {
  const bottomRef = React.useRef<HTMLDivElement | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [expandedFragmentIdx, setExpandedFragmentIdx] = useState<number | null>(
    null
  );
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

  // Combine real messages with optimistic messages
  const allMessages = [...messages, ...optimisticMessages];

  useEffect(() => {
    const lastAssistantMessage = allMessages.findLast(
      (m) => m.role === "ASSISTANT"
    );

    if (lastAssistantMessage) {
      onFragmentClicked(lastAssistantMessage.fragment);
    }
  }, [allMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  // Clear optimistic messages when real messages update
  useEffect(() => {
    setOptimisticMessages([]);
  }, [messages.length]);

  const handleSend = () => {
    if (inputValue.trim()) {
      const messageContent = inputValue.trim();

      const optimisticUserMessage: Message = {
        role: MessageRole.USER,
        content: messageContent,
        createdAt: new Date(),
        fragment: null,
        type: MessageType.RESULT,
        id: `optimistic-${Date.now()}`,
        isOptimistic: true,
      };

      setOptimisticMessages([optimisticUserMessage]);
      setInputValue("");

      onCreateMessage(messageContent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const lastMessage = allMessages[allMessages.length - 1];
  const lastUserMessage = lastMessage?.role === "USER";

  return (
    <div className="relative h-full border-r bg-white dark:bg-gray-950">
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 dark:bg-gray-950">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-sm bg-white dark:bg-gray-900 shadow-sm">
            <MessageCircle className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-950 dark:text-gray-100">
              Messages
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Conversation
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          {allMessages.length}
        </Badge>
      </div>
      <ScrollArea className="h-[calc(100%-8rem)]">
        <div className="p-4 space-y-4 mb-10">
          {allMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-900 mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-950 dark:text-gray-100 mb-1">
                No messages yet
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Start a conversation to see messages here
              </p>
            </div>
          ) : (
            allMessages.map((message, index) => {
              const isAssistant =
                message.role === MessageRole.ASSISTANT ||
                message.role?.toString().toUpperCase() === "ASSISTANT";

              // Add visual indicator for optimistic messages
              const isOptimistic = message.isOptimistic;

              return (
                <div
                  key={message.id || index}
                  className={`flex gap-3 ${
                    isAssistant ? "flex-row" : "flex-row-reverse"
                  } ${isOptimistic ? "opacity-70" : ""}`}
                >
                  <div className="flex-shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isAssistant
                          ? "bg-gray-100 dark:bg-gray-900"
                          : "bg-gray-950 dark:bg-gray-100"
                      }`}
                    >
                      {isAssistant ? (
                        <Bot className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <User className="w-4 h-4 text-white dark:text-gray-950" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 max-w-[80%]">
                    <Card
                      className={`p-3 shadow-sm ${
                        isAssistant
                          ? "bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-700"
                          : "bg-gray-950 dark:bg-gray-100 border-gray-950 dark:border-gray-100"
                      }`}
                    >
                      <p
                        className={`text-sm leading-relaxed ${
                          isAssistant
                            ? "text-gray-950 dark:text-gray-100"
                            : "text-white dark:text-gray-950"
                        }`}
                      >
                        {message.content}
                      </p>
                      {message.fragment && (
                        <div
                          className={`p-2 rounded-sm bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 ${
                            activeFragment &&
                            message.fragment.id === activeFragment.id
                              ? "ring-2 ring-blue-500"
                              : ""
                          }`}
                        >
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => {
                              if (message.fragment) {
                                onFragmentClicked(message.fragment);
                              }
                            }}
                          >
                            <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                              <Code2 className="w-4 h-4 mr-1" /> Fragment
                            </div>
                            <button
                              type="button"
                              className="ml-2 p-1 rounded-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                              onClick={(event) => {
                                event.stopPropagation();
                                setExpandedFragmentIdx(
                                  expandedFragmentIdx === index ? null : index
                                );
                              }}
                            >
                              {expandedFragmentIdx === index ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          {expandedFragmentIdx === index &&
                            message.fragment.files && (
                              <div className="mt-2 mb-1 text-xs text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Files:</span>
                                <ul className="list-disc ml-4">
                                  {Object.entries(
                                    message.fragment.files as Record<
                                      string,
                                      unknown
                                    >
                                  ).map(([file]) => (
                                    <li key={file} className="break-all">
                                      <span className="font-mono">{file}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                        </div>
                      )}
                    </Card>
                    <div
                      className={`flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400 ${
                        isAssistant ? "justify-start" : "justify-end"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isOptimistic && (
                        <span className="text-xs text-gray-400 ml-1">
                          (sending...)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {(lastUserMessage || isMessageCreationPending) && <MessageLoader />}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white dark:bg-gray-950">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background/70 pointer-events-none" />
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              className="w-full resize-none text-sm min-h-[64px] max-h-[120px] pr-12 bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-700 rounded-sm focus:ring-0"
              disabled={false} // Never disable the input
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              size="sm"
              className="absolute right-2 bottom-2 h-8 px-2 bg-gray-950 hover:bg-gray-900 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-950"
            >
              {isMessageCreationPending ? (
                <svg
                  className="w-4 h-4 animate-spin text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageContainer;
