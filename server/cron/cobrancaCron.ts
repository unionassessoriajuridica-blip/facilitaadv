import cron from "node-cron";
import { processarCobrancasDiarias } from "../services/cobrancaService";

export function startCobrancaCron() {
    // Agendado para rodar todos os dias às 09:00 da manhã
    cron.schedule("0 9 * * *", async () => {
      console.log("[CRON] ⏰ Executando verificação diária de cobranças...");
      await processarCobrancasDiarias();
    });

    console.log("[CRON] Módulo de Cobrança Automática: ATIVO (09:00)");
}
