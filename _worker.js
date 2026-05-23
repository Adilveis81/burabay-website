// Cloudflare Pages Worker — subdomain routing for alsat.asia
// Routes kg/uz/tr/az.alsat.asia to their respective HTML pages

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname;

    // Subdomain routing
    const countryMap = {
      'kg.alsat.asia': '/kg.html',
      'uz.alsat.asia': '/uz.html',
      'tr.alsat.asia': '/tr.html',
      'az.alsat.asia': '/az.html',
    };

    const targetPath = countryMap[host];
    if (targetPath) {
      const newUrl = new URL(request.url);
      newUrl.pathname = targetPath;
      const newRequest = new Request(newUrl.toString(), request);
      return env.ASSETS.fetch(newRequest);
    }

    // Default: pass through to Cloudflare Pages assets
    return env.ASSETS.fetch(request);
  },
};
