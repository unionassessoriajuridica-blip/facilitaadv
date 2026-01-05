// server/testar_robo.ts
import fetch from 'node-fetch'; // Necessário se estiver rodando localmente em Node antigo

async function dispararTeste() {
  // CONFIGURAÇÃO DO ROBÔ
  const IP_DO_VPS = "177.136.229.37"; // Seu IP
  const PORTA = "5000";
  const URL_API = "http://localhost:5000/api/robo/atualizar";

  console.log(`🚀 Robô iniciando disparo para: ${URL_API}`);

  try {
    const response = await fetch(URL_API, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        "token_seguranca": "SENHA_DO_SEU_ROBO_123",
        
        // NOVO PROCESSO QUE CRIAMOS AGORA
        "numero_processo": "0000002-00.2026.8.26.0000",
        
        // TEXTO NOVO PARA GERAR NOTIFICAÇÃO
        "texto_movimentacoes": "02/01/2026 - Movimentação Teste ROBÔ 02. O juiz confirmou que o apontamento para o IP " + IP_DO_VPS + " está correto e o cliente 02 foi notificado."
      })
    });

    const data = await response.json();
    console.log("📡 Resposta do Servidor:", data);
    
    if (response.ok) {
        console.log("✅ SUCESSO! O servidor aceitou. Verifique seu WhatsApp.");
    } else {
        console.log("❌ ERRO: O servidor recusou ou deu erro interno.");
    }

  } catch (error) {
    console.error("❌ FALHA DE CONEXÃO: O robô não conseguiu achar o servidor.");
    console.error("VERIFIQUE: ");
    console.error("1. O servidor no VPS está rodando? (pm2 status ou npm run dev)");
    console.error("2. A porta 5000 está liberada? (ufw allow 5000)");
    console.error("Erro detalhado:", error.message);
  }
}

dispararTeste();
