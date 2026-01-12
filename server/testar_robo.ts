// server/testar_robo.ts
import fetch from 'node-fetch'; 

async function dispararTesteRobo() {
  // CONFIGURAÇÃO
  // Se estiver rodando localmente na sua máquina: use http://localhost:5000
  // Se estiver rodando este script DE FORA do VPS: use o IP real http://177.136.229.37:5000
  const URL_API = "http://localhost:5000/api/robo/atualizar";

  console.log(`🚀 Robô iniciando disparo para: ${URL_API}`);
  console.log(`ℹ️  Este teste simula o recebimento de uma nova movimentação.`);
  console.log(`ℹ️  O servidor deve:`);
  console.log(`   1. Detectar mudança no texto.`);
  console.log(`   2. Gerar resumo com IA.`);
  console.log(`   3. Enviar o TEMPLATE de WhatsApp para o cliente.`);

  try {
    const timestamp = new Date().toISOString();
    
    const response = await fetch(URL_API, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        "token_seguranca": "SENHA_DO_SEU_ROBO_123", // Certifique-se que bate com seu código server/routes/robo.ts
        
        // IMPORTANTE: Este processo deve existir no seu banco e ter cliente vinculado com telefone!
        "numero_processo": "0000062-00.2026.8.26.0000",
        
        // Mudamos o texto para garantir que o sistema detecte como "Novidade"
        "texto_movimentacoes": `Movimentação de Teste Automático em ${timestamp}. 
        O sistema identificou uma atualização processual relevante para teste de envio de template.
        Conclusão ao Juiz para despacho saneador.`
      })
    });

    const data = await response.json();
    console.log("\n📡 Resposta do Servidor:", JSON.stringify(data, null, 2));
    
    if (response.ok) {
        if (data.whatsapp_enviado) {
            console.log("\n✅ SUCESSO TOTAL! O WhatsApp (Template) foi enviado.");
        } else {
            console.log("\n⚠️  ATENÇÃO: O processo foi atualizado, mas o WhatsApp NÃO foi enviado.");
            console.log("Verifique: O processo mudou de verdade? O cliente tem telefone? As chaves da Meta estão no .env?");
            console.log("Detalhe do envio:", data.detalhe_envio);
        }
    } else {
        console.log("\n❌ ERRO NA API DO ROBÔ.");
    }

  } catch (error: any) {
    console.error("❌ FALHA DE CONEXÃO COM O SERVIDOR LOCAL.");
    console.error("Certifique-se que o servidor (npm run dev) está rodando em outro terminal.");
    console.error("Erro:", error.message);
  }
}

dispararTesteRobo();