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
   ${hasJD ? '- Provide a realistic score based on how well a resume should be structured for this type of role' : '- Provide a realistic score based on general best practices'}
   - Consider: standard formatting, keyword optimization, structure, completeness
   - IMPORTANT: Use the FULL range (0-100) based on actual resume quality
   - Score Guidelines:
     * 0-40: Poor/Horrible - Major formatting issues, missing sections, unprofessional
     * 40-60: Below Average - Basic structure but lacking keywords, weak formatting
     * 60-75: Average - Decent structure, some optimization needed
     * 75-85: Good - Well-structured, good keywords, minor improvements needed
     * 85-95: Excellent - Highly optimized, strong keywords, professional formatting
     * 95-100: Outstanding - Perfect ATS optimization, ideal structure and content

2. **Keyword Analysis**:
   ${hasJD ? `- Extract 5-10 key technical skills, tools, and qualifications from the job description
   - These are keywords the candidate should include in their resume` : `- DO NOT suggest missing keywords without a job description
   - Instead, suggest checking for: relevant technical skills, action verbs, quantifiable achievements`}

3. **Formatting Score (0-100)** - Use full range based on quality:
   - Standard best practices: use simple formatting, avoid tables/columns
   - Use standard section headings: Experience, Education, Skills, Projects
   - Avoid: images, graphics, headers/footers, multiple columns
   - Score Guidelines:
     * 0-40: Poor - Multiple columns, graphics, ATS-incompatible format
     * 40-60: Below Average - Some formatting issues, inconsistent structure
     * 60-75: Average - Decent formatting with some issues
     * 75-85: Good - Clean, ATS-friendly with minor issues
     * 85-100: Excellent - Perfect ATS formatting, clean and professional

4. **Content Score (0-100)** - Use full range based on quality:
   - Use action verbs (Developed, Implemented, Led, etc.)
   - Include quantifiable achievements (increased by X%, reduced by Y)
   - Ensure all sections are complete and well-organized
   - Score Guidelines:
     * 0-40: Poor - Vague descriptions, no achievements, missing sections
     * 40-60: Below Average - Basic descriptions, few accomplishments
     * 60-75: Average - Decent content but lacking impact
     * 75-85: Good - Strong action verbs, some quantifiable results
     * 85-100: Excellent - Compelling content, quantified achievements throughout

5. **Strengths**: 3-5 general strengths of well-formatted resumes

6. **Weaknesses**: 3-5 common pitfalls to avoid

7. **Specific Suggestions**: 5-8 actionable recommendations for ATS optimization

${hasJD ? 'Focus your analysis on keywords and skills from the job description.' : 'Focus on general best practices. DO NOT list missing keywords without a job description.'}

CRITICAL SCORING RULES:
- Use the ENTIRE 0-100 scale based on actual quality
- Do NOT cluster all scores in 65-80 range
- A truly bad resume should score 30-50
- An average resume should score 60-75
- A good resume should score 75-85
- An excellent resume should score 85-95
- Only near-perfect resumes should score 95+
- Be honest and realistic - vary scores significantly based on quality

Be practical, specific, and encouraging in your feedback.`;

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

