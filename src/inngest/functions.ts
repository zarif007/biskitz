import { openai, createAgent } from "@inngest/agent-kit";
import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "Hello World Function" },
  { event: "biskitz/hello" },
  async ({ event, step }) => {
    const agent = createAgent({
      name: "Test",
      system: "You are a helpful assistant.",
      model: openai({ model: "gpt-4o-mini" }),
    });

    const { output } = await agent.run(
      `write a next js code on ${event.data.text}`
    );

    return { output };
  }
);
