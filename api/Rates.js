module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600');

  try {
    const API_KEY = process.env.METAL_API_KEY;

    const resp = await fetch(
      `https://api.metalpriceapi.com/v1/latest?api_key=${API_KEY}&base=USD&currencies=XAU,XAG,INR`
    );
    const data = await resp.json();

    if (!data.success) throw new Error('API error');

    const USD_INR    = data.rates.INR;
    const goldOzUSD  = 1 / data.rates.XAU;
    const silverOzUSD = 1 / data.rates.XAG;

    const goldPerG   = (goldOzUSD   * USD_INR) / 31.1035;
    const silverPerG = (silverOzUSD * USD_INR) / 31.1035;

    res.status(200).json({
      gold24k:  Math.round(goldPerG),
      silver:   Math.round(silverPerG),
      date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      }),
      fallback: false
    });

  } catch(e) {
    res.status(200).json({
      gold24k:  15966,
      silver:   275,
      date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      }),
      fallback: true
    });
  }
};