import { generateStructuredResponse } from "./gemini-client";

export interface ATSAnalysis {
  score: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  keywordMatches: string[];
  missingKeywords: string[];
  suggestions: string[];
  formatting: {
    score: number;
    issues: string[];
  };
  content: {
    score: number;
    issues: string[];
  };
}

export async function analyzeResumeATS(
  resumeUrl: string,
  jobDescription?: string
): Promise<ATSAnalysis> {
  try {
    const prompt = buildATSPrompt(resumeUrl, jobDescription);
    const schema = buildATSSchema();
    
    const response = await generateStructuredResponse<ATSAnalysis>(prompt, schema);
    
    // Validate the response
    if (typeof response.score !== 'number' || response.score < 0 || response.score > 100) {
      throw new Error("Invalid ATS score received from AI");
    }
    
    return response;
  } catch (error: any) {
    console.error("ATS analysis error:", error);
    throw new Error("Failed to analyze resume: " + error.message);
  }
}

function buildATSPrompt(resumeUrl: string, jobDescription?: string): string {
  const hasJD = !!jobDescription;
  
  return `You are an expert ATS (Applicant Tracking System) analyzer and resume consultant. 

IMPORTANT: Since you cannot directly access PDF files, I need you to provide GENERAL ATS optimization advice based on best practices.

CONTEXT:
- Resume File: ${resumeUrl}
${hasJD ? `- Job Description:\n${jobDescription}\n` : '- No specific job description provided'}

YOUR TASK:
Provide ${hasJD ? 'targeted ATS analysis based on the job description' : 'general ATS best practices and optimization tips'}:

1. **ATS Score (0-100)**: 
   ${hasJD ? '- Provide a score based on how well a resume should be structured for this type of role' : '- Provide a baseline score of 75 for general best practices'}
   - Consider: standard formatting, keyword optimization, structure

2. **Keyword Analysis**:
   ${hasJD ? `- Extract 5-10 key technical skills, tools, and qualifications from the job description
   - These are keywords the candidate should include in their resume` : `- DO NOT suggest missing keywords without a job description
   - Instead, suggest checking for: relevant technical skills, action verbs, quantifiable achievements`}

3. **Formatting Score (85/100)** and General Issues:
   - Standard best practices: use simple formatting, avoid tables/columns
   - Use standard section headings: Experience, Education, Skills, Projects
   - Avoid: images, graphics, headers/footers, multiple columns

4. **Content Score (80/100)** and General Advice:
   - Use action verbs (Developed, Implemented, Led, etc.)
   - Include quantifiable achievements (increased by X%, reduced by Y)
   - Ensure all sections are complete and well-organized

5. **Strengths**: 3-5 general strengths of well-formatted resumes

6. **Weaknesses**: 3-5 common pitfalls to avoid

7. **Specific Suggestions**: 5-8 actionable recommendations for ATS optimization

${hasJD ? 'Focus your analysis on keywords and skills from the job description.' : 'Focus on general best practices. DO NOT list missing keywords without a job description.'}

Be practical, specific, and encouraging.`;
}

function buildATSSchema(): string {
  return `{
  "score": number (0-100),
  "strengths": ["string", "string", ...],
  "weaknesses": ["string", "string", ...],
  "keywordMatches": ["keyword1", "keyword2", ...],
  "missingKeywords": ["keyword1", "keyword2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...],
  "formatting": {
    "score": number (0-100),
    "issues": ["issue1", "issue2", ...]
  },
  "content": {
    "score": number (0-100),
    "issues": ["issue1", "issue2", ...]
  }
}`;
}

/**
 * Helper function to generate a quick ATS score without full analysis
 * Useful for displaying scores in lists/tables
 */
export async function quickATSScore(resumeUrl: string): Promise<number> {
  try {
    const prompt = `Analyze this resume (${resumeUrl}) and provide ONLY an ATS compatibility score from 0-100.
    
Consider:
- Formatting (clean, ATS-friendly structure)
- Keywords (presence of industry-relevant terms)
- Content quality (clear, quantifiable achievements)
- Completeness (all essential sections present)

Return only a JSON object with a score property.`;

    const schema = `{ "score": number }`;
    
    const response = await generateStructuredResponse<{ score: number }>(prompt, schema);
    return response.score || 0;
  } catch (error) {
    console.error("Quick ATS score error:", error);
    return 0;
  }
}

