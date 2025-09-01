"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import Image from "next/image";
import { useContext, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

const PromptInput = () => {
  const trpc = useTRPC();
  const invoke = useMutation(trpc.invoke.mutationOptions({}));
  const [userInput, setUserInput] = useState("");

  const onGenerate = async (input: string) => {
    if (!input) return;
    try {
      await invoke.mutateAsync({ text: input });
      setUserInput("");
    } catch (error) {
      console.error("Error invoking function:", error);
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="relative p-[2px] rounded-md animate-gradient-border bg-[length:400%_100%] bg-gradient-to-r from-rose-500 via-violet-500 to-blue-500 dark:from-rose-800 dark:via-violet-800 dark:to-blue-800">
        <div className="bg-background rounded-sm flex flex-col items-center gap-3">
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
            <div className="absolute left-3 bottom-3 flex gap-1 bg-white dark:bg-black font-bold">
              <Select defaultValue="npm">
                <SelectTrigger className="w-[140px] h-9 text-xs focus:ring-0 focus:ring-offset-0 outline-none ring-0 cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="npm"
                    className="text-xs flex items-center gap-2"
                  >
                    <Image
                      src="/npm.svg"
                      alt="npm"
                      width={24}
                      height={24}
                      className="inline-block"
                    />
                    NPM Package
                  </SelectItem>
                  <SelectItem
                    value="ui"
                    disabled
                    className="text-xs flex items-center gap-2 opacity-60"
                  >
                    <Image
                      src="/react.svg"
                      alt="React"
                      width={24}
                      height={24}
                      className="inline-block"
                    />
                    UI Component
                    <span className="ml-1 text-xs text-muted-foreground">
                      (Coming soon)
                    </span>
                  </SelectItem>
                  <SelectItem
                    value="sdk"
                    disabled
                    className="text-xs flex items-center gap-2 opacity-60"
                  >
                    <Image
                      src="/sdk.svg"
                      alt="SDK"
                      width={24}
                      height={24}
                      className="inline-block"
                    />
                    SDK
                    <span className="ml-1 text-xs text-muted-foreground">
                      (Coming soon)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptInput;
