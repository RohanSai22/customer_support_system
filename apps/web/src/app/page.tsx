"use client";

import { useState, useEffect } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { UserSelector } from "@/components/UserSelector";

export default function Home() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            AI Customer Support
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Multi-agent system powered by Gemini AI
          </p>
        </header>

        {!selectedUserId ? (
          <UserSelector onSelectUser={setSelectedUserId} />
        ) : (
          <ChatInterface
            userId={selectedUserId}
            onLogout={() => setSelectedUserId(null)}
          />
        )}
      </div>
    </main>
  );
}
