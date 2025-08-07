import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  const { style, platform, outputs, vibe } = await req.json();

  if (!Array.isArray(outputs) || outputs.length === 0) {
    return NextResponse.json({ error: "No outputs selected." }, { status: 400 });
  }

  try {
    const results: Record<string, string> = {};

    for (const output of outputs) {
      const prompt = `Vytvoř ${output.toLowerCase()} pro platformu ${platform}, styl: ${style}, nálada: ${vibe}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 120,
      });

      results[output] = completion.choices[0].message.content ?? "";
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error("OpenAI error:", err);
    return NextResponse.json({ error: "OpenAI error" }, { status: 500 });
  }
}

