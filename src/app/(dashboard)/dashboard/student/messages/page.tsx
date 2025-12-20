"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { trpc } from "@/lib/trpc/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/utils"
import { MessageSquare, Send, Paperclip } from "lucide-react"
import { toast } from "sonner"

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const initialUserId = searchParams.get("user")
  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialUserId)
  const [message, setMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: user } = trpc.users.getCurrent.useQuery()
  const { data: conversationList, refetch: refetchList } = trpc.chat.getConversationList.useQuery()

  const sendMessage = trpc.chat.send.useMutation({
    onSuccess: () => {
      setMessage("")
      refetchConversation()
      refetchList()
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message")
    },
  })

  const { data: conversations, refetch: refetchConversation } = trpc.chat.getConversation.useQuery(
    { otherUserId: selectedUserId! },
    // @ts-ignore - tRPC type inference issue
    { enabled: !!selectedUserId, refetchInterval: 3000 }
  )

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [conversations])

  useEffect(() => {
    if (initialUserId) {
      setSelectedUserId(initialUserId)
    }
  }, [initialUserId])

  const handleSend = () => {
    if (!selectedUserId || !message.trim()) return

    sendMessage.mutate({
      receiverId: selectedUserId,
      content: message,
    })
  }

  const selectedConversation = conversationList?.find(
    (c) => c.otherUser.id === selectedUserId
  )

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        <Card className="md:col-span-1 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2">
            {!conversationList || conversationList.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversationList.map((conv) => (
                  <button
                    key={conv.otherUser.id}
                    onClick={() => setSelectedUserId(conv.otherUser.id)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedUserId === conv.otherUser.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {conv.otherUser.firstName?.[0] || conv.otherUser.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">
                            {conv.otherUser.firstName} {conv.otherUser.lastName}
                          </p>
                          {conv.unreadCount > 0 && (
                            <Badge variant="default" className="ml-2">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className={`text-sm truncate ${
                          selectedUserId === conv.otherUser.id
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}>
                          {conv.lastMessage.content}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-0">
            {selectedUserId ? (
              <>
                <div className="border-b p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {selectedConversation?.otherUser.firstName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {selectedConversation?.otherUser.firstName}{" "}
                        {selectedConversation?.otherUser.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation?.otherUser.email}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {conversations?.map((msg) => {
                    const sender = msg.sender as any
                    return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        sender?.id === user?.id ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          sender?.id === user?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        {msg.files && msg.files.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.files.map((file: any) => (
                              <a
                                key={file.id}
                                href={file.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs underline"
                              >
                                <Paperclip className="h-3 w-3" />
                                {file.fileName}
                              </a>
                            ))}
                          </div>
                        )}
                        <p
                          className={`text-xs mt-1 ${
                            sender?.id === user?.id
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatDateTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  )})}
                  <div ref={messagesEndRef} />
                </div>
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSend()
                        }
                      }}
                    />
                    <Button onClick={handleSend} disabled={sendMessage.isPending}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Select a conversation to start messaging
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
