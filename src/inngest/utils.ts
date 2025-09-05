import Sandbox from "@e2b/code-interpreter";
import { AgentResult, TextMessage } from "@inngest/agent-kit";

export const getSandbox = async (name: string) => {
  const sandbox = await Sandbox.connect(name);
  return sandbox;
};

export const lastAssistantTextMessage = (result: AgentResult) => {
  const lastMessageIdx = result.output.findLastIndex(
    (message) => message.role === "assistant"
  );
  const message = result.output[lastMessageIdx] as TextMessage | undefined;

  return message?.content
    ? typeof message.content === "string"
      ? message.content
      : message.content.map((c) => c.text).join("")
    : undefined;
};
