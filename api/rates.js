const cheerio = require('cheerio');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  try {
    const [goldResp, silverResp] = await Promise.all([
      fetch('https://www.goodreturns.in/gold-rates-in-mumbai.html', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-IN,en;q=0.9',
        }
      }),
      fetch('https://www.goodreturns.in/silver-rates-in-mumbai.html', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-IN,en;q=0.9',
        }
      })
    ]);

    const goldHtml   = await goldResp.text();
    const silverHtml = await silverResp.text();

    const $g = cheerio.load(goldHtml);
    const $s = cheerio.load(silverHtml);

    // Gold 24K per 10g nikalo
    let goldPer10g = 0;
    $g('span.gold-silver-rate').each((i, el) => {
      const text = $g(el).text().replace(/[^0-9]/g, '');
      if (text && i === 0) goldPer10g = parseFloat(text);
    });

    // Agar pehla selector kaam na kare to table try karo
    if (!goldPer10g || goldPer10g < 1000) {
      $g('table tbody tr').each((i, row) => {
        if (i === 0) {
          const tds = $g(row).find('td');
          tds.each((j, td) => {
            const text = $g(td).text().replace(/[^0-9]/g, '');
            const num = parseFloat(text);
            if (num > 50000 && num < 200000) {
              goldPer10g = num;
            }
          });
        }
      });
    }

    // Silver per kg nikalo
    let silverPerKg = 0;
    $s('span.gold-silver-rate').each((i, el) => {
      const text = $s(el).text().replace(/[^0-9]/g, '');
      if (text && i === 0) silverPerKg = parseFloat(text);
    });

    if (!silverPerKg || silverPerKg < 10000) {
      $s('table tbody tr').each((i, row) => {
        if (i === 0) {
          const tds = $s(row).find('td');
          tds.each((j, td) => {
            const text = $s(td).text().replace(/[^0-9]/g, '');
            const num = parseFloat(text);
            if (num > 50000 && num < 500000) {
              silverPerKg = num;
            }
          });
        }
      });
    }

    const goldPerG   = goldPer10g   / 10;
    const silverPerG = silverPerKg  / 1000;

    if (!goldPerG || goldPerG < 1000) throw new Error('Scraping failed — invalid gold rate');

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
    console.error('Scraping error:', e.message);

    // Fallback — MetalPriceAPI
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

      const goldPerG   = (goldOzUSD   * USD_INR) / 31.1035;
      const silverPerG = (silverOzUSD * USD_INR) / 31.1035;

      res.status(200).json({
        gold24k:  Math.round(goldPerG),
        silver:   Math.round(silverPerG),
        date: new Date().toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric'
        }),
        source:   'MetalPriceAPI International',
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