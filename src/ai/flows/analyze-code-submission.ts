'use server';
/**
 * @fileOverview A comprehensive AI agent for analyzing code submissions.
 *
 * - analyzeCodeSubmission - A function that provides a detailed analysis of user-submitted code.
 * - CodeAnalysisInput - The input type for the analysis function.
 * - CodeAnalysisOutput - The return type for the analysis function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CodeAnalysisInputSchema = z.object({
  code: z.string().describe('The code submitted by the user.'),
  language: z.string().describe('The programming language of the code.'),
  testResults: z.string().describe('The results of the test cases run on the code.'),
});
export type CodeAnalysisInput = z.infer<typeof CodeAnalysisInputSchema>;

const MistakeSchema = z.object({
    explanation: z.string().describe("A detailed, step-by-step explanation of a single mistake found in the code. It should clarify why the original code is incorrect and how the suggested change resolves the issue."),
    lines: z.array(z.number()).describe("An array of line numbers where the mistake can be found."),
    suggestion: z.string().describe("A code snippet with the suggested correction for this specific mistake.")
});

const CodeAnalysisOutputSchema = z.object({
  overallRating: z.number().min(0).max(100).describe('A code quality rating on a scale of 0 to 100.'),
  generalExplanation: z.string().describe('A brief, high-level explanation of the code quality and overall approach.'),
  mistakes: z.array(MistakeSchema).describe("A list of specific mistakes found in the code, with detailed explanations and suggestions."),
  correctedCode: z.string().describe("The full, corrected version of the user's code with all suggestions applied."),
  improvementTopics: z.array(z.string()).describe('A list of key programming concepts or topics the user should study to improve.')
});
export type CodeAnalysisOutput = z.infer<typeof CodeAnalysisOutputSchema>;

export async function analyzeCodeSubmission(input: CodeAnalysisInput): Promise<CodeAnalysisOutput> {
  return analyzeCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCodeSubmissionPrompt',
  input: { schema: CodeAnalysisInputSchema },
  output: { schema: CodeAnalysisOutputSchema },
  prompt: `You are an expert code reviewer and a helpful programming tutor. Your task is to analyze a user's code submission and provide comprehensive, structured feedback.

You will be given the user's code, the programming language, and the results from the test cases.

Analyze the code for correctness, efficiency, readability, and adherence to best practices for the given language.

Your response MUST be in a structured JSON format.

Based on your analysis, provide the following:
1.  **overallRating**: An integer score from 0 to 100 representing the overall quality of the code.
2.  **generalExplanation**: A short, high-level summary of the submission.
3.  **mistakes**: An array of specific issues found. For each issue:
    -   **explanation**: Provide a detailed, step-by-step explanation of the mistake, why it's an issue, and how the suggestion fixes it.
    -   **lines**: Provide an array of the line number(s) where the issue is located.
    -   **suggestion**: Provide a small, corrected code snippet for that specific issue.
4.  **correctedCode**: Provide the complete, corrected version of the user's code with all fixes applied.
5.  **improvementTopics**: A list of 2-3 key programming concepts or topics (e.g., "Array destructuring", "Async/Await", "Hash Maps") that the user should study based on their submission.

Here is the information about the user's submission:

Language: {{{language}}}
Test Results: {{{testResults}}}

User's Code:
\`\`\`{{{language}}}
{{{code}}}
\`\`\`
`,
});

const analyzeCodeFlow = ai.defineFlow(
  {
    name: 'analyzeCodeFlow',
    inputSchema: CodeAnalysisInputSchema,
    outputSchema: CodeAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
