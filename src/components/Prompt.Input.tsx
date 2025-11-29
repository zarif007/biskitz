'use client'

import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ArrowUp } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useTRPC } from '@/trpc/client'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import ModelSelector from './ModelSelector'
import updateContext from '@/utils/updateContext'
import IContext from '@/types/context'

const PromptInput = () => {
  const trpc = useTRPC()
  const router = useRouter()
  const createProject = useMutation(trpc.project.create.mutationOptions({}))
  const [userInput, setUserInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [packageType, setPackageType] = useState<'NPM' | 'COMPONENT' | 'SDK'>(
    'NPM'
  )
  const [tddEnabled, setTddEnabled] = useState(false)
  const [modelType, setModelType] = useState<'HIGH' | 'MID'>('MID')

  const onGenerate = async (input: string) => {
    if (!input) return
    setLoading(true)
    try {
      setUserInput('')
      const updatedContext: IContext = updateContext(
        input,
        'USER',
        {},
        {} as IContext
      )
      const res = await createProject.mutateAsync({
        value: input,
        packageType,
        tddEnabled,
        model: modelType,
        context: updatedContext,
        inputTokens: 0,
        outputTokens: 0,
        timeTaken: 0,
      })

      router.push(`/projects/${res.id}`)
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-3xl">
      <div className="relative p-[2px] rounded-md animate-gradient-border bg-[length:400%_100%] bg-gradient-to-r from-rose-500 via-violet-500 to-blue-500 dark:from-rose-800 dark:via-violet-800 dark:to-blue-800">
        <div className="bg-background rounded-sm flex flex-col items-center gap-3">
          <div className="relative w-full">
            <Textarea
              placeholder="Build your next package"
              value={userInput}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setUserInput(e.target.value)
              }
              className="min-h-[120px] text-lg shadow-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground flex-1 px-4 py-6 pr-12 resize-none"
            />
            <Button
              size="icon"
              className="absolute right-3 bottom-3 h-10 w-10 cursor-pointer"
              variant="default"
              onClick={() => onGenerate(userInput)}
              disabled={loading}
            >
              {loading ? (
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              ) : (
                <ArrowUp className="w-5 h-5" />
              )}
            </Button>
            <div className="absolute rounded-md left-3 bottom-3 flex gap-3 items-center px-1">
              <Select
                defaultValue="npm"
                onValueChange={(value) =>
                  setPackageType(value as 'NPM' | 'COMPONENT' | 'SDK')
                }
              >
                <SelectTrigger className="w-[140px] h-9 text-xs focus:ring-0 focus:ring-offset-0 outline-none ring-0 cursor-pointer border-0 font-bold bg-slate-100 dark:bg-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="npm"
                    className="text-xs flex items-center gap-2"
                  >
                    <Image
                      src="/npm.svg"
                      alt="npm"
                      width={24}
                      height={24}
                      className="inline-block"
                    />
                    NPM Package
                  </SelectItem>
                  <SelectItem
                    value="component"
                    disabled
                    className="text-xs flex items-center gap-2 opacity-60"
                  >
                    <Image
                      src="/react.svg"
                      alt="React"
                      width={24}
                      height={24}
                      className="inline-block"
                    />
                    UI Component
                    <span className="ml-1 text-xs text-muted-foreground">
                      (Coming soon)
                    </span>
                  </SelectItem>
                  <SelectItem
                    value="sdk"
                    disabled
                    className="text-xs flex items-center gap-2 opacity-60"
                  >
                    <Image
                      src="/sdk.svg"
                      alt="SDK"
                      width={24}
                      height={24}
                      className="inline-block"
                    />
                    SDK
                    <span className="ml-1 text-xs text-muted-foreground">
                      (Coming soon)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              <ModelSelector
                setModelType={setModelType}
                disabled={false}
                defaultValue={modelType}
              />

              <div className="flex items-center gap-2 pr-1 ">
                <Switch
                  id="tdd-mode"
                  checked={tddEnabled}
                  onCheckedChange={setTddEnabled}
                  className="h-5 w-9"
                  disabled
                />
                <Label
                  htmlFor="tdd-mode"
                  className="text-xs font-bold cursor-pointer"
                >
                  TDD
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PromptInput
