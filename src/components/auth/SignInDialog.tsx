"use client";

import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import Image from "next/image";
import { signIn } from "next-auth/react";
import logo from "../../../public/logo.png";

interface SignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignInDialog({ open, onOpenChange }: SignInDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader className="flex flex-col items-center space-y-3">
          <Image
            src={logo}
            alt="App Logo"
            width={48}
            height={48}
            className="rounded-md"
          />
          <h2 className="text-lg font-semibold">Welcome Back</h2>
          <p className="text-sm text-muted-foreground text-center">
            Sign in to continue to your account
          </p>
        </DialogHeader>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            variant="outline"
            // disabled={true}
            className="flex items-center gap-2 w-full justify-center"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            <FcGoogle className="h-5 w-5" />
            Continue with Google
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-2 w-full justify-center"
            onClick={() => signIn("github", { callbackUrl: "/" })}
          >
            <FaGithub className="h-5 w-5" />
            Continue with GitHub
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
