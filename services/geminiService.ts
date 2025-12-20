
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Resume, ChatMessage } from "../types";

// Access process.env.API_KEY directly
const getApiKey = () => {
  return process.env.API_KEY || '';
};

// --- DATA SANITIZATION HELPERS (Prevents React Error #31) ---

const ensureString = (val: any): string => {
  if (val === null || val === undefined) return "";
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) return val.map(item => ensureString(item)).join(' ');
  if (typeof val === 'object') {
    return val.text || val.value || val.description || JSON.stringify(val);
  }
  return String(val);
};

const ensureStringArray = (arr: any): string[] => {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => ensureString(item));
};

// Helper to extract clean base64 and mimeType
const parseDataUrl = (dataUrl: string) => {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (matches) {
    return { mimeType: matches[1], data: matches[2] };
  }
  return { mimeType: 'image/jpeg', data: dataUrl.replace(/^data:image\/\w+;base64,/, "") };
};

const truncateString = (str: string, maxLength: number) => {
  if (!str) return "";
  return str.length > maxLength ? str.substring(0, maxLength) + "...(truncated)" : str;
};

const cleanAIResponse = (text: string): string => {
  if (!text) return "";
  let cleaned = text.replace(/^(Here is|Sure,|I have rewritten|The improved version|Here's the|Below is).*?:/i, "").trim();
  cleaned = cleaned
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, "$1") 
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1");
  cleaned = cleaned.replace(/^\s*[\-\*]\s/gm, "• ");
  return cleaned.trim();
};

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

const normalizeResumeJSON = (data: any): any => {
  const normalizeDescription = (desc: any) => {
    if (Array.isArray(desc)) {
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
    const prompt = `Act as a strict Technical Recruiter. Score the Resume against the JD.\nJD: "${truncateString(jobDescription, 2000)}"\nResume: ${JSON.stringify(resume)}`;
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
      config: { responseMimeType: 'application/json', responseSchema: schema }
    });

    const parsed = JSON.parse(response.text || "{}");
    return {
      score: typeof parsed.score === 'number' ? parsed.score : 0,
      summary: ensureString(parsed.summary),
      strengths: ensureStringArray(parsed.strengths),
      gaps: ensureStringArray(parsed.gaps),
      recommendations: ensureStringArray(parsed.recommendations),
    };
  } catch (error) {
    console.error("Score Error:", error);
    throw error;
  }
};

export const generateCoverLetter = async (jobRole: string, company: string, userSkills: string, jobDescription?: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "Error: API Key is missing.";
  const ai = new GoogleGenAI({ apiKey });
  try {
    const prompt = `Write a professional cover letter for ${jobRole} at ${company}. My skills: ${userSkills}. ${jobDescription ? `JD: ${truncateString(jobDescription, 1500)}` : ''}`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return cleanAIResponse(response.text || "Failed to generate.");
  } catch (error) {
    return "An error occurred.";
  }
};

export const generateInterviewGuide = async (jobRole: string, company: string, description: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "Error: API Key is missing.";
  const ai = new GoogleGenAI({ apiKey });
  try {
    const prompt = `Create a strategic interview prep guide for ${jobRole} at ${company}.\nJD: "${truncateString(description, 2000)}"`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "Failed to generate.";
  } catch (error) {
    return "An error occurred.";
  }
};

export const generateNegotiationStrategy = async (jobRole: string, company: string, salary: string, description: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "Error: API Key is missing.";
  const ai = new GoogleGenAI({ apiKey });
  try {
    const prompt = `Create a salary negotiation strategy for ${jobRole} at ${company}. Offer: ${salary}.\nJD: "${truncateString(description, 1000)}"`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "Failed to generate.";
  } catch (error) {
    return "An error occurred.";
  }
};

export const enhanceResumeText = async (text: string, type: 'summary' | 'experience' | 'project'): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "";
  const ai = new GoogleGenAI({ apiKey });
  if (!text) return "";
  try {
    const prompt = `Rewrite this resume ${type} to be more professional: "${truncateString(text, 1000)}"`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return cleanAIResponse(response.text || text);
  } catch (error) {
    return text;
  }
};

export const enhanceFullResume = async (currentResume: Resume): Promise<Resume> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });
  try {
    const cleanInput = JSON.stringify({ ...currentResume, avatarImage: undefined });
    const prompt = `Rewrite the resume content to be professional and impactful. Return ONLY JSON.\n${cleanInput}`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' }
    });
    const parsed = JSON.parse(response.text || "{}");
    const cleaned = traverseAndClean(parsed);
    return normalizeResumeJSON(cleaned);
  } catch (error) {
    throw new Error("The resume is too long for the AI to process in one go.");
  }
};

export const tailorResume = async (currentResume: Resume, jobDescription: string): Promise<Resume> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });
  try {
    const prompt = `Tailor this resume to the JD below. Return ONLY JSON.\nResume: ${JSON.stringify({ ...currentResume, avatarImage: undefined })}\nJD: ${truncateString(jobDescription, 3000)}`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' }
    });
    const parsed = JSON.parse(response.text || "{}");
    const cleaned = traverseAndClean(parsed);
    return normalizeResumeJSON(cleaned);
  } catch (error) {
    throw new Error("The tailored resume was too large to process.");
  }
};

export const generateAvatar = async (imageBase64: string, stylePrompt: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });
  try {
    const { mimeType, data } = parseDataUrl(imageBase64);
    const prompt = `Transform this portrait into a high-quality professional corporate headshot. Style: ${stylePrompt}.`;
    
    // Using gemini-3-pro-image-preview to avoid quota issues on the flash-image model and for better quality.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ inlineData: { data: data, mimeType: mimeType } }, { text: prompt }] },
      config: {
        imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
        }
      }
    });
    
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("AI returned a response, but no image data was found.");
  } catch (error: any) {
    console.error("Gemini Avatar Error:", error);
    if (error.status === 429 || (error.message && error.message.includes('429')) || (error.message && error.message.includes('Quota exceeded'))) {
        throw new Error("Daily image generation quota exceeded for this model. Please try again later.");
    }
    if (error.message && error.message.includes('disconnected port')) {
        throw new Error("Network error: The image might be too large. Please try a smaller file.");
    }
    throw error;
  }
};

export const parseResumeFromDocument = async (fileBase64: string): Promise<Partial<Resume>> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });

  // Explicit schema for robust extraction
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      fullName: { type: Type.STRING },
      email: { type: Type.STRING },
      phone: { type: Type.STRING },
      linkedin: { type: Type.STRING },
      location: { type: Type.STRING },
      jobTitle: { type: Type.STRING },
      summary: { type: Type.STRING },
      skills: { type: Type.ARRAY, items: { type: Type.STRING } }, // Extract as array initially
      experience: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            role: { type: Type.STRING },
            company: { type: Type.STRING },
            startDate: { type: Type.STRING },
            endDate: { type: Type.STRING },
            description: { type: Type.STRING } // Markdown bullet points
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

  try {
    const { mimeType, data } = parseDataUrl(fileBase64);
    const prompt = `Extract data from this resume. 
    - For 'skills', list them as an array.
    - For 'description' fields in experience and projects, maintain bullet points if present.
    - Infer 'jobTitle' if not explicitly stated (e.g. current role).
    - Ensure dates are formatted nicely (e.g. "Jan 2023").`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ inlineData: { data: data, mimeType: mimeType } }, { text: prompt }] },
      config: { 
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    
    // Post-processing: Convert skills array to pipe-separated string
    if (Array.isArray(parsed.skills)) {
        parsed.skills = parsed.skills.join(' | ');
    }
    
    const cleaned = traverseAndClean(parsed);
    return normalizeResumeJSON(cleaned);
  } catch (error) {
    console.error("Resume Import Error:", error);
    throw error;
  }
};

export const chatWithChatur = async (history: ChatMessage[], userMessage: string, contextData: any): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "API key missing.";
  const ai = new GoogleGenAI({ apiKey });
  try {
    const systemInstruction = `You are Chatur, an expert AI Career Coach. Date: ${contextData.currentDate}`;
    const contents = history.map(msg => ({ role: msg.role, parts: [{ text: msg.text }] }));
    contents.push({ role: 'user', parts: [{ text: userMessage }] });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: { systemInstruction }
    });
    return response.text || "I didn't catch that.";
  } catch (error) {
    return "Error occurred.";
  }
};

// --- AGENT MODE FUNCTIONS ---

export interface AnalyzerResult {
  keyInfo: { company: string; role: string; location: string; salary: string; experience: string; workMode: string; };
  skills: { technical: { name: string; status: 'matched' | 'missing' }[]; soft: string[]; niceToHave: string[]; };
  matchAnalysis: { overallScore: number; technicalMatch: { score: number; reason: string }; experienceMatch: { score: number; reason: string }; roleMatch: { score: number; reason: string }; };
  redFlags: string[];
  competitiveAnalysis: { level: string; poolSize: string; differentiators: string[]; };
  recommendation: { status: string; reason: string; };
}

export const runAgentAnalyzer = async (jobDescription: string, resume: Resume): Promise<AnalyzerResult> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  const schemaDescription = `
  {
    "keyInfo": { 
      "company": "string", 
      "role": "string", 
      "location": "string", 
      "salary": "string", 
      "experience": "string", 
      "workMode": "string" 
    },
    "skills": { 
      "technical": [{ "name": "string", "status": "matched" | "missing" }], 
      "soft": ["string"], 
      "niceToHave": ["string"] 
    },
    "matchAnalysis": { 
      "overallScore": number, 
      "technicalMatch": { "score": number, "reason": "string" }, 
      "experienceMatch": { "score": number, "reason": "string" }, 
      "roleMatch": { "score": number, "reason": "string" } 
    },
    "redFlags": ["string"],
    "competitiveAnalysis": { 
      "level": "High/Medium/Low", 
      "poolSize": "string", 
      "differentiators": ["string"] 
    },
    "recommendation": { 
      "status": "Strong Apply" | "Conditional Apply" | "Avoid", 
      "reason": "string" 
    }
  }
  `;

  const prompt = `Analyze the fit between the Candidate Resume and the Job Description (JD).
  
  RESUME:
  ${JSON.stringify({ ...resume, avatarImage: undefined })}
  
  JOB DESCRIPTION:
  ${jobDescription.substring(0, 5000)}
  
  INSTRUCTIONS:
  1. Act as a strict Technical Recruiter.
  2. Analyze technical skills, experience alignment, and role fit.
  3. Identify any red flags or deal-breakers.
  4. Estimate the competitive landscape.
  
  OUTPUT FORMAT:
  Return a STRICT JSON object matching exactly this structure:
  ${schemaDescription}
  
  IMPORTANT: Return ONLY the raw JSON string. Do not use markdown code blocks (no \`\`\`json).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let jsonStr = response.text || "{}";
    jsonStr = jsonStr.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const start = jsonStr.indexOf('{');
    const end = jsonStr.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      jsonStr = jsonStr.substring(start, end + 1);
    }

    const parsed = JSON.parse(jsonStr);
    
    // Strict Validation
    return {
      keyInfo: {
        company: ensureString(parsed.keyInfo?.company),
        role: ensureString(parsed.keyInfo?.role),
        location: ensureString(parsed.keyInfo?.location),
        salary: ensureString(parsed.keyInfo?.salary),
        experience: ensureString(parsed.keyInfo?.experience),
        workMode: ensureString(parsed.keyInfo?.workMode),
      },
      skills: {
        technical: (parsed.skills?.technical || []).map((s: any) => ({
          name: ensureString(s.name),
          status: (s.status === 'matched' || s.status === 'missing') ? s.status : 'missing'
        })),
        soft: ensureStringArray(parsed.skills?.soft),
        niceToHave: ensureStringArray(parsed.skills?.niceToHave),
      },
      matchAnalysis: {
        overallScore: typeof parsed.matchAnalysis?.overallScore === 'number' ? parsed.matchAnalysis.overallScore : 0,
        technicalMatch: { 
          score: typeof parsed.matchAnalysis?.technicalMatch?.score === 'number' ? parsed.matchAnalysis.technicalMatch.score : 0, 
          reason: ensureString(parsed.matchAnalysis?.technicalMatch?.reason) 
        },
        experienceMatch: { 
          score: typeof parsed.matchAnalysis?.experienceMatch?.score === 'number' ? parsed.matchAnalysis.experienceMatch.score : 0, 
          reason: ensureString(parsed.matchAnalysis?.experienceMatch?.reason) 
        },
        roleMatch: { 
          score: typeof parsed.matchAnalysis?.roleMatch?.score === 'number' ? parsed.matchAnalysis.roleMatch.score : 0, 
          reason: ensureString(parsed.matchAnalysis?.roleMatch?.reason) 
        },
      },
      redFlags: ensureStringArray(parsed.redFlags),
      competitiveAnalysis: {
        level: ensureString(parsed.competitiveAnalysis?.level),
        poolSize: ensureString(parsed.competitiveAnalysis?.poolSize),
        differentiators: ensureStringArray(parsed.competitiveAnalysis?.differentiators),
      },
      recommendation: {
        status: ensureString(parsed.recommendation?.status),
        reason: ensureString(parsed.recommendation?.reason),
      }
    };
  } catch (error) {
    console.error("Analyzer Error:", error);
    throw new Error("Failed to analyze application.");
  }
};

export interface ResearchResult {
  companyName: string;
  roleTitle: string;
  summary: { opportunityScore: number; applyPriority: string; verdict: string; nextSteps: string[]; };
  companyIntelligence: { overview: string; sizeAndStage: string; competitors: string[]; financialHealth: string; };
  marketAnalysis: { recentNews: string[]; marketPosition: string; };
  culture: { workEnvironment: string; engineeringCulture: string; };
  compensation: { salaryRange: string; breakdown: { fresher: string; mid: string; senior: string; }; comparison: string; benefits: string[]; };
  hiring: { process: string[]; applicationStrategy: string; };
  risks: { level: string; concerns: string[]; };
  strategy: { outreach: string; differentiators: string[]; };
  reviews: { 
    glassdoor: { rating: string; pros: string; cons: string }; 
    reddit: { sentiment: string; keyDiscussions: string[] }; 
    employeeVoices: { source: string; quote: string; sentiment: string }[]; 
  };
  sources: { title: string; url: string }[];
}

export const validateResearchResult = (data: any): ResearchResult => {
  return {
    companyName: ensureString(data?.companyName) || "Unknown Company",
    roleTitle: ensureString(data?.roleTitle) || "Unknown Role",
    summary: {
      opportunityScore: typeof data?.summary?.opportunityScore === 'number' ? data.summary.opportunityScore : 0,
      applyPriority: ensureString(data?.summary?.applyPriority) || "Low",
      verdict: ensureString(data?.summary?.verdict) || "No verdict provided.",
      nextSteps: ensureStringArray(data?.summary?.nextSteps)
    },
    companyIntelligence: {
      overview: ensureString(data?.companyIntelligence?.overview) || "Not available.",
      sizeAndStage: ensureString(data?.companyIntelligence?.sizeAndStage) || "Not available.",
      competitors: ensureStringArray(data?.companyIntelligence?.competitors),
      financialHealth: ensureString(data?.companyIntelligence?.financialHealth) || "Not available."
    },
    marketAnalysis: {
      recentNews: ensureStringArray(data?.marketAnalysis?.recentNews),
      marketPosition: ensureString(data?.marketAnalysis?.marketPosition) || "Not available."
    },
    culture: {
      workEnvironment: ensureString(data?.culture?.workEnvironment) || "Not available.",
      engineeringCulture: ensureString(data?.culture?.engineeringCulture) || "Not available."
    },
    compensation: {
      salaryRange: ensureString(data?.compensation?.salaryRange) || "Not available",
      breakdown: {
          fresher: ensureString(data?.compensation?.breakdown?.fresher) || "N/A",
          mid: ensureString(data?.compensation?.breakdown?.mid) || "N/A",
          senior: ensureString(data?.compensation?.breakdown?.senior) || "N/A"
      },
      comparison: ensureString(data?.compensation?.comparison) || "",
      benefits: ensureStringArray(data?.compensation?.benefits)
    },
    hiring: {
      process: ensureStringArray(data?.hiring?.process),
      applicationStrategy: ensureString(data?.hiring?.applicationStrategy) || ""
    },
    risks: {
      level: ensureString(data?.risks?.level) || "Medium",
      concerns: ensureStringArray(data?.risks?.concerns)
    },
    strategy: {
      outreach: ensureString(data?.strategy?.outreach) || "",
      differentiators: ensureStringArray(data?.strategy?.differentiators)
    },
    reviews: {
      glassdoor: {
        rating: ensureString(data?.reviews?.glassdoor?.rating) || "N/A",
        pros: ensureString(data?.reviews?.glassdoor?.pros) || "",
        cons: ensureString(data?.reviews?.glassdoor?.cons) || ""
      },
      reddit: {
        sentiment: ensureString(data?.reviews?.reddit?.sentiment) || "Neutral",
        keyDiscussions: ensureStringArray(data?.reviews?.reddit?.keyDiscussions)
      },
      employeeVoices: (data?.reviews?.employeeVoices || []).slice(0, 5).map((v: any) => ({
        source: ensureString(v.source),
        quote: ensureString(v.quote),
        sentiment: ensureString(v.sentiment) || 'Neutral'
      }))
    },
    sources: (data?.sources || []).slice(0, 10).map((s: any) => ({
      title: ensureString(s.title),
      url: ensureString(s.url)
    }))
  };
};

export const runAgentResearch = async (company: string, role: string): Promise<ResearchResult> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  const schemaDescription = `
  {
    "companyName": "string",
    "roleTitle": "string",
    "summary": { "opportunityScore": number, "applyPriority": "High/Medium/Low", "verdict": "string", "nextSteps": ["string"] },
    "companyIntelligence": { "overview": "string", "sizeAndStage": "string", "competitors": ["string"], "financialHealth": "string" },
    "marketAnalysis": { "recentNews": ["string"], "marketPosition": "string" },
    "culture": { "workEnvironment": "string", "engineeringCulture": "string" },
    "compensation": { "salaryRange": "string", "breakdown": { "fresher": "string", "mid": "string", "senior": "string" }, "comparison": "string", "benefits": ["string"] },
    "hiring": { "process": ["string"], "applicationStrategy": "string" },
    "risks": { "level": "High/Medium/Low", "concerns": ["string"] },
    "strategy": { "outreach": "string", "differentiators": ["string"] },
    "reviews": { "glassdoor": { "rating": "string", "pros": "string", "cons": "string" }, "reddit": { "sentiment": "string", "keyDiscussions": ["string"] }, "employeeVoices": [{ "source": "string", "quote": "string", "sentiment": "Positive/Negative/Neutral" }] },
    "sources": [{ "title": "string", "url": "string" }]
  }
  `;

  const prompt = `Conduct deep research on "${company}" for the role of "${role}".
  Use Google Search to find real-time data about salaries, culture, interview process, and recent news.
  
  Requirements:
  1. Find exactly 10 top-tier sources (Official career page, Glassdoor, Reddit, Blind, InterviewBit, GeeksforGeeks, etc.).
  2. Include links to company details, interview questions/guides, and previous year questions.
  3. Find 5 distinct employee reviews covering different perspectives (Positive, Negative, Neutral).
  4. "opportunityScore" MUST be a number between 0 and 10 (where 10 is excellent).
  
  Return the result as a STRICT JSON object matching exactly this structure:
  ${schemaDescription}
  
  IMPORTANT: Return ONLY the raw JSON string. Do not use markdown code blocks.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        tools: [{ googleSearch: {} }] 
      }
    });

    let jsonStr = response.text || "{}";
    jsonStr = jsonStr.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const start = jsonStr.indexOf('{');
    const end = jsonStr.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      jsonStr = jsonStr.substring(start, end + 1);
    }

    const parsed = JSON.parse(jsonStr);
    return validateResearchResult(parsed);
  } catch (error: any) {
    console.error("Research Agent Error:", error);
    if (error.status === 429 || (error.message && error.message.includes('429'))) {
       throw new Error("You exceeded your daily AI quota for deep research. Please try again later.");
    }
    // Fallback for JSON parse errors or other issues
    if (error instanceof SyntaxError) {
       console.error("Invalid JSON from Agent:", error);
       // We can attempt to recover partial data or just fail
    }
    throw error;
  }
};

export interface InterviewPrepResult {
  companyResearch: {
    mission: string;
    products: string[];
    culture: string;
    recentNews: string[];
  };
  technical: {
    topics: string[];
    questions: { question: string; answer: string }[];
  };
  behavioral: {
    competencies: string[];
    questions: { question: string; starGuide: string }[];
  };
  questionsToAsk: string[];
}

export const runAgentInterviewPrep = async (company: string, role: string, jd: string): Promise<InterviewPrepResult> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  const schemaDescription = `
  {
    "companyResearch": { 
      "mission": "string", 
      "products": ["string"], 
      "culture": "string", 
      "recentNews": ["string"] 
    },
    "technical": { 
      "topics": ["string"], 
      "questions": [{ "question": "string", "answer": "string" }] 
    },
    "behavioral": { 
      "competencies": ["string"], 
      "questions": [{ "question": "string", "starGuide": "string" }] 
    },
    "questionsToAsk": ["string"]
  }`;

  const prompt = `Create a comprehensive interview preparation kit for the role of "${role}" at "${company}".
  
  JD CONTEXT:
  ${jd.substring(0, 3000)}
  
  Requirements:
  1. Infer company mission and culture if known, otherwise generate general tech standard.
  2. Generate 5-7 specific technical questions with brief answers.
  3. Generate 3 behavioral questions with STAR method guidance.
  4. Suggest 5 smart questions for the candidate to ask the interviewer.
  
  Return the result as a STRICT JSON object matching exactly this structure:
  ${schemaDescription}
  
  IMPORTANT: Return ONLY the raw JSON string. Do not use markdown code blocks.`;

  try {
    const response = await ai.models.generateContent({ 
      model: 'gemini-2.5-flash', 
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    
    let jsonStr = response.text || "{}";
    jsonStr = jsonStr.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const parsed = JSON.parse(jsonStr);
    
    // Validate and Clean
    return {
      companyResearch: {
        mission: ensureString(parsed.companyResearch?.mission),
        products: ensureStringArray(parsed.companyResearch?.products),
        culture: ensureString(parsed.companyResearch?.culture),
        recentNews: ensureStringArray(parsed.companyResearch?.recentNews)
      },
      technical: {
        topics: ensureStringArray(parsed.technical?.topics),
        questions: (parsed.technical?.questions || []).map((q: any) => ({
          question: ensureString(q.question),
          answer: ensureString(q.answer)
        }))
      },
      behavioral: {
        competencies: ensureStringArray(parsed.behavioral?.competencies),
        questions: (parsed.behavioral?.questions || []).map((q: any) => ({
          question: ensureString(q.question),
          starGuide: ensureString(q.starGuide)
        }))
      },
      questionsToAsk: ensureStringArray(parsed.questionsToAsk)
    };
  } catch (error) {
    console.error("Prep Agent Error:", error);
    // Return empty structure on error to prevent UI crash
    return {
      companyResearch: { mission: "Failed to generate.", products: [], culture: "", recentNews: [] },
      technical: { topics: [], questions: [] },
      behavioral: { competencies: [], questions: [] },
      questionsToAsk: []
    };
  }
};

export const runAgentDocumentGen = async (params: { 
  type: string; 
  template: string; 
  tone: string;
  jd: string; 
  resume: Resume;
  additionalContext?: string;
}): Promise<string> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  const systemPrompt = `You are a world-class career strategist and expert copywriter. 
  Your task is to generate a high-impact career document based on the specific template and tone provided.
  
  STRATEGIC TEMPLATES:
  - "T-Format": A document with a side-by-side comparison of "What You Need" and "How I Deliver".
  - "Pain Letter": A letter that focuses on identifying and solving a specific "pain point" the company is facing.
  - "Direct & Impactful": Standard high-quality professional document.
  - "The Referral Request": A message meant to be sent to a contact inside the company to ask for a referral.
  
  RULES:
  - Do NOT use placeholders like [Your Name]. Use the real name from the resume: ${params.resume.fullName}.
  - Use the contact info provided: Email: ${params.resume.email}, Phone: ${params.resume.phone}.
  - Maintain a ${params.tone} tone throughout.
  - Inject relevant skills from the user's profile: ${params.resume.skills}.`;

  const prompt = `Generate a ${params.type} using the "${params.template}" strategy.
  
  TARGET JOB DESCRIPTION:
  ${params.jd.substring(0, 3000)}
  
  ADDITIONAL USER CONTEXT:
  ${params.additionalContext || "None provided."}
  
  FULL RESUME DATA FOR CONTEXT:
  ${JSON.stringify({ ...params.resume, avatarImage: undefined })}
  
  Return ONLY the generated content in professional Markdown format. Do not include introductory text like "Here is your letter".`;

  const response = await ai.models.generateContent({ 
    model: 'gemini-2.5-flash', 
    contents: prompt,
    config: { systemInstruction: systemPrompt }
  });
  
  return cleanAIResponse(response.text || "");
};
