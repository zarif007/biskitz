// global.d.ts
import { WebContainer } from "@webcontainer/api";

declare global {
  interface Window {
    __webcontainerSingleton?: WebContainer;
  }
}

export {};
