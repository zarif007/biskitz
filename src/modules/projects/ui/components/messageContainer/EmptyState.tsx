import { MessageCircle } from 'lucide-react'

const EmptyState = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center min-h-[400px]">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-black mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-950 dark:text-gray-100 mb-1">
                No messages yet
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
                Start a conversation to see messages here
            </p>
        </div>
    )
}

export default EmptyState

