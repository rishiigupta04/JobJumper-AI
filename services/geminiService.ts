import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Resume, ChatMessage } from "../types";

// Access process.env.API_KEY directly so Vite can replace it at build time.
// Do not wrap in 'typeof process' checks as they fail in the browser.
const getApiKey = () => {
  return process.env.API_KEY || '';
};

// Helper to extract clean base64 and mimeType
const parseDataUrl = (dataUrl: string) => {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (matches) {
    return { mimeType: matches[1], data: matches[2] };
  }
  return { mimeType: 'image/jpeg', data: dataUrl.replace(/^data:image\/\w+;base64,/, "") };
};

// Helper: Clean response but PRESERVE bold markdown (**) for highlighting
const cleanAIResponse = (text: string): string => {
  if (!text) return "";
  
  // Remove conversational prefixes that Gemini sometimes adds
  let cleaned = text.replace(/^(Here is|Sure,|I have rewritten|The improved version|Here's the|Below is).*?:/i, "").trim();

  // Remove Markdown italics only (*text* or _text_), PRESERVE BOLD (**text**)
  cleaned = cleaned
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, "$1") // Remove single * italics
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1");

  // Normalize bullet points: convert '*' or '-' at start of lines to '•'
  cleaned = cleaned.replace(/^\s*[\-\*]\s/gm, "• ");
  
  return cleaned.trim();
};

// Recursive helper to clean strings in an object
const traverseAndClean = (obj: any): any => {
  if (typeof obj === 'string') return cleanAIResponse(obj);
  if (Array.isArray(obj)) return obj.map(traverseAndClean);
  if (typeof obj === 'object' && obj !== null) {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = traverseAndClean(obj[key]);
    }
    return newObj;
  }
  return obj;
};

// Helper to normalize resume JSON (specifically converting array descriptions to strings)
const normalizeResumeJSON = (data: any): any => {
  const normalizeDescription = (desc: any) => {
    if (Array.isArray(desc)) {
      // If description is an array, join it with newlines and ensure bullets
      return desc.map(line => String(line).trim().startsWith('•') ? line : `• ${line}`).join('\n');
    }
    return desc;
  };

  if (data.experience && Array.isArray(data.experience)) {
    data.experience.forEach((exp: any) => {
       if (exp.description) exp.description = normalizeDescription(exp.description);
    });
  }
  if (data.projects && Array.isArray(data.projects)) {
    data.projects.forEach((proj: any) => {
       if (proj.description) proj.description = normalizeDescription(proj.description);
    });
  }
  return data;
};

export interface ResumeScore {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

export const scoreResume = async (resume: Resume, jobDescription: string): Promise<ResumeScore> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });

  try {
    const prompt = `
    Act as a strict Technical Recruiter and Hiring Manager. 
    Rigorously score the provided Resume against the Job Description (JD).

    Job Description:
    "${jobDescription.substring(0, 3000)}"

    Resume:
    ${JSON.stringify(resume)}

    Analysis Requirements:
    1. **Score**: 0-100 based on keyword matching, experience level, and skills alignment. Be realistic (e.g., if key skills are missing, score lower).
    2. **Summary**: One punchy sentence summarizing the match.
    3. **Strengths**: Top 3 matching skills/experiences.
    4. **Gaps**: Top 3 missing requirements or weak points.
    5. **Recommendations**: 2-3 specific, actionable tweaks to improve the score.
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        summary: { type: Type.STRING },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["score", "summary", "strengths", "gaps", "recommendations"],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");

    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText) as ResumeScore;

  } catch (error) {
    console.error("Gemini Score Resume Error:", error);
    throw error;
  }
};

export const generateCoverLetter = async (
  jobRole: string,
  company: string,
  userSkills: string,
  jobDescription?: string
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "Error: API Key is missing. Please check your configuration.";
  const ai = new GoogleGenAI({ apiKey });

  try {
    const prompt = `Write a passionate and professional cover letter for the role of ${jobRole} at ${company}. 
    My key skills are: ${userSkills}. 
    ${jobDescription ? `Here is the job description for context: ${jobDescription}` : ''}
    Keep it concise (under 300 words), engaging, and persuasive. Format it ready to copy-paste.
    Return ONLY the cover letter text. Do not include headers like "Subject:" or placeholders unless necessary.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return cleanAIResponse(response.text || "Failed to generate cover letter.");
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
  const apiKey = getApiKey();
  if (!apiKey) return "Error: API Key is missing.";
  const ai = new GoogleGenAI({ apiKey });

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
  const apiKey = getApiKey();
  if (!apiKey) return "Error: API Key is missing.";
  const ai = new GoogleGenAI({ apiKey });

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
  const apiKey = getApiKey();
  if (!apiKey) return "Error: API Key is missing.";
  const ai = new GoogleGenAI({ apiKey });
  
  if (!text) return "";

  try {
    let specificInstruction = "";
    if (type === 'summary') {
      specificInstruction = "Rewrite this professional summary to be more impactful, concise, and results-oriented. Highlight 3-4 key hard skills or achievements using **bold** markdown.";
    } else if (type === 'project') {
      specificInstruction = "Rewrite this project description to be exactly 2-3 bullet points. Each bullet should be detailed (2-3 lines). Highlight the 1-2 most important technologies or results in each bullet using **bold** markdown.";
    } else {
      specificInstruction = "Rewrite this experience description to be exactly 2-3 bullet points. Each bullet should be detailed (2-3 lines) using strong action verbs. Highlight the 1-2 most important metrics or skills in each bullet using **bold** markdown.";
    }

    const prompt = `
      ${specificInstruction}
      
      Original Text:
      "${text}"
      
      STRICT OUTPUT RULES:
      1. Return ONLY the rewritten text. 
      2. Use **bold** syntax for important keywords (e.g. **React**, **increased revenue by 20%**).
      3. Do NOT include any intro like "Here is the rewritten text:".
      4. Use standard bullet points (•) if a list is needed.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return cleanAIResponse(response.text || text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return text;
  }
};

export const enhanceFullResume = async (currentResume: Resume): Promise<Resume> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });

  try {
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
            year: e.year,
            grade: e.grade
        }))
    };

    const prompt = `
    Act as a world-class executive resume writer. 
    Rewrite the content of the provided resume JSON to be highly professional, impactful, and ATS-friendly.
    
    Specific Instructions:
    1. **Summary**: Create a compelling narrative. Highlight 3-4 top skills using **bold**.
    2. **Experience**: Convert descriptions into exactly 2-3 bullet points per role. Each bullet should be detailed (2-3 lines). Highlight key metrics and tools using **bold**.
    3. **Projects**: Exactly 2-3 bullet points per project. Highlight tech stack and results using **bold**.
    4. **Skills**: Format skills with vertical bars (|) separator.
    5. **Formatting**: Use **bold** markdown syntax for important keywords. Do NOT use italics.
    6. **Structure**: Keep the exact same JSON structure. **PRESERVE ALL 'id' fields exactly.**
    7. **Cleanliness**: Do not add conversational text. Return only the JSON.
    
    Resume JSON:
    ${JSON.stringify(cleanResume)}
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        fullName: { type: Type.STRING },
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
        linkedin: { type: Type.STRING },
        location: { type: Type.STRING },
        summary: { type: Type.STRING },
        skills: { type: Type.STRING },
        jobTitle: { type: Type.STRING },
        experience: { 
          type: Type.ARRAY, 
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              role: { type: Type.STRING },
              company: { type: Type.STRING },
              startDate: { type: Type.STRING },
              endDate: { type: Type.STRING },
              description: { type: Type.STRING }
            }
          }
        },
        projects: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              technologies: { type: Type.STRING },
              link: { type: Type.STRING },
              description: { type: Type.STRING }
            }
          }
        },
        education: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              degree: { type: Type.STRING },
              school: { type: Type.STRING },
              year: { type: Type.STRING },
              grade: { type: Type.STRING }
            }
          }
        }
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");

    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);

    // Clean text and normalize structure (e.g. array descriptions to string)
    const cleaned = traverseAndClean(parsed);
    return normalizeResumeJSON(cleaned);

  } catch (error) {
    console.error("Gemini Full Enhancement Error:", error);
    throw error;
  }
};

export const tailorResume = async (currentResume: Resume, jobDescription: string): Promise<Resume> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });

  try {
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
            year: e.year,
            grade: e.grade
        }))
    };

    const prompt = `
    Act as an expert ATS (Applicant Tracking System) optimizer.
    Tailor this Resume JSON to match the provided Job Description (JD).
    
    Job Description:
    "${jobDescription.substring(0, 4000)}"

    Instructions:
    1. **Analyze JD**: Identify 5-7 critical keywords from the JD.
    2. **Rewrite Content**: Optimize 'summary', 'experience', and 'projects'.
    3. **Highlighting**: **Bold** the 5-7 critical JD keywords wherever they appear in the new text to show alignment.
    4. **Detail**: Ensure 'experience' and 'projects' descriptions have exactly 2-3 detailed bullet points.
    5. **Skills**: Format skills with vertical bars (|).
    6. **Structure**: Return the EXACT same JSON structure. Preserve IDs.
    
    Resume JSON:
    ${JSON.stringify(cleanResume)}
    `;

    // Reuse similar schema as enhanceFullResume
    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        fullName: { type: Type.STRING },
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
        linkedin: { type: Type.STRING },
        location: { type: Type.STRING },
        summary: { type: Type.STRING },
        skills: { type: Type.STRING },
        jobTitle: { type: Type.STRING },
        experience: { 
          type: Type.ARRAY, 
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              role: { type: Type.STRING },
              company: { type: Type.STRING },
              startDate: { type: Type.STRING },
              endDate: { type: Type.STRING },
              description: { type: Type.STRING }
            }
          }
        },
        projects: {
          type: Type.ARRAY, 
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              technologies: { type: Type.STRING },
              link: { type: Type.STRING },
              description: { type: Type.STRING }
            }
          }
        },
        education: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              degree: { type: Type.STRING },
              school: { type: Type.STRING },
              year: { type: Type.STRING },
              grade: { type: Type.STRING }
            }
          }
        }
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");

    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);

    // Clean text and normalize structure
    const cleaned = traverseAndClean(parsed);
    return normalizeResumeJSON(cleaned);
  } catch (error) {
    console.error("Gemini Tailor Resume Error:", error);
    throw error;
  }
};

export const generateAvatar = async (
  imageBase64: string,
  stylePrompt: string
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });

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
      // Note: Do NOT set responseMimeType or responseSchema for image generation models
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

export const parseResumeFromDocument = async (fileBase64: string): Promise<Partial<Resume>> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });

  try {
    const { mimeType, data } = parseDataUrl(fileBase64);
    
    const prompt = `Analyze this resume document. Extract structured data into JSON matching the schema below.
    
    FORMATTING RULES:
    1. **Skills**: Must be a single string with skills separated by vertical bars (|). Example: "React | Node.js | TypeScript".
    2. **Descriptions** (Experience & Projects): Must be a string with bullet points. Use "• " for each bullet. 
       Example: "• Developed X.\n• Achieved Y."
    3. **General**: Plain text only. No markdown formatting in values (no bold, no italics).
    
    Return ONLY the raw JSON string.`;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        fullName: { type: Type.STRING },
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
        linkedin: { type: Type.STRING },
        location: { type: Type.STRING },
        summary: { type: Type.STRING },
        skills: { type: Type.STRING },
        experience: { 
          type: Type.ARRAY, 
          items: {
            type: Type.OBJECT,
            properties: {
              role: { type: Type.STRING },
              company: { type: Type.STRING },
              startDate: { type: Type.STRING },
              endDate: { type: Type.STRING },
              description: { type: Type.STRING }
            }
          }
        },
        projects: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              technologies: { type: Type.STRING },
              link: { type: Type.STRING },
              description: { type: Type.STRING }
            }
          }
        },
        education: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              degree: { type: Type.STRING },
              school: { type: Type.STRING },
              year: { type: Type.STRING },
              grade: { type: Type.STRING }
            }
          }
        }
      }
    };

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
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from model");

    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    
    // Clean text and normalize structure
    const cleaned = traverseAndClean(parsed);
    return normalizeResumeJSON(cleaned);

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
  const apiKey = getApiKey();
  if (!apiKey) return "I'm having trouble connecting to my brain right now. Please check your API key.";
  const ai = new GoogleGenAI({ apiKey });

  try {
    const systemInstruction = `You are Chatur, an expert AI Career Coach embedded in the application "JobJumper AI".
    
    Current Date: ${contextData.currentDate}
    
    USER PROFILE:
    Name: ${contextData.userProfile.name}
    Target Role: ${contextData.userProfile.title}
    Skills: ${contextData.userProfile.skills}
    Summary: ${contextData.userProfile.summary}
    Experience: ${JSON.stringify(contextData.userProfile.experience)}
    Projects: ${JSON.stringify(contextData.userProfile.projects)}
    Education: ${JSON.stringify(contextData.userProfile.education)}
    
    APPLICATION DATA:
    Total Applications: ${contextData.stats.total}
    Interviews Pending: ${contextData.stats.interview}
    Offers: ${contextData.stats.offer}

    ========================================
    ACTIVE OFFERS & NEGOTIATIONS (HIGH PRIORITY)
    ========================================
    ${JSON.stringify(contextData.offers)}
    
    JOB LIST (All Applications):
    ${JSON.stringify(contextData.jobs)}
    
    YOUR MISSION:
    1. Help the user land a job by providing strategic advice, interview prep, and motivation.
    2. Review the user's resume content (Experience, Projects) provided above to give specific feedback if asked.

    STRICT CONTEXT RULES (DO NOT VIOLATE):
    - **Differentiation**: The user has multiple applications (e.g., Google, Netflix, Amazon). When the user asks a question, determine exactly which company they are referring to. 
    - **Ambiguity Check**: If the user asks "How is *the* interview prep going?" or "What should I ask *them*?" and has multiple upcoming interviews, YOU MUST ASK: "Which company are you referring to? [Company A] or [Company B]?" Do NOT guess.
    - **Data Isolation**: Never mix data. Do not use the negotiation strategy for Netflix when talking about the Google interview. Do not mention Amazon's salary when analyzing OpenAI's job description.
    - **Active Offers**: If the user asks about an offer, look specifically at the 'ACTIVE OFFERS' section. Use the 'negotiationStrategy' and 'salary' fields provided there.
    - **Data Fidelity**: Do not hallucinate job details. Only use the provided JSON data. If information (like salary) is missing, ask the user for it.
    
    TONE:
    - Professional, encouraging, and highly specific.
    - Concise and actionable.
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

// --- AGENT MODE FUNCTIONS ---

export interface AnalyzerResult {
  keyInfo: {
    company: string;
    role: string;
    location: string;
    salary: string;
    experience: string;
    workMode: string;
  };
  skills: {
    technical: { name: string; status: 'matched' | 'missing' }[];
    soft: string[];
    niceToHave: string[];
  };
  matchAnalysis: {
    overallScore: number;
    technicalMatch: { score: number; reason: string };
    experienceMatch: { score: number; reason: string };
    roleMatch: { score: number; reason: string };
  };
  redFlags: string[];
  competitiveAnalysis: {
    level: string; // 'Low' | 'Medium' | 'High'
    poolSize: string;
    differentiators: string[];
  };
  recommendation: {
    status: string; // 'Strong Apply' | 'Conditional Apply' | 'Skip'
    reason: string;
  };
}

export const runAgentAnalyzer = async (jobDescription: string, resume: Resume): Promise<AnalyzerResult> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are an expert technical recruiter and job market analyst. Compare the provided Candidate Resume against the Job Description (JD).

    CANDIDATE RESUME JSON:
    ${JSON.stringify(resume)}

    JOB DESCRIPTION:
    ${jobDescription.substring(0, 5000)}

    Analyze the job description and candidate fit deeply. Return a strictly structured JSON response.

    GUIDELINES:
    1. **Key Info Extraction**: Extract explicit details from the JD. If not mentioned, use "Not specified".
    2. **Skill Matching**: 
       - List all technical skills mentioned in the JD.
       - For EACH skill, check if it is present in the Candidate Resume JSON (look in 'skills', 'experience', 'projects', 'summary').
       - If present: status = 'matched'
       - If missing: status = 'missing'
    3. **Scoring**:
       - Overall: Weighted average (Tech 50%, Exp 30%, Role 20%).
       - Tech Match: Hard skills overlap.
       - Exp Match: Years of experience & seniority alignment.
       - Role Match: Industry/Domain relevance.
    4. **Red Flags**: Look for "unicorn" requirements, vague terms, or bad WLB indicators.
    5. **Competitive Analysis**: Estimate how hard it is to get this role based on market trends.
    6. **Recommendation**: Be decisive. 
       - "Strong Apply" if score > 80.
       - "Conditional Apply" if score 50-79.
       - "Skip" if score < 50 or major red flags.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      keyInfo: {
        type: Type.OBJECT,
        properties: {
          company: { type: Type.STRING },
          role: { type: Type.STRING },
          location: { type: Type.STRING },
          salary: { type: Type.STRING },
          experience: { type: Type.STRING },
          workMode: { type: Type.STRING }
        },
        required: ["company", "role", "location", "salary", "experience", "workMode"]
      },
      skills: {
        type: Type.OBJECT,
        properties: {
          technical: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                status: { type: Type.STRING, enum: ['matched', 'missing'] }
              },
              required: ['name', 'status']
            } 
          },
          soft: { type: Type.ARRAY, items: { type: Type.STRING } },
          niceToHave: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["technical", "soft", "niceToHave"]
      },
      matchAnalysis: {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.NUMBER },
          technicalMatch: { 
            type: Type.OBJECT, 
            properties: {
              score: { type: Type.NUMBER },
              reason: { type: Type.STRING }
            },
            required: ["score", "reason"]
          },
          experienceMatch: { 
            type: Type.OBJECT, 
            properties: {
              score: { type: Type.NUMBER },
              reason: { type: Type.STRING }
            },
            required: ["score", "reason"]
          },
          roleMatch: { 
            type: Type.OBJECT, 
            properties: {
              score: { type: Type.NUMBER },
              reason: { type: Type.STRING }
            },
            required: ["score", "reason"]
          }
        },
        required: ["overallScore", "technicalMatch", "experienceMatch", "roleMatch"]
      },
      redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
      competitiveAnalysis: {
        type: Type.OBJECT,
        properties: {
          level: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
          poolSize: { type: Type.STRING },
          differentiators: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["level", "poolSize", "differentiators"]
      },
      recommendation: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING, enum: ["Strong Apply", "Conditional Apply", "Skip"] },
          reason: { type: Type.STRING }
        },
        required: ["status", "reason"]
      }
    },
    required: ["keyInfo", "skills", "matchAnalysis", "redFlags", "competitiveAnalysis", "recommendation"]
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { 
      responseMimeType: 'application/json',
      responseSchema: schema
    }
  });

  const text = response.text || "{}";
  const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanText) as AnalyzerResult;
};

export const runAgentInterviewPrep = async (company: string, role: string, jd: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are an expert interview coach. Create a comprehensive interview preparation kit for this role:
    Company: ${company}
    Role: ${role}
    Job Description: ${jd.substring(0, 3000)}
    Provide:

    Company Research Brief (2-3 paragraphs):

    Recent news or developments
    Company culture and values
    Known interview style


    Technical Interview Questions (10-15 questions):

    Role-specific technical questions likely to be asked
    For each question, provide a brief hint on how to approach it


    Behavioral Interview Questions (5-8 questions):

    Common behavioral questions for this role
    For each, provide a STAR method framework answer template


    Smart Questions to Ask (5 questions):

    Thoughtful questions the candidate should ask the interviewer
    Questions that show research and genuine interest

    Keep answers concise and actionable.

    Provide output in MARKDOWN format with these exact Level 1 headers:

    # Company Research Brief
    # Technical Interview Questions
    # Behavioral Interview Questions
    # Smart Questions to Ask
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });
  return response.text || "";
};

export const runAgentDocumentGen = async (
  type: 'Cover Letter' | 'Resume Bullets' | 'LinkedIn Message', 
  jd: string, 
  background: string
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are an expert career document writer. Generate a ${type} for this job application.
    Job Description:
    ${jd.substring(0, 3000)}
    Candidate Background:
    ${background.substring(0, 2000)}
    Instructions based on document type:
    IF Cover Letter:

    Write a compelling 3-paragraph cover letter (250-300 words)
    Paragraph 1: Hook - why you're excited about this specific role
    Paragraph 2: Proof - 2-3 relevant achievements that match their needs
    Paragraph 3: Close - call to action
    Use professional but warm tone
    Include specific keywords from the job description

    IF Resume Bullets:

    Generate 5-7 achievement-focused bullet points
    Use action verbs and quantify results where possible
    Tailor each bullet to match required skills in the job description
    Format: [Action Verb] + [What you did] + [Impact/Result]

    IF LinkedIn Message:

    Write a 2-3 sentence personalized message to a recruiter/hiring manager
    Mention specific aspect of the company/role that interests you
    Keep it under 300 characters, professional yet conversational
    Include a clear call to action (request for coffee chat/call)

    Make content specific, authentic, and ATS-friendly.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });
  return response.text || "";
};

export interface ResearchResult {
  companyName: string;
  roleTitle: string;
  summary: {
    opportunityScore: number;
    applyPriority: string;
    verdict: string;
    nextSteps: string[];
  };
  companyIntelligence: {
    overview: string;
    sizeAndStage: string;
    competitors: string[];
    financialHealth: string;
  };
  marketAnalysis: {
    recentNews: string[];
    marketPosition: string;
  };
  culture: {
    workEnvironment: string;
    engineeringCulture: string;
  };
  compensation: {
    salaryRange: string;
    breakdown: {
        fresher: string;
        mid: string;
        senior: string;
    };
    comparison: string;
    benefits: string[];
  };
  hiring: {
    process: string[];
    applicationStrategy: string;
  };
  risks: {
    level: string;
    concerns: string[];
  };
  strategy: {
    outreach: string;
    differentiators: string[];
  };
  reviews: {
    glassdoor: { rating: string; pros: string; cons: string };
    reddit: { sentiment: string; keyDiscussions: string[] };
    employeeVoices: { source: string; quote: string }[];
  };
  sources: { title: string; url: string }[];
}

export const validateResearchResult = (data: any): ResearchResult => {
  return {
    companyName: data?.companyName || "Unknown Company",
    roleTitle: data?.roleTitle || "Unknown Role",
    summary: {
      opportunityScore: data?.summary?.opportunityScore || 0,
      applyPriority: data?.summary?.applyPriority || "Low",
      verdict: data?.summary?.verdict || "No verdict provided.",
      nextSteps: data?.summary?.nextSteps || []
    },
    companyIntelligence: {
      overview: data?.companyIntelligence?.overview || "Not available.",
      sizeAndStage: data?.companyIntelligence?.sizeAndStage || "Not available.",
      competitors: data?.companyIntelligence?.competitors || [],
      financialHealth: data?.companyIntelligence?.financialHealth || "Not available."
    },
    marketAnalysis: {
      recentNews: data?.marketAnalysis?.recentNews || [],
      marketPosition: data?.marketAnalysis?.marketPosition || "Not available."
    },
    culture: {
      workEnvironment: data?.culture?.workEnvironment || "Not available.",
      engineeringCulture: data?.culture?.engineeringCulture || "Not available."
    },
    compensation: {
      salaryRange: data?.compensation?.salaryRange || "Not available",
      breakdown: {
          fresher: data?.compensation?.breakdown?.fresher || "N/A",
          mid: data?.compensation?.breakdown?.mid || "N/A",
          senior: data?.compensation?.breakdown?.senior || "N/A"
      },
      comparison: data?.compensation?.comparison || "",
      benefits: data?.compensation?.benefits || []
    },
    hiring: {
      process: data?.hiring?.process || [],
      applicationStrategy: data?.hiring?.applicationStrategy || ""
    },
    risks: {
      level: data?.risks?.level || "Medium",
      concerns: data?.risks?.concerns || []
    },
    strategy: {
      outreach: data?.strategy?.outreach || "",
      differentiators: data?.strategy?.differentiators || []
    },
    reviews: {
      glassdoor: {
        rating: data?.reviews?.glassdoor?.rating || "N/A",
        pros: data?.reviews?.glassdoor?.pros || "",
        cons: data?.reviews?.glassdoor?.cons || ""
      },
      reddit: {
        sentiment: data?.reviews?.reddit?.sentiment || "Neutral",
        keyDiscussions: data?.reviews?.reddit?.keyDiscussions || []
      },
      employeeVoices: data?.reviews?.employeeVoices || []
    },
    sources: data?.sources || []
  };
};

export const runAgentResearch = async (company: string, role: string): Promise<ResearchResult> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are an autonomous research agent specializing in Indian and Global job market intelligence. 
    Conduct multi-step research on this opportunity using Google Search and provide a detailed actionable report in JSON format.

    Target Company: ${company}
    Target Role: ${role}

    SEARCH STRATEGY:
    1. Use Google Search to find real-time data.
    2. Specifically look for **Glassdoor reviews for ${company} in India** (or global if India not available).
    3. Look for **Reddit threads** on r/developersIndia, r/csMajors, or r/jobs about ${company} work culture.
    4. Find **salary data** on Levels.fyi, AmbitionBox, or Glassdoor for India (INR). 
    5. SPECIFICALLY look for data for Freshers (0-1 yoe), Mid-level (2-3 yoe), and Senior roles.
    6. Look for **Interview Questions, Candidate Experiences, and Employee Reviews**.

    Conduct systematic research and provide findings adhering to the JSON structure below.
    
    Structure the response as a valid JSON object with the following schema:
    {
      "companyName": "string",
      "roleTitle": "string",
      "summary": { "opportunityScore": number, "applyPriority": "High" | "Medium" | "Low", "verdict": "string", "nextSteps": ["string"] },
      "companyIntelligence": { "overview": "string", "sizeAndStage": "string", "competitors": ["string"], "financialHealth": "string" },
      "marketAnalysis": { "recentNews": ["string"], "marketPosition": "string" },
      "culture": { "workEnvironment": "string", "engineeringCulture": "string" },
      "compensation": { 
          "salaryRange": "string (Overall estimated range)", 
          "breakdown": {
              "fresher": "string (e.g. ₹12L - ₹18L)",
              "mid": "string (e.g. ₹20L - ₹35L)",
              "senior": "string (e.g. ₹40L+)"
          },
          "comparison": "string", 
          "benefits": ["string"] 
      },
      "hiring": { "process": ["string"], "applicationStrategy": "string" },
      "risks": { "level": "Low" | "Medium" | "High", "concerns": ["string"] },
      "strategy": { "outreach": "string", "differentiators": ["string"] },
      "reviews": {
        "glassdoor": { "rating": "string", "pros": "string", "cons": "string" },
        "reddit": { "sentiment": "string", "keyDiscussions": ["string"] },
        "employeeVoices": [{ "source": "string", "quote": "string" }]
      },
      "sources": [{ "title": "string", "url": "string" }]
    }

    IMPORTANT RULES:
    1. Return ONLY the raw JSON string. Do not include markdown code blocks or explanations.
    2. **Sources**: List exactly **top 5** most relevant URLs focused on interview questions, candidate experiences, and detailed employee reviews. Do NOT provide generic homepages.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { 
      tools: [{ googleSearch: {} }] // Enable Google Search
    }
  });

  const text = response.text || "{}";
  const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  
  try {
      const parsed = JSON.parse(cleanText);
      return validateResearchResult(parsed);
  } catch (e) {
      console.error("Failed to parse JSON from research agent", e);
      throw new Error("Failed to generate structured report. Please try again.");
  }
};