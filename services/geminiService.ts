import { GoogleGenAI } from "@google/genai";
import { Resume, ChatMessage } from "../types";

// Safely access process.env to prevent crashes in browser environments
const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.API_KEY || '';
  }
  return '';
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

// Helper to extract clean base64 and mimeType
const parseDataUrl = (dataUrl: string) => {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (matches) {
    return { mimeType: matches[1], data: matches[2] };
  }
  // Fallback if already stripped or malformed, default to jpeg but return raw
  // This handles cases where the input might just be the base64 string
  return { mimeType: 'image/jpeg', data: dataUrl.replace(/^data:image\/\w+;base64,/, "") };
};

export const generateCoverLetter = async (
  jobRole: string,
  company: string,
  userSkills: string,
  jobDescription?: string
): Promise<string> => {
  if (!apiKey) return "Error: API Key is missing. Please check your configuration.";

  try {
    const prompt = `Write a passionate and professional cover letter for the role of ${jobRole} at ${company}. 
    My key skills are: ${userSkills}. 
    ${jobDescription ? `Here is the job description for context: ${jobDescription}` : ''}
    Keep it concise (under 300 words), engaging, and persuasive. Format it ready to copy-paste.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Failed to generate cover letter.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "An error occurred while generating the cover letter. Please try again.";
  }
};

export const generateInterviewGuide = async (
  jobRole: string,
  company: string,
  description: string
): Promise<string> => {
  if (!apiKey) return "Error: API Key is missing.";

  try {
    const prompt = `
      Act as a world-class technical career coach. Create a STRATEGIC INTERVIEW PREP GUIDE for the role of ${jobRole} at ${company}.
      
      Context from Job Description:
      "${description ? description.substring(0, 2000) : 'No description provided.'}"

      Produce the output in clean, structured Markdown. Use standard headings (##, ###) and lists.
      
      Structure the response exactly like this:

      ## 🧠 Mental Model & Core Focus
      A brief 2-sentence summary of the "persona" the candidate should adopt for this specific role (e.g., "The Proactive Problem Solver").

      ## ⚡ Key Technical Refreshers
      Identify 3-4 specific concepts or technologies from the JD that are critical.
      *   **Concept Name**: One sentence refresher or key talking point.

      ## ❓ Top Anticipated Questions
      Provide 3 high-probability questions (mix of technical and behavioral).
      
      ### Q1: [Question text]
      *   **Why they ask**: [Brief reason]
      *   **Key points to hit**: [Bullet points]

      ### Q2: [Question text]
      *   **Why they ask**: [Brief reason]
      *   **Key points to hit**: [Bullet points]

      ### Q3: [Question text]
      *   **Why they ask**: [Brief reason]
      *   **Key points to hit**: [Bullet points]

      ## 🚀 "Power" Questions to Ask Them
      List 3 questions the candidate should ask the interviewer to show deep insight.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Failed to generate interview guide.";
  } catch (error) {
    console.error("Gemini Interview Guide Error:", error);
    return "An error occurred while creating the interview guide.";
  }
};

export const generateNegotiationStrategy = async (
  jobRole: string,
  company: string,
  salary: string,
  description: string
): Promise<string> => {
  if (!apiKey) return "Error: API Key is missing.";

  try {
    const prompt = `
      Act as a high-stakes salary negotiation coach. I have an offer for ${jobRole} at ${company}.
      Salary/Package offered: ${salary}
      
      Job Context:
      "${description ? description.substring(0, 1000) : 'No description provided.'}"
      
      Provide a strategic plan in Markdown. Use clear headings.

      ## 📊 Market Analysis
      *   **Role Value**: Estimate the market perception of this role.
      *   **Leverage Points**: List 2 specific items from the JD or role type that give the candidate bargaining power.

      ## 💬 The Negotiation Script
      Write a specific script for the "Ask".
      > "[Insert polite but firm script here...]"

      ## 🎁 Plan B: The Perks
      If base salary is capped, list 3 specific non-monetary terms to ask for (e.g., Sign-on, Equity, Remote days).

      ## ⛔ What NOT to Say
      *   [Avoid saying this]
      *   [Avoid saying this]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Failed to generate negotiation strategy.";
  } catch (error) {
    console.error("Gemini Negotiation Error:", error);
    return "An error occurred while analyzing the offer.";
  }
};

export const enhanceResumeText = async (
  text: string,
  type: 'summary' | 'experience' | 'project'
): Promise<string> => {
  if (!apiKey) return "Error: API Key is missing.";
  
  if (!text) return "";

  try {
    let prompt = "";
    
    if (type === 'summary') {
      prompt = `Rewrite the following professional summary to be more impactful, concise, and professional: "${text}"`;
    } else if (type === 'project') {
       prompt = `Rewrite the following project description to highlight technical challenges, specific technologies used, and outcomes. Keep it concise: "${text}"`;
    } else {
      prompt = `Rewrite the following job experience description to use strong action verbs, quantify results where possible, and improve clarity. Keep it in bullet points if applicable: "${text}"`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return text; // Return original text if error
  }
};

export const enhanceFullResume = async (currentResume: Resume): Promise<Resume> => {
  if (!apiKey) throw new Error("API Key is missing.");

  try {
    // SECURITY/PERFORMANCE: Explicitly construct a clean payload to prevent sending large binary data or extra properties.
    // This fixes issues where 'avatarImage' or other large fields cause INVALID_ARGUMENT errors.
    const cleanResume = {
        fullName: currentResume.fullName || "",
        email: currentResume.email || "",
        phone: currentResume.phone || "",
        linkedin: currentResume.linkedin || "",
        location: currentResume.location || "",
        summary: currentResume.summary || "",
        skills: currentResume.skills || "",
        jobTitle: currentResume.jobTitle || "",
        experience: (currentResume.experience || []).map(e => ({
            id: e.id,
            role: e.role,
            company: e.company,
            startDate: e.startDate,
            endDate: e.endDate,
            description: e.description
        })),
        projects: (currentResume.projects || []).map(p => ({
            id: p.id,
            name: p.name,
            technologies: p.technologies,
            link: p.link,
            description: p.description
        })),
        education: (currentResume.education || []).map(e => ({
            id: e.id,
            degree: e.degree,
            school: e.school,
            year: e.year
        }))
    };

    const prompt = `
    Act as a world-class executive resume writer. 
    Rewrite the content of the provided resume JSON to be highly professional, impactful, and ATS-friendly.
    
    Specific Instructions:
    1. **Summary**: Create a compelling, results-oriented professional narrative.
    2. **Experience**: Convert descriptions/bullets into "Action Verb + Task + Result" format. Use strong verbs (e.g. Orchestrated, Engineered, Optimized). Quantify achievements where possible.
    3. **Projects**: Emphasize technical challenges, specific stack details, and business outcomes.
    4. **Skills**: Ensure list is comma-separated, professional, and relevant.
    5. **Personal Details**: Keep Name, Email, Phone, Links, Location EXACTLY as is.
    6. **Structure**: Keep the exact same JSON structure. **PRESERVE ALL 'id' fields exactly.**
    
    Resume JSON:
    ${JSON.stringify(cleanResume)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");

    // Clean potential markdown wrapping even with JSON mode
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Gemini Full Enhancement Error:", error);
    throw error;
  }
};

export const generateAvatar = async (
  imageBase64: string,
  stylePrompt: string
): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing.");

  try {
    const { mimeType, data } = parseDataUrl(imageBase64);
    
    const prompt = `Transform this portrait into a high-quality professional corporate headshot.
    Style requirements: ${stylePrompt}. 
    Maintain the person's identity and facial features, but improve the lighting to be studio quality, ensure neutral professional background, and attire to be strictly professional business wear. 
    Output ONLY the image.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: data,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image generated by the model.");
  } catch (error) {
    console.error("Gemini Avatar Error:", error);
    throw error;
  }
};

export const parseResumeFromImage = async (imageBase64: string): Promise<Partial<Resume>> => {
  if (!apiKey) throw new Error("API Key is missing.");

  try {
    const { mimeType, data } = parseDataUrl(imageBase64);
    
    const prompt = `Analyze this resume image. Extract structured data into JSON matching the following schema. 
    Improve wording to be action-oriented where possible.
    
    Schema:
    {
      "fullName": "string",
      "email": "string",
      "phone": "string",
      "linkedin": "string",
      "location": "string",
      "summary": "string",
      "skills": "string (comma separated)",
      "experience": [ { "role": "string", "company": "string", "startDate": "string", "endDate": "string", "description": "string" } ],
      "projects": [ { "name": "string", "technologies": "string", "link": "string", "description": "string" } ],
      "education": [ { "degree": "string", "school": "string", "year": "string" } ]
    }
    
    Return ONLY the raw JSON string, no markdown formatting.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
             inlineData: {
               data: data,
               mimeType: mimeType,
             }
          },
          { text: prompt }
        ]
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from model");

    // Clean markdown if present
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);

  } catch (error) {
    console.error("Gemini Parse Resume Error:", error);
    throw error;
  }
};

export const chatWithChatur = async (
  history: ChatMessage[], 
  userMessage: string,
  contextData: any
): Promise<string> => {
  if (!apiKey) return "I'm having trouble connecting to my brain right now. Please check your API key.";

  try {
    const systemInstruction = `You are Chatur, a friendly, empathetic, and intelligent career coach. 
    Your goal is to help the user get a job.
    
    Current User Context:
    - Application Stats: ${JSON.stringify(contextData.stats)}
    - Recent Applications: ${JSON.stringify(contextData.recentJobs)}
    
    Guidance Logic:
    - If their interview rate (interviews/applied) is < 10%, suggest resume tweaks or skill building.
    - If they have a new 'Interview' status, offer to roleplay interview questions.
    - If they have an 'Offer', congratulate them and offer negotiation advice.
    - Keep responses concise, encouraging, and actionable.
    `;

    // Convert history to API format
    const contents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "I didn't catch that. Could you say it again?";
  } catch (error) {
    console.error("Chatur Error:", error);
    return "I'm feeling a bit overwhelmed. Let's try again in a moment.";
  }
};