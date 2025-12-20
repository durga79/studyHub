import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GEMINI_API_KEY

let genAI: GoogleGenerativeAI | null = null

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey)
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function generateAIResponse(
  prompt: string,
  context?: string
): Promise<string> {
  if (!genAI) {
    return "AI chat is not configured. Please add GEMINI_API_KEY to your environment variables."
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

  const fullPrompt = context
    ? `Context: ${context}\n\nUser Question: ${prompt}\n\nPlease provide a helpful response based on the context provided.`
    : prompt

  try {
    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    return response.text()
  } catch (error: any) {
    console.error("Gemini API error:", error)
    
    if (error?.status === 429) {
      return "I'm receiving too many requests right now. Please wait a few seconds and try again."
    }
    
    if (error?.message?.includes("API key")) {
      return "AI chat is not properly configured. Please check your API key."
    }
    
    return "I'm having trouble generating a response right now. Please try again later."
  }
}

export async function generateAIResponseWithHistory(
  prompt: string,
  history: Array<{ role: string; content: string }>,
  context?: string
): Promise<string> {
  if (!genAI) {
    return "AI chat is not configured. Please add GEMINI_API_KEY to your environment variables."
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

  const chat = model.startChat({
    history: history.slice(-8).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    })),
  })

  const fullPrompt = context
    ? `Context: ${context}\n\nUser Question: ${prompt}`
    : prompt

  try {
    const result = await chat.sendMessage(fullPrompt)
    const response = await result.response
    return response.text()
  } catch (error: any) {
    console.error("Gemini API error:", error)
    
    if (error?.status === 429) {
      // Try once more after a delay
      try {
        await delay(2000)
        const result = await chat.sendMessage(fullPrompt)
        const response = await result.response
        return response.text()
      } catch {
        return "I'm receiving too many requests right now. Please wait a few seconds and try again."
      }
    }
    
    if (error?.message?.includes("API key")) {
      return "AI chat is not properly configured. Please check your API key."
    }
    
    return "I'm having trouble generating a response right now. Please try again later."
  }
}
