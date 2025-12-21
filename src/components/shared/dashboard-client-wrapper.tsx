"use client"

import { AIAssistantWidget } from "./ai-assistant-widget"

interface DashboardClientWrapperProps {
  userRole: string
  children: React.ReactNode
}

export function DashboardClientWrapper({ userRole, children }: DashboardClientWrapperProps) {
  // Only show AI assistant for students
  const showAIAssistant = userRole === "student"

  return (
    <>
      {children}
      {showAIAssistant && <AIAssistantWidget />}
    </>
  )
}

