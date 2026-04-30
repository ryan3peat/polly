import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';

export async function POST(req: NextRequest) {
  try {
    const { image_url } = await req.json();
    if (!image_url) {
      return NextResponse.json({ error: 'image_url required' }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'url', url: image_url },
            },
            {
              type: 'text',
              text: 'Look at this image. List every individual clothing item, accessory, or wearable visible on the person. For each item give a specific searchable description including: item type, colour, material if visible, and style. Return ONLY a JSON array of strings. Example: ["ivory silk slip dress", "gold strappy heeled sandals", "oversized tortoiseshell sunglasses"]. No markdown, no explanation.',
            },
          ],
        },
      ],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '[]';
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const items: string[] = JSON.parse(text);

    return NextResponse.json({ items });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error }, { status: 500 });
  }
}
