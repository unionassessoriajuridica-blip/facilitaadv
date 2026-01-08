import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

async function testeDireto() {
    console.log("🕵️ INICIANDO DIAGNÓSTICO DE WHATSAPP...");

    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    // COLOQUE O NÚMERO QUE VOCÊ QUER TESTAR AQUI (Só números, com DDI)
    // Ex: Angola = 244... Brasil = 55...
    const numeroDestino = "5516993508206"; 

    if (!apiToken || !phoneId) {
        console.error("❌ ERRO: Faltam credenciais no .env");
        return;
    }

    console.log(`📱 Token começa com: ${apiToken.substring(0, 10)}...`);
    console.log(`🆔 Phone ID: ${phoneId}`);
    console.log(`📡 Tentando enviar para: ${numeroDestino}`);

    try {
        const response = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: numeroDestino,
                type: "text",
                text: { body: "Recebeu essa mensagem patrão? Testando aqui, o feedback do bot com API do site." }
            })
        });

        const data = await response.json();

        console.log("\n--- RESPOSTA DA META (LEIA COM ATENÇÃO) ---");
        console.log(JSON.stringify(data, null, 2));
        console.log("-------------------------------------------\n");

        if (response.ok) {
            console.log("✅ O servidor da Meta aceitou o pedido.");
            console.log("Se não chegou no celular, é porque o número não está verificado na lista de teste.");
        } else {
            console.log("❌ A Meta rejeitou.");
            if (data.error?.code === 190) console.log("MOTIVO: Token inválido ou expirado.");
            if (data.error?.code === 131030) console.log("MOTIVO: Número de destino não é um WhatsApp válido ou não está na lista de teste.");
            if (data.error?.code === 131047) console.log("MOTIVO: Janela de 24h fechada (Mande um Oi pro bot).");
        }

    } catch (error) {
        console.error("❌ Erro de conexão:", error);
    }
}

testeDireto();
