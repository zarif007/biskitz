import React from "react";
import PromptInput from "./Prompt.Input";

const Hero = () => {
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(0,0,0,0.2) 1px, transparent 1px),
            linear-gradient(rgba(0,0,0,0.2) 1px, transparent 1px)
          `,
          backgroundSize: "30px 30px",
        }}
      />

      <div
        className="absolute inset-0 opacity-30 dark:block hidden"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px),
            linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px)
          `,
          backgroundSize: "30px 30px",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 mx-2">
        <div className="text-center space-y-4">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
            Prompt to{" "}
            <span className="px-2 rounded-md animate-gradient-border bg-[length:400%_100%] bg-gradient-to-r from-rose-500 via-violet-500 to-blue-500 dark:from-rose-800 dark:via-violet-800 dark:to-blue-800">
              Packages
            </span>{" "}
          </h1>
          <p className="text-xl text-muted-foreground">
            Create your own NPM packages, UI Components, SDKs with{" "}
            <span className="font-bold text-[black] dark:text-[white]">AI</span>
          </p>
        </div>
        <PromptInput />
      </div>
    </div>
  );
};

export default Hero;
