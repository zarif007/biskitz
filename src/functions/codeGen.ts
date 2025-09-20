import { openai } from "@ai-sdk/openai";
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox } from "../inngest/utils";
import { PROMPT } from "@/constants/systemPrompts/prompt";
import prisma from "@/lib/db";

interface CodeGenState {
  files: { [path: string]: string };
  summary?: string;
  sandboxId: string;
}

interface CodeGenResult {
  url: string | null;
  title: string;
  files: { [path: string]: string };
  summary?: string;
  fullResult: any;
}

const codeGen = async (
  prompt: string,
  projectId: string
): Promise<CodeGenResult> => {
  const sandbox = await Sandbox.create("demo-nextjs-test2");
  const sandboxId = sandbox.sandboxId;
  const state: CodeGenState = {
    files: {},
    sandboxId,
  };
  const terminalTool = tool({
    description: "A terminal in a unix environment",
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

  let iterations = 0;
  const maxIterations = 1;
  const conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }> = [{ role: "user", content: prompt }];

  while (iterations < maxIterations && !state.summary) {
    try {
      const result = await generateText({
        model: openai("gpt-4.1-mini"),
        system: PROMPT,
        messages: conversationHistory,
        tools: {
          terminal: terminalTool,
          createOrUpdateFiles: createOrUpdateFilesTool,
          readFiles: readFilesTool,
        },
        stopWhen: stepCountIs(2),
      });

      conversationHistory.push({
        role: "assistant",
        content: result.text,
      });

      if (result.finishReason === "stop" && !result.toolCalls?.length) {
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

  const isError = Object.keys(state.files || {}).length === 0;

  let sandboxUrl: string | null = null;
  try {
    const sandbox = await getSandbox(sandboxId);
    const host = sandbox.getHost(3000);
    sandboxUrl = `https://${host}`;
  } catch (e) {
    console.error("Error getting sandbox URL:", e);
    sandboxUrl = null;
  }

  if (isError) {
    await prisma.message.create({
      data: {
        projectId,
        content: "Something went wrong, please try again.",
        role: "ASSISTANT",
        type: "ERROR",
      },
    });
  } else {
    await prisma.message.create({
      data: {
        projectId,
        content: state.summary || prompt,
        role: "ASSISTANT",
        type: "RESULT",
        fragment: {
          create: {
            type: "CODE",
            sandboxUrl: sandboxUrl as string,
            files: state.files,
            title: "Fragment",
          },
        },
      },
    });
  }

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
