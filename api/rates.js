// v2 - gemini live rates       <-- yeh add karo line 1 pe
module.exports = async function handler(req, res) {   // <-- yeh line 2 ho jaayegi
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  try {
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'What is the current gold 24K price per gram and silver price per gram in Mumbai India today? Reply ONLY in JSON format like this: {"gold24k": 15966, "silver": 275} — only numbers, no text, no rupee sign, no explanation.'
            }]
          }],
          tools: [{ google_search: {} }]
        })
      }
    );

    const data = await resp.json();
    const text = data.candidates[0].content.parts[0].text;

    // JSON parse karo
    const clean = text.replace(/```json|```/g, '').trim();
    const s = clean.indexOf('{'), e = clean.lastIndexOf('}');
    const rates = JSON.parse(clean.slice(s, e + 1));

    if (!rates.gold24k || rates.gold24k < 1000) throw new Error('Invalid rates');

    res.status(200).json({
      gold24k:  Math.round(rates.gold24k),
      silver:   Math.round(rates.silver),
      date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      }),
      source:   'Gemini + Google Search',
      fallback: false
    });

  } catch(e) {
    res.status(200).json({
      gold24k:  15966,
      silver:   275,
      date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      }),
      source:   'Cached',
      fallback: true
    });
  }
};
