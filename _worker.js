// Cloudflare Pages Worker — subdomain routing + geo-redirect for alsat.asia

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname;

    // Subdomain routing — serve country-specific HTML
    const subdomainMap = {
      'kg.alsat.asia': '/kg.html',
      'uz.alsat.asia': '/uz.html',
      'tr.alsat.asia': '/tr.html',
      'az.alsat.asia': '/az.html',
    };

    const targetPath = subdomainMap[host];
    if (targetPath) {
      const newUrl = new URL(request.url);
      newUrl.pathname = targetPath;
      return env.ASSETS.fetch(new Request(newUrl.toString(), request));
    }

    // Main domain — geo-redirect based on CF-IPCountry header
    // Only redirect on root path, skip if ?nogeo=1 is set (allows user to go back)
    if ((host === 'alsat.asia' || host === 'www.alsat.asia') && url.pathname === '/') {
      const noGeo = url.searchParams.get('nogeo');
      if (!noGeo) {
        const country = request.headers.get('CF-IPCountry') || '';
        const geoRedirect = {
          'KG': 'https://kg.alsat.asia',
          'UZ': 'https://uz.alsat.asia',
          'TR': 'https://tr.alsat.asia',
          'AZ': 'https://az.alsat.asia',
        };
        const redirectUrl = geoRedirect[country];
        if (redirectUrl) {
          return Response.redirect(redirectUrl, 302);
        }
      }
    }

    // Default: pass through to Cloudflare Pages assets
    return env.ASSETS.fetch(request);
  },
};
