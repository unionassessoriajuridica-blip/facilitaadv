import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

// --- CORREÇÃO DE COMPATIBILIDADE (ES MODULES) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================================================================
// ⚙️ CONFIGURAÇÕES (V3 - URL FORÇADA)
// ==================================================================

// Usamos a URL que funcionou no seu CURL para garantir
const SUPABASE_PROJECT = "https://gbosnlkmrsfxfllsmmzo.supabase.co"; 
const API_KEY = (process.env.LOVABLE_API_KEY || "").trim(); 

const CONFIG = {
  // Endpoints Hardcoded para evitar erro de .env antigo
  endpointLeads: `${SUPABASE_PROJECT}/functions/v1/receive-scraping-leads`,
  endpointTasks: `${SUPABASE_PROJECT}/functions/v1/scraping-tasks`,
  
  cidadePadrao: process.env.CIDADE_ALVO || "São Paulo",
  leadsPorNicho: 3, 
  arquivoHistorico: path.join(__dirname, 'leads_history.json')
};

const MAPA_SEGMENTOS: Record<string, string> = {
  "Imobiliária": "imobiliaria",
  "Clínica Odontológica": "odontologia",
  "Clínica de Estética e Cirurgia Plástica": "cirurgia_plastica"
};

const MAPA_SEGMENTOS_REVERSO: Record<string, string> = {
  "imobiliaria": "Imobiliária",
  "odontologia": "Clínica Odontológica",
  "cirurgia_plastica": "Clínica de Estética e Cirurgia Plástica"
};

// ==================================================================
// 🧠 MEMÓRIA & API LOVABLE
// ==================================================================

function carregarHistorico(): Set<string> {
  if (!fs.existsSync(CONFIG.arquivoHistorico)) return new Set();
  try { return new Set(JSON.parse(fs.readFileSync(CONFIG.arquivoHistorico, 'utf-8'))); } 
  catch { return new Set(); }
}

function salvarHistorico(telefones: Set<string>) {
  try { fs.writeFileSync(CONFIG.arquivoHistorico, JSON.stringify(Array.from(telefones), null, 2)); } 
  catch (e) { console.error("Erro histórico:", e); }
}

async function buscarTarefasPendentes() {
  try {
    console.log(`🔎 Consultando API: ${CONFIG.endpointTasks}`);
    
    const response = await fetch(CONFIG.endpointTasks, {
      method: 'GET',
      headers: { 
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const text = await response.text(); 

    if (response.ok) {
      try {
        const data = JSON.parse(text);
        const lista = Array.isArray(data) ? data : (data.tasks || []);
        
        if (lista.length > 0) {
           console.log(`📨 TAREFA ENCONTRADA! ID: ${lista[0].id} - ${lista[0].cidade}`);
        }
        return lista;
      } catch (e) {
        console.error("❌ Erro JSON:", text);
        return [];
      }
    } else {
      console.error(`❌ Erro HTTP ${response.status}: ${text}`);
      return [];
    }
  } catch (error) {
    console.error("❌ Erro Conexão:", error);
    return [];
  }
}

async function atualizarStatusTarefa(taskId: string, status: 'running' | 'completed' | 'failed', count: number = 0) {
  try {
    console.log(`📡 Atualizando tarefa ${taskId} -> '${status}'`);
    await fetch(CONFIG.endpointTasks, {
      method: 'PATCH',
      headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, status: status, results_count: count })
    });
  } catch (error) {
    console.error(`Erro update status ${taskId}:`, error);
  }
}

// ==================================================================
// 🤖 CORE DO ROBÔ (PUPPETEER)
// ==================================================================

interface LeadMap {
  nome: string; telefone: string; telefoneLimpo: string; nicho: string; cidade: string;
}

async function enviarParaLovable(leads: LeadMap[]) {
  if (leads.length === 0) return;
  console.log(`📡 Enviando ${leads.length} leads...`);

  const payload = leads.map(lead => ({
    nome: lead.nome, telefone: lead.telefoneLimpo, cidade: lead.cidade,
    segmento: MAPA_SEGMENTOS[lead.nicho] || lead.nicho, 
    email: "" 
  }));

  try {
    const res = await fetch(CONFIG.endpointLeads, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify(payload)
    });
    if (!res.ok) console.error(`Erro envio leads: ${res.statusText}`);
    else console.log("✅ Leads enviados com sucesso!");
  } catch (error) { console.error("Erro conexão leads:", error); }
}

async function minerar(browser: any, nicho: string, cidade: string, historico: Set<string>): Promise<number> {
  console.log(`\n🔍 Minerando: ${nicho} em ${cidade}...`);
  const page = await browser.newPage();
  
  await page.setRequestInterception(true);
  page.on('request', (req: any) => {
    if (['image', 'stylesheet', 'font'].includes(req.resourceType())) req.abort();
    else req.continue();
  });

  const termo = `${nicho} em ${cidade}`;
  const url = `https://www.google.com/maps/search/${encodeURIComponent(termo)}`;
  const leads: LeadMap[] = [];
  const vistos = new Set<string>();

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    try { await page.waitForSelector('div[role="feed"]', { timeout: 10000 }); } catch {}

    let tentativas = 0;
    while (leads.length < CONFIG.leadsPorNicho && tentativas < 15) {
      const cards = await page.$$('div[role="article"]');
      for (const card of cards) {
        if (leads.length >= CONFIG.leadsPorNicho) break;
        try {
          const nome = await page.evaluate((el: any) => el.getAttribute('aria-label'), card);
          if (!nome || vistos.has(nome)) continue;

          const texto = await page.evaluate((el: any) => el.innerText, card);
          const match = texto.match(/(\(?\d{2}\)?\s?)?(9?\d{4})[-.\s]?(\d{4})/);

          if (match) {
            const telRaw = match[0];
            let telLimpo = telRaw.replace(/\D/g, '');
            if (telLimpo.length >= 10 && telLimpo.length <= 11) telLimpo = `55${telLimpo}`;

            if (!historico.has(telLimpo) && telLimpo.length >= 12) {
              leads.push({ nome: nome.split('·')[0].trim(), telefone: telRaw, telefoneLimpo: telLimpo, nicho, cidade });
              historico.add(telLimpo);
              vistos.add(nome);
              console.log(`✨ Achei: ${nome}`);
            }
          }
        } catch {}
      }
      await page.evaluate(() => {
        const feed = document.querySelector('div[role="feed"]');
        if (feed) feed.scrollBy(0, 500);
      });
      await new Promise(r => setTimeout(r, 1000));
      tentativas++;
    }
    
    await enviarParaLovable(leads);
    return leads.length;

  } catch (e) { 
    console.error("Erro mineração:", e); 
    return 0;
  } finally { 
    try { await page.close(); } catch {} 
  }
}

// ==================================================================
// 🔄 ROTINAS
// ==================================================================

async function rotinaDiaria() {
  console.log("🌞 [CRON] Iniciando rotina diária...");
  const historico = carregarHistorico();
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });

  for (const nicho of Object.keys(MAPA_SEGMENTOS)) {
    await minerar(browser, nicho, CONFIG.cidadePadrao, historico);
    await new Promise(r => setTimeout(r, 3000));
  }
  await browser.close();
  salvarHistorico(historico);
  console.log("✅ [CRON] Fim.");
}

async function verificarTarefasManuais() {
  console.log(`💓 [${new Date().toLocaleTimeString()}] Checando...`);
  
  const tarefas = await buscarTarefasPendentes();
  
  if (tarefas && tarefas.length > 0) {
    console.log(`🔔 [MANUAL] ${tarefas.length} tarefas encontradas!`);
    const historico = carregarHistorico();
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });

    for (const tarefa of tarefas) {
      console.log(`▶️ Processando ID ${tarefa.id}`);
      const taskId = tarefa.id || tarefa.task_id;
      
      await atualizarStatusTarefa(taskId, 'running');
      
      const termoBusca = MAPA_SEGMENTOS_REVERSO[tarefa.segmento] || tarefa.segmento;
      const totalEncontrado = await minerar(browser, termoBusca, tarefa.cidade, historico);
      
      await atualizarStatusTarefa(taskId, 'completed', totalEncontrado);
    }

    await browser.close();
    salvarHistorico(historico);
    console.log("✅ [MANUAL] Concluído.");
  }
}

// ==================================================================
// 🚀 INICIALIZAÇÃO
// ==================================================================

console.log("🤖 Servidor Robô V3 (URL Forçada) Iniciado.");
console.log("🔗 URL Alvo:", CONFIG.endpointTasks); // Debug da URL

cron.schedule('0 9 * * *', rotinaDiaria, { timezone: "America/Sao_Paulo" });
setInterval(verificarTarefasManuais, 30000); 
verificarTarefasManuais();