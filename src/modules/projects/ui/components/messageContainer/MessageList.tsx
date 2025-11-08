import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageRole } from '@/generated/prisma'
import { Fragment } from '@/generated/prisma'
import MessageLoader from '../message-loader'
import EmptyState from './EmptyState'
import MessageItem from './MessageItem'
import { Message } from './types'

interface MessageListProps {
    messages: Message[]
    scrollAreaRef: React.RefObject<HTMLDivElement | null>
    bottomRef: React.RefObject<HTMLDivElement | null>
    activeFragment: Fragment | null
    onFragmentClicked: (fragment: Fragment | null) => void
    expandedFragmentIdx: number | null
    setExpandedFragmentIdx: (idx: number | null) => void
    isProcessing: boolean
    nextFrom: MessageRole
}

const MessageList = ({
    messages,
    scrollAreaRef,
    bottomRef,
    activeFragment,
    onFragmentClicked,
    expandedFragmentIdx,
    setExpandedFragmentIdx,
    isProcessing,
    nextFrom,
}: MessageListProps) => {
    return (
        <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full" ref={scrollAreaRef}>
                <div className="p-4 space-y-2">
                    {messages.length === 0 ? (
                        <EmptyState />
                    ) : (
                        messages.map((message, index) => {
                            const isAssistant = message.role !== MessageRole.USER

                            return (
                                <MessageItem
                                    key={message.id || index}
                                    message={message}
                                    index={index}
                                    isAssistant={isAssistant}
                                    activeFragment={activeFragment}
                                    onFragmentClicked={onFragmentClicked}
                                    expandedFragmentIdx={expandedFragmentIdx}
                                    setExpandedFragmentIdx={setExpandedFragmentIdx}
                                />
                            )
                        })
                    )}
                    {isProcessing && <MessageLoader type={nextFrom} />}
                    <div ref={bottomRef} />
                </div>
            </ScrollArea>
        </div>
    )
}

export default MessageList

