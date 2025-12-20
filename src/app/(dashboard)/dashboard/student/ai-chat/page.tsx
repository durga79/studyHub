"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDateTime } from "@/lib/utils"
import { Bot, Send, User } from "lucide-react"
import { toast } from "sonner"

export default function AIChatPage() {
  const [message, setMessage] = useState("")
  const [conversationId, setConversationId] = useState<string | null>(null)

  const { data: conversations } = trpc.ai.getConversations.useQuery()

  const { data: conversation, refetch } = trpc.ai.getConversation.useQuery(
    { conversationId: conversationId! },
    { enabled: !!conversationId, refetchInterval: 2000 }
  )

  const sendMessage = trpc.ai.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessage("")
      if (!conversationId) {
        setConversationId(data.conversationId)
      }
      refetch()
      toast.success("Message sent")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message")
    },
  })

  const handleSend = () => {
    if (!message.trim()) return

    sendMessage.mutate({
      content: message,
      conversationId: conversationId || undefined,
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">AI Chat Assistant</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="p-4">
            <h2 className="font-semibold mb-4">Conversations</h2>
            <div className="space-y-2">
              {conversations?.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setConversationId(conv.id)}
                  className={`w-full text-left p-2 rounded-lg hover:bg-accent ${
                    conversationId === conv.id ? "bg-accent" : ""
                  }`}
                >
                  <p className="text-sm font-medium truncate">
                    {conv.title || "New Conversation"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(conv.createdAt)}
                  </p>
                </button>
              ))}
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setConversationId(null)}
              >
                New Conversation
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 flex flex-col h-[calc(100vh-200px)]">
          <CardContent className="flex-1 flex flex-col p-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {conversation?.messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <Avatar>
                      <AvatarFallback>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.role === "user"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatDateTime(msg.createdAt)}
                    </p>
                  </div>
                  {msg.role === "user" && (
                    <Avatar>
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask me anything..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSend()
                    }
                  }}
                />
                <Button onClick={handleSend} disabled={sendMessage.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

