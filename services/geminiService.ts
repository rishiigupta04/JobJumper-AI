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
  if (!apiKey) throw new Error("API Key is missing.");

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
            year: e.year
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json'
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
  if (!apiKey) throw new Error("API Key is missing.");

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
            year: e.year
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json'
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
    
    const prompt = `Analyze this resume image. Extract structured data into JSON matching the schema below.
    
    FORMATTING RULES:
    1. **Skills**: Must be a single string with skills separated by vertical bars (|). Example: "React | Node.js | TypeScript".
    2. **Descriptions** (Experience & Projects): Must be a string with bullet points. Use "• " for each bullet. 
       Example: "• Developed X.\n• Achieved Y."
    3. **General**: Plain text only. No markdown formatting in values (no bold, no italics).
    
    Schema:
    {
      "fullName": "string",
      "email": "string",
      "phone": "string",
      "linkedin": "string",
      "location": "string",
      "summary": "string",
      "skills": "string",
      "experience": [ { "role": "string", "company": "string", "startDate": "string", "endDate": "string", "description": "string" } ],
      "projects": [ { "name": "string", "technologies": "string", "link": "string", "description": "string" } ],
      "education": [ { "degree": "string", "school": "string", "year": "string" } ]
    }
    
    Return ONLY the raw JSON string.`;

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
  if (!apiKey) return "I'm having trouble connecting to my brain right now. Please check your API key.";

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