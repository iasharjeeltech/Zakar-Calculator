const cheerio = require('cheerio');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  try {
    // GoodReturns se Gold aur Silver dono scrape karo
    const [goldResp, silverResp] = await Promise.all([
      fetch('https://www.goodreturns.in/gold-rates-in-mumbai.html', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }),
      fetch('https://www.goodreturns.in/silver-rates-in-mumbai.html', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
    ]);

    const goldHtml   = await goldResp.text();
    const silverHtml = await silverResp.text();

    const $g = cheerio.load(goldHtml);
    const $s = cheerio.load(silverHtml);

    // GoodReturns pe 24K gold rate
    let goldPer10g = 0;
    $g('.gold-silver-rate-table tbody tr').each((i, row) => {
      if (i === 0) {
        const cells = $g(row).find('td');
        const rateText = $g(cells[1]).text().replace(/[^0-9.]/g, '');
        goldPer10g = parseFloat(rateText);
      }
    });

    // Silver rate per kg
    let silverPerKg = 0;
    $s('.gold-silver-rate-table tbody tr').each((i, row) => {
      if (i === 0) {
        const cells = $s(row).find('td');
        const rateText = $s(cells[1]).text().replace(/[^0-9.]/g, '');
        silverPerKg = parseFloat(rateText);
      }
    });

    // Convert to per gram
    const goldPerG   = goldPer10g / 10;
    const silverPerG = silverPerKg / 1000;

    if (!goldPerG || goldPerG < 1000) throw new Error('Scraping failed');

    res.status(200).json({
      gold24k:  Math.round(goldPerG),
      silver:   Math.round(silverPerG),
      date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      }),
      source:   'GoodReturns Mumbai',
      fallback: false
    });

  } catch(e) {
    // Fallback — international rate + India duty
    try {
      const [fxResp, metalResp] = await Promise.all([
        fetch('https://api.frankfurter.app/latest?from=USD&to=INR'),
        fetch(`https://api.metalpriceapi.com/v1/latest?api_key=${process.env.METAL_API_KEY}&base=USD&currencies=XAU,XAG`)
      ]);

      const fxData    = await fxResp.json();
      const metalData = await metalResp.json();

      const USD_INR     = fxData.rates.INR;
      const goldOzUSD   = 1 / metalData.rates.XAU;
      const silverOzUSD = 1 / metalData.rates.XAG;

      // India mein: international + 15% import duty + 3% GST = x1.185
      const goldPerG   = (goldOzUSD   * USD_INR / 31.1035) * 1.185;
      const silverPerG = (silverOzUSD * USD_INR / 31.1035) * 1.185;

      res.status(200).json({
        gold24k:  Math.round(goldPerG),
        silver:   Math.round(silverPerG),
        date: new Date().toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric'
        }),
        source:   'International + India Duty',
        fallback: false
      });

    } catch(e2) {
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
  }
};