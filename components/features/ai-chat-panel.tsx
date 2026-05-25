"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { getMockAiResponse } from "@/lib/mock/chat";
import type { MockChatMessage } from "@/lib/mock/chat";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface AiChatPanelProps {
  projectName: string;
}

export function AiChatPanel({ projectName }: AiChatPanelProps) {
  const [messages, setMessages] = useState<MockChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: MockChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: new Date().toLocaleString("ko-KR"),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    await new Promise((r) => setTimeout(r, 1000));

    const assistantMsg: MockChatMessage = {
      id: `ai-${Date.now()}`,
      role: "assistant",
      content: getMockAiResponse(trimmed),
      createdAt: new Date().toLocaleString("ko-KR"),
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" aria-hidden />
          <div>
            <h2 className="font-semibold text-gray-900">AI 분석 채팅</h2>
            <p className="text-xs text-gray-500">{projectName}</p>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto p-5"
        style={{ minHeight: "320px", maxHeight: "480px" }}
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center">
            <Sparkles className="mb-3 h-8 w-8 text-gray-300" aria-hidden />
            <p className="text-sm text-gray-500">
              AI에게 분석을 요청해 보세요.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              예: 「공사내역서 요약해 줘」(Phase 4 OpenAI 연동 예정)
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800",
              )}
            >
              {msg.content}
              <p
                className={cn(
                  "mt-1.5 text-xs",
                  msg.role === "user" ? "text-blue-200" : "text-gray-400",
                )}
              >
                {msg.createdAt}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              AI가 분석 중입니다...
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="공사내역서 요약해 줘"
            rows={2}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-auto self-end px-3 py-2"
            aria-label="메시지 전송"
          >
            <Send className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Enter 전송 · Shift+Enter 줄바꿈 · Mock 응답 (Phase 4 API 연동)
        </p>
      </div>
    </div>
  );
}
