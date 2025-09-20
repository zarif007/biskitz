import {
  openai,
  createAgent,
  createTool,
  createNetwork,
} from "@inngest/agent-kit";
import { inngest } from "./client";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox, lastAssistantTextMessage } from "./utils";
import { PROMPT } from "@/constants/systemPrompts/prompt";

export const helloWorld = inngest.createFunction(
  { id: "Hello World Function" },
  { event: "biskitz/hello" },
  async ({ event, step }) => {
    const sandboxId = await step.run("Create Sandbox", async () => {
      const sandbox = await Sandbox.create("demo-nextjs-test2");
      return sandbox.sandboxId;
    });

    const codeAgent = createAgent({
      name: "coding-agent",
      description:
        "An expert coding agent that can write and execute code in a linux environment",
      system: PROMPT,
      model: openai({ model: "gpt-4o" }),
      tools: [
        createTool({
          name: "terminal",
          description: "A terminal in a linux environment",
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
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
            });
          },
        }),
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox.",
          handler: async ({ files }, { step, network }) => {
            const filesArray = Array.isArray(files) ? files : [];
            const newFiles = await step?.run(
              "createOrUpdateFiles",
              async () => {
                try {
                  const updatedFiles = network?.state?.data?.files || {};
                  const sandbox = await getSandbox(sandboxId);

                  for (const file of filesArray) {
                    await sandbox.files.write(file.path, file.content);
                    updatedFiles[file.path] = file.content;
                  }

                  return updatedFiles;
                } catch (e) {
                  return `Error: ${(e as Error).message}`;
                }
              }
            );

            if (typeof newFiles === "object" && network) {
              network.state.data.files = newFiles;
            }

            return newFiles;
          },
        }),
        createTool({
          name: "readFiles",
          description: "Read files from the sandbox.",
          handler: async ({ files }, { step }) => {
            const filesArray = Array.isArray(files) ? files : [];
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = [];

                for (const file of filesArray) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }

                const result = JSON.stringify(contents);
                return result;
              } catch (e) {
                return `Error: ${(e as Error).message}`;
              }
            });
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantText = lastAssistantTextMessage(result);

          if (lastAssistantText && network) {
            if (lastAssistantText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantText;
            }
          }

          return result;
        },
      },
    });

    const network = createNetwork({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 7,
      router: async ({ network }) => {
        const summary = network.state.data.summary;

        if (summary) {
          return; // End the network
        }

        return codeAgent;
      },
    });

    const result = await network.run(
      event.data?.text ??
        "Hello, please help me create a simple Next.js application"
    );

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      try {
        const sandbox = await getSandbox(sandboxId);
        const host = sandbox.getHost(3000);
        const url = `https://${host}`;
        return url;
      } catch (e) {
        return null;
      }
    });

    const finalResult = {
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
      fullResult: result, // Include full result for debugging
    };

    return finalResult;
  }
);
