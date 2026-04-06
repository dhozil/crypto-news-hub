import { supabase } from "@/lib/supabase";


export async function GET() {
  try {
    const title = "Bitcoin Naik Tajam Hari Ini";
    const description = "Harga Bitcoin mengalami kenaikan signifikan.";

    // 🔥 Call OpenRouter
    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Buat artikel berita crypto dalam bahasa Indonesia:

Judul: ${title}
Deskripsi: ${description}

Buat panjang, menarik, dan profesional.`,
          },
        ],
      }),
    });

    const data = await aiResponse.json();

console.log("API KEY:", process.env.OPENROUTER_API_KEY);

// cek kalau error
if (!data.choices) {
  return Response.json({ error: data });
}

const content = data.choices[0].message.content;

    const { supabase } = await import("@/lib/supabase");

    const { error } = await supabase.from("posts").insert([
      {
        title,
        content,
        source_url: "openrouter-test",
      },
    ]);

    if (error) throw error;

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message });
  }
}