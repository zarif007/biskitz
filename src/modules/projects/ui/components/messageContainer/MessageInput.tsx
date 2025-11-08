import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import ModelSelector from '@/components/ModelSelector'
import { Dispatch, SetStateAction } from 'react'

interface MessageInputProps {
  inputValue: string
  setInputValue: (value: string) => void
  handleKeyDown: (e: React.KeyboardEvent) => void
  handleSend: () => void
  isProcessing: boolean
  isMessageCreationPending: boolean
  modelType: 'HIGH' | 'MID'
  setModelType: Dispatch<SetStateAction<'HIGH' | 'MID'>>
}

const MessageInput = ({
  inputValue,
  setInputValue,
  handleKeyDown,
  handleSend,
  isProcessing,
  isMessageCreationPending,
  modelType,
  setModelType,
}: MessageInputProps) => {
  return (
    <div className="flex-shrink-0 sticky bottom-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-black">
      <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background/70 pointer-events-none" />
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            className="w-full resize-none text-sm min-h-[80px] max-h-[120px] bg-gray-50 dark:bg-black border-gray-200 dark:border-gray-700 rounded-sm focus:ring-0"
            disabled={isProcessing}
          />

          <div className="absolute left-2 bottom-2 flex items-center">
            <ModelSelector
              setModelType={setModelType}
              disabled={isProcessing}
              defaultValue={modelType}
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={!inputValue || isProcessing}
            size="sm"
            className="absolute right-2 bottom-2 h-8 px-2 bg-black hover:bg-gray-900 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-950 rounded-sm"
          >
            {isMessageCreationPending || isProcessing ? (
              <svg
                className="w-4 h-4 animate-spin text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default MessageInput
