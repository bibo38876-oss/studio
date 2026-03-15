
'use server';
/**
 * @fileOverview A flow to generate images using AI based on post content.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiImageGeneratorInputSchema = z.object({
  prompt: z.string().describe('The description of the image to generate.'),
});
export type AiImageGeneratorInput = z.infer<typeof AiImageGeneratorInputSchema>;

const AiImageGeneratorOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});
export type AiImageGeneratorOutput = z.infer<typeof AiImageGeneratorOutputSchema>;

export async function aiImageGenerator(
  input: AiImageGeneratorInput
): Promise<AiImageGeneratorOutput> {
  return aiImageGeneratorFlow(input);
}

const aiImageGeneratorFlow = ai.defineFlow(
  {
    name: 'aiImageGeneratorFlow',
    inputSchema: AiImageGeneratorInputSchema,
    outputSchema: AiImageGeneratorOutputSchema,
  },
  async input => {
    const { media } = await ai.generate({
      model: 'googleai/imagen-3.0-generate-001',
      prompt: `Generate a high-quality, artistic social media post illustration for: ${input.prompt}. Style: modern, clean, vibrant.`,
    });

    if (!media) {
      throw new Error('فشل توليد الصورة');
    }

    return {
      imageUrl: media.url,
    };
  }
);
