import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

async function testeDiretoTemplate() {
    console.log("🕵️ INICIANDO DIAGNÓSTICO DE WHATSAPP (MODO TEMPLATE)...");

    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    // --- CONFIGURAÇÃO ---
    // Coloque seu número aqui (com DDI, ex: 5516...)
    const numeroDestino = "244975699684"; 
    
    // Nome do modelo que criamos (deve estar APROVADO no Meta)
    const nomeModelo = "atualizacao_processual"; 
    // --------------------

    if (!apiToken || !phoneId) {
        console.error("❌ ERRO: Faltam credenciais (WHATSAPP_API_TOKEN ou WHATSAPP_PHONE_ID) no .env");
        return;
    }

    console.log(`📱 Token começa com: ${apiToken.substring(0, 10)}...`);
    console.log(`📡 Tentando enviar TEMPLATE '${nomeModelo}' para: ${numeroDestino}`);

    try {
        // Estrutura específica para enviar Templates
        const body = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: numeroDestino,
            type: "template",
            template: {
                name: nomeModelo,
                language: {
                    code: "pt_BR"
                },
                components: [
                    {
                        type: "body",
                        parameters: [
                            // Variável {{1}} - Nome do Cliente
                            {
                                type: "text",
                                text: "Cliente Teste (Script Direto)"
                            },
                            // Variável {{2}} - Resumo da IA
                            {
                                type: "text",
                                text: "Este é um teste direto do script para verificar se o modelo de atualização processual está funcionando corretamente."
                            }
                        ]
                    }
                ]
            }
        };

        const response = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        console.log("\n--- RESPOSTA DA META ---");
        console.log(JSON.stringify(data, null, 2));
        console.log("------------------------\n");

        if (response.ok) {
            console.log("✅ SUCESSO! A Meta aceitou o envio do Template.");
            console.log("👉 Verifique no celular se a mensagem chegou.");
        } else {
            console.log("❌ A Meta rejeitou.");
            // @ts-ignore
            if (data.error?.code === 132000) console.log("MOTIVO: O nome do modelo não existe ou não foi aprovado ainda.");
            // @ts-ignore
            if (data.error?.code === 132001) console.log("MOTIVO: O modelo não existe neste idioma (verifique pt_BR).");
            // @ts-ignore
            if (data.error?.code === 100) console.log("MOTIVO: Parâmetros incorretos (número de variáveis não bate).");
        }

    } catch (error) {
        console.error("❌ Erro de conexão:", error);
    }
}

testeDiretoTemplate();