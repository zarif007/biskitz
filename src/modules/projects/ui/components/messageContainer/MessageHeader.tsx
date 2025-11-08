import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface MessageHeaderProps {
    headerTitle: string
    showUsage: boolean
    setShowUsage: React.Dispatch<React.SetStateAction<boolean>>
}

const MessageHeader = ({
    headerTitle,
    showUsage,
    setShowUsage,
}: MessageHeaderProps) => {
    return (
        <div className="h-10 flex-shrink-0 sticky top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700 px-4 py-2">
            <div className="flex items-center gap-3 h-full">
                <Link href="/">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Go back</span>
                    </Button>
                </Link>
                <h2 className="font-semibold text-gray-950 dark:text-gray-100 text-sm leading-none">
                    {headerTitle}
                </h2>
                <div className="flex items-center gap-2 ml-auto">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Button
                            variant="default"
                            className="text-xs cursor-pointer h-7"
                            onClick={() => setShowUsage(!showUsage)}
                        >
                            {showUsage ? 'Hide' : 'Usage'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MessageHeader

