import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const { style, platform, output, vibe } = await req.json();

  const prompt = `Vytvoř ${output.toLowerCase()} pro ${platform}, styl: ${style}, nálada: ${vibe}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 120,
    });

    const generated = completion.choices[0].message.content;
    return NextResponse.json({ result: generated });
  } catch (err) {
    return NextResponse.json({ error: "OpenAI error" }, { status: 500 });
  }
}
