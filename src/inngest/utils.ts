import Sandbox from "@e2b/code-interpreter";

export const getSandbox = async (name: string) => {
  const sandbox = await Sandbox.connect(name);
  return sandbox;
};
