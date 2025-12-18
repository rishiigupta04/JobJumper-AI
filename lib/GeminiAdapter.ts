
import { BaseChatModel, type BaseChatModelParams } from "@langchain/core/language_models/chat_models";
import { BaseMessage, AIMessage } from "@langchain/core/messages";
import { ChatResult } from "@langchain/core/outputs";
import { GoogleGenAI } from "@google/genai";

export interface GeminiChatModelInput extends BaseChatModelParams {
  apiKey: string;
  modelName?: string;
}

/**
 * A custom LangChain ChatModel adapter for the @google/genai SDK.
 * This allows us to use LangChain's chains and prompts with the lightweight Google SDK
 * instead of importing the heavier legacy SDK.
 */
export class GeminiChatModel extends BaseChatModel {
  apiKey: string;
  modelName: string;
  client: GoogleGenAI;

  constructor(fields: GeminiChatModelInput) {
    super(fields);
    this.apiKey = fields.apiKey;
    this.modelName = fields.modelName || "gemini-3-flash-preview";
    this.client = new GoogleGenAI({ apiKey: this.apiKey });
  }

  _llmType() {
    return "google_genai_custom";
  }

  /**
   * Main generation method required by LangChain.
   * Transforms LangChain messages -> Gemini SDK Content format -> Calls API -> Returns LangChain ChatResult.
   */
  // Fixed: Use 'any' for options type to avoid "Type 'ParsedCallOptions' cannot be used to index type 'this'" error
  async _generate(messages: BaseMessage[], options: any): Promise<ChatResult> {
    const contents: any[] = [];
    let systemInstruction: string | undefined;

    for (const m of messages) {
      if (m._getType() === "system") {
        // Extract system prompt
        systemInstruction = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      } else if (m._getType() === "human") {
        // Map HumanMessage to user role
        contents.push({ role: "user", parts: [{ text: m.content as string }] });
      } else if (m._getType() === "ai") {
        // Map AIMessage to model role
        contents.push({ role: "model", parts: [{ text: m.content as string }] });
      }
    }

    try {
      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      const text = response.text || "";

      return {
        generations: [{
          text: text,
          message: new AIMessage(text),
        }],
      };
    } catch (error) {
      console.error("Gemini Adapter Error:", error);
      throw error;
    }
  }
}
