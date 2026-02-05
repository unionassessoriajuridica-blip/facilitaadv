import puppeteer from 'puppeteer';

export interface LeadMap {
  nome: string;
  telefone: string;
  telefoneLimpo: string;
  nicho: string;
  cidade: string;
}

export const mapsScraperService = {
  async minerarLeads(nicho: string, cidade: string, limite: number = 5): Promise<LeadMap[]> {
    console.log(`🌍 [MINERADOR] Iniciando busca: ${nicho} em ${cidade} (Alvo: ${limite})`);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const termoBusca = `${nicho} em ${cidade}`;
    const leadsEncontrados: LeadMap[] = [];
    const nomesVistos = new Set<string>();

    try {
      await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(termoBusca)}`, {
        waitUntil: 'networkidle2', timeout: 60000
      });

      try { await page.waitForSelector('div[role="feed"]', { timeout: 10000 }); } catch (e) {}

      let tentativas = 0;
      while (leadsEncontrados.length < limite && tentativas < 10) {
        const cards = await page.$$('div[role="article"]');

        for (const card of cards) {
          if (leadsEncontrados.length >= limite) break;
          try {
            const ariaLabel = await page.evaluate(el => el.getAttribute('aria-label'), card);
            if (!ariaLabel || nomesVistos.has(ariaLabel)) continue;

            const texto = await page.evaluate(el => el.innerText, card);
            const regexTel = /\(?\d{2}\)?\s?(?:9?\d{4})[-.\s]?\d{4}/;
            const match = texto.match(regexTel);

            if (match) {
              const telRaw = match[0];
              const telLimpo = telRaw.replace(/\D/g, '');
              const telFinal = telLimpo.length >= 10 ? (telLimpo.startsWith('55') ? telLimpo : `55${telLimpo}`) : telLimpo;

              leadsEncontrados.push({
                nome: ariaLabel.split('·')[0].trim(),
                telefone: telRaw,
                telefoneLimpo: telFinal,
                nicho: nicho,
                cidade: cidade
              });
              nomesVistos.add(ariaLabel);
            }
          } catch (e) { continue; }
        }
        
        await page.evaluate(() => {
          const feed = document.querySelector('div[role="feed"]');
          if (feed) feed.scrollBy(0, 2000);
        });
        await new Promise(r => setTimeout(r, 2000));
        tentativas++;
      }
    } catch (error) {
      console.error("❌ Erro Scraper:", error);
    } finally {
      await browser.close();
    }
    return leadsEncontrados;
  }
};