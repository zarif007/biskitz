import { openai } from "@ai-sdk/openai";
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox, lastAssistantTextMessage } from "../inngest/utils";
import { PROMPT } from "@/constents/systemPrompts/prompt";

interface CodeGenState {
  files: Record<string, string>;
  summary?: string;
  sandboxId: string;
}

interface CodeGenResult {
  url: string | null;
  title: string;
  files: Record<string, string>;
  summary?: string;
  fullResult: any;
}

const codeGen = async (prompt: string): Promise<CodeGenResult> => {
  // Create sandbox
  const sandbox = await Sandbox.create("demo-nextjs-test2");
  const sandboxId = sandbox.sandboxId;

  // Initialize state
  const state: CodeGenState = {
    files: {},
    sandboxId,
  };

  // Define tools for the AI
  const terminalTool = tool({
    description: "A terminal in a linux environment",
    inputSchema: z.object({
      command: z.string().describe("The command to execute in the terminal"),
    }),
    execute: async ({ command }) => {
      const buffers = { stdout: "", stderr: "" };

      try {
        const sandbox = await getSandbox(sandboxId);
        const result = await sandbox.commands.run(command, {
          onStdout: (data: string) => {
            buffers.stdout += data;
          },
          onStderr: (data: string) => {
            buffers.stderr += data;
          },
        });

        return {
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
        };
      } catch (e) {
        const errorMessage = (e as Error).message;
        buffers.stderr += errorMessage;
        return {
          stdout: buffers.stdout,
          stderr: buffers.stderr,
          error: errorMessage,
        };
      }
    },
  });

  const createOrUpdateFilesTool = tool({
    description: "Create or update files in the sandbox.",
    inputSchema: z.object({
      files: z
        .array(
          z.object({
            path: z.string(),
            content: z.string(),
          })
        )
        .describe("Array of files to create or update"),
    }),
    execute: async ({ files }) => {
      try {
        const sandbox = await getSandbox(sandboxId);

        for (const file of files) {
          await sandbox.files.write(file.path, file.content);
          state.files[file.path] = file.content;
        }

        return state.files;
      } catch (e) {
        return `Error: ${(e as Error).message}`;
      }
    },
  });

  const readFilesTool = tool({
    description: "Read files from the sandbox.",
    inputSchema: z.object({
      files: z.array(z.string()).describe("Array of file paths to read"),
    }),
    execute: async ({ files }) => {
      try {
        const sandbox = await getSandbox(sandboxId);
        const contents = [];

        for (const file of files) {
          const content = await sandbox.files.read(file);
          contents.push({ path: file, content });
        }

        return JSON.stringify(contents);
      } catch (e) {
        return `Error: ${(e as Error).message}`;
      }
    },
  });

  // Main conversation loop (equivalent to network with maxIter: 7)
  let iterations = 0;
  const maxIterations = 7;
  const conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }> = [{ role: "user", content: prompt }];

  while (iterations < maxIterations && !state.summary) {
    try {
      const result = await generateText({
        model: openai("gpt-5-mini"),
        system: PROMPT,
        messages: conversationHistory,
        tools: {
          terminal: terminalTool,
          createOrUpdateFiles: createOrUpdateFilesTool,
          readFiles: readFilesTool,
        },
        stopWhen: stepCountIs(10),
      });

      // Add assistant response to conversation history
      conversationHistory.push({
        role: "assistant",
        content: result.text,
      });

      // If no summary is found but the assistant seems to be done, break
      if (result.finishReason === "stop" && !result.toolCalls?.length) {
        // Check if the response indicates completion
        const completionIndicators = [
          "task completed",
          "application is ready",
          "setup complete",
          "finished",
          "done",
        ];

        if (
          completionIndicators.some((indicator) =>
            result.text.toLowerCase().includes(indicator)
          )
        ) {
          state.summary = result.text;
          break;
        }
      }

      iterations++;

      // Add a follow-up message if we're continuing
      if (iterations < maxIterations && !state.summary) {
        conversationHistory.push({
          role: "user",
          content:
            "Please continue with the next step or provide a task summary if you're done.",
        });
      }
    } catch (error) {
      console.error("Error in code generation iteration:", error);
      break;
    }
  }

  // Get sandbox URL
  let sandboxUrl: string | null = null;
  try {
    const sandbox = await getSandbox(sandboxId);
    const host = sandbox.getHost(3000);
    sandboxUrl = `https://${host}`;
  } catch (e) {
    console.error("Error getting sandbox URL:", e);
    sandboxUrl = null;
  }

  // Return final result
  const finalResult: CodeGenResult = {
    url: sandboxUrl,
    title: "Fragment",
    files: state.files,
    summary: state.summary,
    fullResult: {
      iterations,
      conversationHistory,
      state,
    },
  };

  return finalResult;
};

export default codeGen;
