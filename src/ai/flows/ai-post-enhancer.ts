'use server';
/**
 * @fileOverview An AI-powered tool to enhance social media posts by suggesting hashtags and a catchy summary.
 *
 * - aiPostEnhancer - A function that handles the post enhancement process.
 * - AiPostEnhancerInput - The input type for the aiPostEnhancer function.
 * - AiPostEnhancerOutput - The return type for the aiPostEnhancer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiPostEnhancerInputSchema = z.object({
  postContent: z.string().describe('The content of the user\'s post.'),
});
export type AiPostEnhancerInput = z.infer<typeof AiPostEnhancerInputSchema>;

const AiPostEnhancerOutputSchema = z.object({
  hashtags: z
    .array(z.string())
    .describe('A list of 3-5 relevant and popular hashtags for the post.'),
  summary: z
    .string()
    .describe('A catchy and engaging one-sentence summary for the post.'),
});
export type AiPostEnhancerOutput = z.infer<typeof AiPostEnhancerOutputSchema>;

export async function aiPostEnhancer(
  input: AiPostEnhancerInput
): Promise<AiPostEnhancerOutput> {
  return aiPostEnhancerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiPostEnhancerPrompt',
  input: {schema: AiPostEnhancerInputSchema},
  output: {schema: AiPostEnhancerOutputSchema},
  prompt: `أنت خبير في محتوى وسائل التواصل الاجتماعي. مهمتك هي إنشاء علامات تصنيف (هاشتاجات) ذات صلة وجذابة وملخص من جملة واحدة لمحتوى المنشور المقدم.

المنشور: {{{postContent}}}

التعليمات:
1. قم بإنشاء 3-5 علامات تصنيف (هاشتاجات) الأكثر ملاءمة وشعبية للمنشور.
2. اكتب ملخصًا جذابًا ومقنعًا من جملة واحدة للمنشور.`,
});

const aiPostEnhancerFlow = ai.defineFlow(
  {
    name: 'aiPostEnhancerFlow',
    inputSchema: AiPostEnhancerInputSchema,
    outputSchema: AiPostEnhancerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
