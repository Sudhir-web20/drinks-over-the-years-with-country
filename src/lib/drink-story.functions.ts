import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
export const getDrinkStory = createServerFn({ method: 'POST' })
  .inputValidator((data) => z.object({ id: z.string().max(40) }).parse(data))
  .handler(async ({ data }) => {
    const { generateDrinkStory } = await import('./drink-story.server');
    return generateDrinkStory(data.id);
  });
