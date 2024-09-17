"use client"
import { useState } from 'react'
import { Send } from 'lucide-react'

interface Message {
  text: string
  isUser: boolean
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hello! I'm HrAI. How can I assist you today?", isUser: false }
  ])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { text: input, isUser: true }])
      // Simulating AI response
      setTimeout(() => {
        setMessages(prev => [...prev, { text: "I'm processing your request. Please wait for a moment.", isUser: false }])
      }, 1000)
      setInput('')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">HrAI</h1>
        </div>
      </header>
      <main className="flex-grow overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-sm ${
                  message.isUser ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>
      </main>
      <div className="bg-white border-t border-gray-200 px-4 py-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message here..."
            className="flex-grow px-2 rounded-l-md text-black border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}