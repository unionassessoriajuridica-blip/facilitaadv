import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

async function ativarSemPin() {
    // Carrega as variáveis
    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const cert = process.env.WHATSAPP_REGISTRATION_CERT;

    // Verificação de segurança básica
    if (!apiToken || !phoneId || !cert) {
        console.error("❌ ERRO: Verifique se WHATSAPP_API_TOKEN, WHATSAPP_PHONE_ID e WHATSAPP_REGISTRATION_CERT estão no .env");
        return;
    }

    console.log(`🚀 Tentando ativar número (ID: ${phoneId}) SEM enviar PIN...`);

    try {
        const url = `https://graph.facebook.com/v18.0/${phoneId}/register`;
        
        // Payload limpo: Apenas o produto e o certificado
        const body = {
            messaging_product: "whatsapp",
            cert: cert
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        
        console.log("--- RESPOSTA DA META ---");
        console.log(JSON.stringify(data, null, 2));
        console.log("------------------------");

        if (data.success) {
            console.log("✅ SUCESSO! O número foi ativado sem PIN.");
        } else {
            console.log("⚠️ A ativação falhou. Leia o erro acima.");
        }

    } catch (error) {
        console.error("Erro na requisição:", error);
    }
}

ativarSemPin();
