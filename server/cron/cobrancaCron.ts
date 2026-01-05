import cron from "node-cron";
import { processarCobrancasDiarias } from "../services/cobrancaService";

// Roda todos os dias às 09:00 da manhã
cron.schedule("0 9 * * *", async () => {
  console.log("[CRON] Iniciando verificação de cobranças...");
  await processarCobrancasDiarias();
});
