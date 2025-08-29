/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Lightbulb, ArrowUp, Book } from "lucide-react";
import { useContext, useState } from "react";

const PromptInput = () => {
  const [userInput, setUserInput] = useState("");

  const onGenerate = async (input: string) => {};

  return (
    <div className="w-full max-w-3xl">
      <div className="relative p-[2px] rounded-md animate-gradient-border bg-[length:400%_100%] bg-gradient-to-r from-rose-500 via-violet-500 to-blue-500 dark:from-rose-800 dark:via-violet-800 dark:to-blue-800">
        <div className="bg-background rounded-md flex flex-col items-center gap-3">
          <div className="relative w-full">
            <Textarea
              placeholder="Build your next package"
              value={userInput}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setUserInput(e.target.value)
              }
              className="min-h-[120px] text-lg shadow-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground flex-1 px-4 py-6 pr-12 resize-none"
            />
            <Button
              size="icon"
              className="absolute right-3 bottom-3 h-10 w-10"
              variant="default"
              onClick={() => onGenerate(userInput)}
            >
              <ArrowUp className="w-5 h-5" />
            </Button>
            <div className="absolute left-3 bottom-3 flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-transparent"
              >
                <Book className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-transparent"
              >
                <Lightbulb className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptInput;
