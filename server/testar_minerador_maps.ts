// server/testar_minerador_maps.ts
import { mapsScraperService } from './services/robo_automatico';

async function testeRapido() {
  console.log(" INICIANDO TESTE DE MINERAÇÃO (MODO LOCALHOST)...");
  console.log("---------------------------------------------------");

  // Configuração do Teste
  const nicho = "Imobiliária";
  const cidade = "Ribeirão Preto, SP";
  const quantidade = 3; // Pega só 3 para ser rápido

  const inicio = Date.now();

  try {
    // Chama a função real do seu sistema
    const resultados = await mapsScraperService.minerarLeads(nicho, cidade, quantidade);

    console.log("\n MINERAÇÃO CONCLUÍDA COM SUCESSO!");
    console.log("---------------------------------------------------");
    console.log(` Tempo total: ${(Date.now() - inicio) / 1000} segundos`);
    console.log(` Leads encontrados: ${resultados.length}`);
    console.log("---------------------------------------------------");

    // Mostra os dados capturados
    resultados.forEach((lead, index) => {
      console.log(`\n EMPRESA #${index + 1}`);
      console.log(`   Nome:     ${lead.nome}`);
      console.log(`   Telefone: ${lead.telefone}`);
      console.log(`   Whats:    ${lead.telefoneLimpo} (Para envio)`);
      console.log(`   Nicho:    ${lead.nicho}`);
    });

  } catch (erro) {
    console.error("\n ERRO DURANTE O TESTE:", erro);
  } finally {
    console.log("\n Fim do teste.");
    process.exit(0);
  }
}

testeRapido();