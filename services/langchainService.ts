import { GeminiChatModel } from "../lib/GeminiAdapter";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatMessage } from "../types";

// Access process.env.API_KEY directly so Vite can replace it at build time.
// Do not wrap in 'typeof process' checks as they fail in the browser.
const getApiKey = () => {
  return process.env.API_KEY || '';
};

// Initialize the custom model
const model = new GeminiChatModel({ 
  apiKey: getApiKey(),
  modelName: "gemini-2.5-flash" 
});

// Define the prompt template
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are Chatur, an expert AI Career Coach embedded in the application "JobJumper AI".
    
    Current Date: {currentDate}
    
    USER PROFILE:
    Name: {userName}
    Target Role: {userTitle}
    Skills: {userSkills}
    Summary: {userSummary}
    
    APPLICATION DATA:
    Total Applications: {statTotal}
    Interviews Pending: {statInterview}
    Offers: {statOffer}

    ACTIVE OFFERS (HIGH PRIORITY):
    {offersData}
    
    JOB LIST:
    {jobsData}

    YOUR MISSION:
    1. Help the user land a job by providing strategic advice, interview prep, and motivation.
    2. Review the user's resume content provided above to give specific feedback if asked.

    STRICT CONTEXT RULES:
    - Identify which company the user is talking about. If ambiguous, ASK.
    - Use the specific data provided (salary, dates, notes). Do not hallucinate.
    - Be professional, encouraging, and concise.`
  ],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
]);

// Create the chain
const chain = prompt.pipe(model).pipe(new StringOutputParser());

export const runChaturChain = async (
  history: ChatMessage[],
  userMessage: string,
  contextData: any
): Promise<string> => {
  try {
    // Convert app's ChatMessage[] to LangChain's BaseMessage[]
    // We filter out the very last user message because we pass it explicitly as 'input'
    const langChainHistory = history.map(msg => {
      if (msg.role === 'user') return new HumanMessage(msg.text);
      return new AIMessage(msg.text);
    });

    const result = await chain.invoke({
      input: userMessage,
      history: langChainHistory,
      
      // Flatten context data for the prompt template
      currentDate: contextData.currentDate,
      userName: contextData.userProfile.name,
      userTitle: contextData.userProfile.title,
      userSkills: contextData.userProfile.skills,
      userSummary: contextData.userProfile.summary,
      statTotal: contextData.stats.total,
      statInterview: contextData.stats.interview,
      statOffer: contextData.stats.offer,
      offersData: JSON.stringify(contextData.offers),
      jobsData: JSON.stringify(contextData.jobs)
    });

    return result;
  } catch (error) {
    console.error("LangChain Error:", error);
    return "I'm having a bit of trouble connecting to my new LangChain brain. Please try again in a moment.";
  }
};