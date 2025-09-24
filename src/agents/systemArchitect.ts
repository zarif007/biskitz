"use server";

import { generateText, stepCountIs, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import SYS_ARCH_SYSTEM_PROMPT from "@/constants/systemPrompts/systemArchitect";

const systemArchitect = async (prompt: string) => {
  const conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }> = [{ role: "user", content: prompt.trim() }];
  try {
    const result = await generateText({
      model: openai("gpt-4.1-mini"),
      system: SYS_ARCH_SYSTEM_PROMPT,
      messages: conversationHistory,
      stopWhen: stepCountIs(2),
    });

    return result.text;
  } catch {}
};

export default systemArchitect;
