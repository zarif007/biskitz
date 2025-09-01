import { openai, createAgent } from "@inngest/agent-kit";
import { inngest } from "./client";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox } from "./utils";

export const helloWorld = inngest.createFunction(
  { id: "Hello World Function" },
  { event: "biskitz/hello" },
  async ({ event, step }) => {
    const sandboxId = await step.run("Create Sandbox", async () => {
      const sandbox = await Sandbox.create("demo-nextjs-test2");
      return sandbox.sandboxId;
    });
    const agent = createAgent({
      name: "Test",
      system: "You are a helpful assistant.",
      model: openai({ model: "gpt-4o-mini" }),
    });

    const { output } = await agent.run(
      `write a next js code on ${event.data.text}`
    );

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    return { output, sandboxUrl };
  }
);
