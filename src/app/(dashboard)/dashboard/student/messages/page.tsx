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
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  File, 
  X,
  Download,
  Loader2,
  ZoomIn,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { toast } from "sonner"

interface FileAttachment {
  name: string
  url: string
  type: string
  size: number
}

// Image Lightbox Component
function ImageLightbox({ 
  src, 
  alt, 
  onClose 
}: { 
  src: string
  alt: string
  onClose: () => void 
}) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [onClose])

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X className="h-6 w-6" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
      <a
        href={src}
        download={alt}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <Download className="h-4 w-4" />
        Download
      </a>
    </div>
  )
}

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const initialUserId = searchParams.get("user")
  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialUserId)
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: user } = trpc.users.getCurrent.useQuery()
  const { data: conversationList, refetch: refetchList } = trpc.chat.getConversationList.useQuery()

  const sendMessage = trpc.chat.send.useMutation({
    onSuccess: () => {
      setMessage("")
      setAttachments([])
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Upload failed")
        }

        const data = await response.json()
        
        setAttachments(prev => [...prev, {
          name: file.name,
          url: data.url,
          type: file.type,
          size: file.size,
        }])
      }
      toast.success("Files uploaded successfully")
    } catch (error) {
      toast.error("Failed to upload files")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSend = () => {
    if (!selectedUserId || (!message.trim() && attachments.length === 0)) return

    sendMessage.mutate({
      receiverId: selectedUserId,
      content: message || (attachments.length > 0 ? "📎 Sent attachments" : ""),
      files: attachments.map(a => ({
        fileName: a.name,
        fileUrl: a.url,
        fileSize: a.size,
        fileType: a.type,
      })),
    })
  }

  const selectedConversation = conversationList?.find(
    (c) => c.otherUser.id === selectedUserId
  )

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const isImage = (type: string) => type.startsWith("image/")

  return (
    <div className="flex flex-col p-4 md:p-6" style={{ height: 'calc(100vh - 80px)' }}>
      <h1 className="text-3xl font-bold text-slate-900 mb-4 flex-shrink-0">Messages</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden">
        {/* Conversations List */}
        <Card className="md:col-span-1 flex flex-col border-0 shadow-sm bg-white/80 backdrop-blur overflow-hidden">
          <CardHeader className="pb-2 flex-shrink-0">
            <CardTitle className="text-lg font-semibold text-slate-900">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2">
            {!conversationList || conversationList.length === 0 ? (
              <div className="text-center py-8">
                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">No conversations yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversationList.map((conv) => (
                  <button
                    key={conv.otherUser.id}
                    onClick={() => setSelectedUserId(conv.otherUser.id)}
                    className={`w-full p-3 rounded-xl text-left transition-all duration-200 ${
                      selectedUserId === conv.otherUser.id
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarFallback className={selectedUserId === conv.otherUser.id ? "bg-violet-500 text-white" : "bg-violet-100 text-violet-700"}>
                          {conv.otherUser.firstName?.[0] || conv.otherUser.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">
                            {conv.otherUser.firstName} {conv.otherUser.lastName}
                          </p>
                          {conv.unreadCount > 0 && (
                            <Badge className="ml-2 bg-emerald-500 text-white text-xs">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className={`text-sm truncate ${
                          selectedUserId === conv.otherUser.id
                            ? "text-violet-100"
                            : "text-slate-500"
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

        {/* Chat Area */}
        <Card className="md:col-span-2 flex flex-col border-0 shadow-sm bg-white/80 backdrop-blur overflow-hidden">
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {selectedUserId ? (
              <>
                {/* Chat Header */}
                <div className="border-b border-slate-100 p-4 bg-white">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-violet-100">
                      <AvatarFallback className="bg-violet-100 text-violet-700">
                        {selectedConversation?.otherUser.firstName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {selectedConversation?.otherUser.firstName}{" "}
                        {selectedConversation?.otherUser.lastName}
                      </p>
                      <p className="text-sm text-slate-500">
                        {selectedConversation?.otherUser.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {conversations?.map((msg) => {
                    const sender = msg.sender as any
                    const isOwnMessage = sender?.id === user?.id
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl p-3 ${
                            isOwnMessage
                              ? "bg-violet-600 text-white rounded-tr-md"
                              : "bg-white border border-slate-200 text-slate-700 rounded-tl-md shadow-sm"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          
                          {/* File Attachments */}
                          {msg.files && msg.files.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {msg.files.map((file: any) => (
                                <div key={file.id}>
                                  {isImage(file.fileType) ? (
                                    <div 
                                      className="relative group cursor-pointer"
                                      onClick={() => setLightboxImage({ src: file.fileUrl, alt: file.fileName })}
                                    >
                                      <img
                                        src={file.fileUrl}
                                        alt={file.fileName}
                                        className="max-w-full rounded-lg max-h-48 object-cover"
                                        onError={(e) => {
                                          // If image fails to load, show a placeholder
                                          const target = e.target as HTMLImageElement
                                          target.style.display = 'none'
                                          target.nextElementSibling?.classList.remove('hidden')
                                        }}
                                      />
                                      <div className="hidden flex-col items-center justify-center p-4 bg-slate-100 rounded-lg">
                                        <ImageIcon className="h-8 w-8 text-slate-400 mb-2" />
                                        <span className="text-xs text-slate-500">{file.fileName}</span>
                                      </div>
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <ZoomIn className="h-8 w-8 text-white drop-shadow-lg" />
                                      </div>
                                    </div>
                                  ) : (
                                    <a
                                      href={file.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-2 p-3 rounded-lg ${
                                        isOwnMessage 
                                          ? "bg-violet-500/50 hover:bg-violet-500/70" 
                                          : "bg-slate-100 hover:bg-slate-200"
                                      } transition-colors`}
                                    >
                                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                        isOwnMessage ? "bg-violet-400/50" : "bg-white"
                                      }`}>
                                        <File className="h-5 w-5" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{file.fileName}</p>
                                        <p className={`text-xs ${isOwnMessage ? "text-violet-200" : "text-slate-500"}`}>
                                          {(file.fileSize / 1024).toFixed(1)} KB
                                        </p>
                                      </div>
                                      <Download className="h-4 w-4 flex-shrink-0" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <p
                            className={`text-xs mt-1 ${
                              isOwnMessage ? "text-violet-200" : "text-slate-400"
                            }`}
                          >
                            {formatDateTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Attachments Preview */}
                {attachments.length > 0 && (
                  <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        >
                          {getFileIcon(file.type)}
                          <span className="truncate max-w-[100px]">{file.name}</span>
                          <button
                            onClick={() => removeAttachment(index)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="border-t border-slate-100 p-4 bg-white">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                      className="hidden"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="text-slate-500 hover:text-violet-600 hover:bg-violet-50"
                    >
                      {isUploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Paperclip className="h-5 w-5" />
                      )}
                    </Button>
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
                      className="flex-1 border-slate-200 focus:border-violet-300 focus:ring-violet-200"
                    />
                    <Button 
                      onClick={handleSend} 
                      disabled={sendMessage.isPending || (!message.trim() && attachments.length === 0)}
                      className="gradient-bg hover:opacity-90"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-violet-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">Select a conversation</h3>
                  <p className="text-slate-500 text-sm">
                    Choose a conversation to start messaging
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Image Lightbox */}
      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  )
}
