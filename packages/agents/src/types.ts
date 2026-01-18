export type AgentType = "router" | "order" | "billing" | "general";

export interface AgentResponse {
  content: string;
  agentType: AgentType;
  reasoning?: string;
  toolCalls?: ToolCall[];
  shouldTransfer?: boolean;
  transferTo?: AgentType;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
  result?: any;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  agentType?: AgentType;
  reasoning?: string;
  toolCalls?: ToolCall[];
}

export interface ConversationContext {
  userId: string;
  conversationId: string;
  messages: Message[];
  summary?: string;
}
