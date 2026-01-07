import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

async function registrarNumero() {
    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const cert = process.env.WHATSAPP_REGISTRATION_CERT;
    

    if (!apiToken || !phoneId || !cert) {
        console.error("❌ Faltam dados no .env (Token, Phone ID ou Certificado)");
        return;
    }

    console.log(`🚀 Registrando número (Phone ID: ${phoneId})...`);

    try {
        const url = `https://graph.facebook.com/v17.0/${phoneId}/register`;
        
        const body = {
            messaging_product: "whatsapp",
            cert: cert,
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
        console.log("RESPOSTA META:", JSON.stringify(data, null, 2));

        if (response.ok && data.success) {
            console.log("✅ SUCESSO! O número agora deve estar 'Conectado' ou 'Connected'.");
        } else {
            console.log("❌ Falha no registro.");
        }

    } catch (error) {
        console.error("Erro na requisição:", error);
    }
}

registrarNumero();
