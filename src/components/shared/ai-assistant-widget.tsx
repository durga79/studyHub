"use client"

import { useState, useRef, useEffect } from "react"
import { trpc } from "@/lib/trpc/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { 
  Sparkles, 
  X, 
  Send, 
  Minimize2, 
  MessageSquare,
  Bot,
  User,
  Loader2
} from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
}

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const sendMessage = trpc.ai.sendMessage.useMutation({
    onSuccess: (data) => {
      setConversationId(data.conversationId)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: data.response,
        createdAt: new Date()
      }])
    },
    onError: () => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, I'm having trouble responding. Please try again.",
        createdAt: new Date()
      }])
    }
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!message.trim() || sendMessage.isPending) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      createdAt: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    sendMessage.mutate({
      content: message,
      conversationId: conversationId || undefined,
    })
    setMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 h-14 w-14 rounded-full gradient-bg shadow-lg shadow-violet-500/30 flex items-center justify-center hover:scale-110 transition-all duration-300 group"
      >
        <Sparkles className="h-6 w-6 text-white group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
      </button>
    )
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-3 px-4 py-3 rounded-full gradient-bg shadow-lg shadow-violet-500/30 text-white hover:scale-105 transition-all duration-300"
        >
          <Sparkles className="h-5 w-5" />
          <span className="font-medium">AI Assistant</span>
          {messages.length > 0 && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
              {messages.length}
            </span>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white rounded-2xl shadow-2xl shadow-violet-500/20 border border-slate-200 overflow-hidden flex flex-col h-[500px] max-h-[calc(100vh-6rem)]">
        {/* Header */}
        <div className="gradient-bg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Assistant</h3>
              <p className="text-xs text-violet-200">Powered by Gemini</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-100 to-cyan-100 flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-violet-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">How can I help you?</h4>
              <p className="text-sm text-slate-500">
                Ask me anything about your assignments, studies, or get help with your work.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {["Help with my assignment", "Explain a concept", "Study tips"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setMessage(suggestion)}
                    className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    msg.role === "user" 
                      ? "bg-violet-600" 
                      : "bg-gradient-to-br from-violet-100 to-cyan-100"
                  )}>
                    {msg.role === "user" ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-violet-600" />
                    )}
                  </div>
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5",
                    msg.role === "user"
                      ? "bg-violet-600 text-white rounded-tr-md"
                      : "bg-white border border-slate-200 text-slate-700 rounded-tl-md shadow-sm"
                  )}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {sendMessage.isPending && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-100 to-cyan-100 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-violet-600" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                      <span className="text-sm text-slate-500">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-100">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="flex-1 border-slate-200 focus:border-violet-300 focus:ring-violet-200"
              disabled={sendMessage.isPending}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sendMessage.isPending}
              className="gradient-bg hover:opacity-90 px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

