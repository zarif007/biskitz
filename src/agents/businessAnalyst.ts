"use server";

import { generateText, stepCountIs, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import BA_SYSTEM_PROMPT from "@/constants/systemPrompts/businessAnalyst";

const businessAnalyst = async (prompt: string) => {
  const conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }> = [{ role: "user", content: prompt.trim() }];
  try {
    const result = await generateText({
      model: openai("gpt-4.1-mini"),
      system: BA_SYSTEM_PROMPT,
      messages: conversationHistory,
      stopWhen: stepCountIs(2),
    });

    return result.text;
  } catch {}
};

export default businessAnalyst;
