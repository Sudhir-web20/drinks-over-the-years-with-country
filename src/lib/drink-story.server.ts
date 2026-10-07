import { APICallError } from 'ai';
import { drinks } from './drinks';
import { createResponsesCall } from './ai/responses.server';
const pending = new Map<string, Promise<{ text?: string; error?: string }>>();
export async function generateDrinkStory(id: string): Promise<{ text?: string; error?: string }> {
  const drink = drinks.find(d=>d.id===id);
  if (!drink) return {error:'This drink is not part of the collection.'};
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const {data: block} = await supabaseAdmin.from('drink_ai_cache').select('blocked_status,blocked_message').eq('drink_id','__access__').maybeSingle();
  if (block?.blocked_status) return {error:block.blocked_message ?? 'AI stories are currently unavailable.'};
  const {data: cached} = await supabaseAdmin.from('drink_ai_cache').select('story').eq('drink_id',id).maybeSingle();
  if (cached?.story) return {text:cached.story};
  const active = pending.get(id);
  if (active) return active;
  if (pending.size>=3) return {error:'The archive is busy. Please try again in a moment.'};
  const work = (async () => {
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) return {error:'AI stories need a configuration update.'};
    try {
      const {result} = createResponsesCall(new Request('https://archive.internal/story'),{baseURL:'https://ai.gateway.lovable.dev/v1',apiKey:key,model:'openai/gpt-6-astra'},[{role:'user',content:`Explore ${drink.name}, ${drink.type}, from ${drink.country}. Archive reference year: ${drink.year}. Curated background: ${drink.story} ${drink.fact}. Write 130-170 words in three short paragraphs: its origin and cultural impact; flavor and typical ingredients without secret recipe guesses; one interesting historical detail. If the reference date is not its modern brand launch date, briefly distinguish them. Plain text only, no markdown, no headings. Avoid medical benefits, precise nutrition, pricing, invented citations, or unverifiable claims.`}], 'You are a thoughtful beverage historian. Be factual, engaging and concise. Express uncertainty rather than inventing details. Do not claim to have researched live sources.');
      const text = await result.text;
      if (!text.trim()) return {error:'The AI returned no story for this drink.'};
      await supabaseAdmin.from('drink_ai_cache').upsert({drink_id:id,story:text});
      return {text};
    } catch (error) {
      let status = 500;
      let message = 'The story could not be completed. Please try again later.';
      if (APICallError.isInstance(error)) {
        status = error.statusCode ?? 500;
        try { const body = JSON.parse(error.responseBody ?? '{}'); message=body.message ?? body.error?.message ?? message; } catch { /* retain safe message */ }
      }
      if (status===402 || status===403) await supabaseAdmin.from('drink_ai_cache').upsert({drink_id:'__access__',blocked_status:status,blocked_message:message});
      return {error:message};
    }
  })();
  pending.set(id,work);
  try {return await work;} finally {pending.delete(id);}
}
