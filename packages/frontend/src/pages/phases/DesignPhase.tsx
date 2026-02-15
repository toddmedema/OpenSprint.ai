import { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';

interface DesignPhaseProps {
  projectId: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function DesignPhase({ projectId }: DesignPhaseProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [prdContent, setPrdContent] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation history
  useEffect(() => {
    api.chat.history(projectId, 'design').then((data: unknown) => {
      const conv = data as { messages?: Message[] };
      if (conv?.messages) {
        setMessages(conv.messages);
      }
    });

    // Load PRD
    api.prd.get(projectId).then((data: unknown) => {
      const prd = data as { sections?: Record<string, { content: string }> };
      if (prd?.sections) {
        const content: Record<string, string> = {};
        for (const [key, section] of Object.entries(prd.sections)) {
          content[key] = section.content;
        }
        setPrdContent(content);
      }
    });
  }, [projectId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const response = (await api.chat.send(projectId, userMessage.content, 'design')) as {
        message: string;
      };
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.message,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Left: Chat Pane */}
      <div className="flex-1 flex flex-col border-r border-gray-200">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start designing your product</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Describe your product vision and the AI planning agent will help you build
                a comprehensive PRD through conversation.
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-400">
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-3">
            <input
              type="text"
              className="input flex-1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Describe your product vision..."
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="btn-primary disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Right: Live PRD */}
      <div className="w-[480px] overflow-y-auto p-6 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Living PRD</h2>

        {Object.keys(prdContent).length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            PRD sections will appear here as you design your product
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(prdContent).map(([key, content]) => (
              <div key={key} className="card p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 capitalize">
                  {key.replace(/_/g, ' ')}
                </h3>
                <div className="prose prose-sm max-w-none text-gray-600">
                  <p className="whitespace-pre-wrap">{content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
