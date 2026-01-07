import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

async function ativarComPinPadrao() {
    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const cert = process.env.WHATSAPP_REGISTRATION_CERT;
    
    // Vamos TENTAR DEFINIR este PIN agora
    const pinParaDefinir = "123456"; 

    if (!apiToken || !phoneId || !cert) {
        console.error("❌ ERRO: Verifique se TOKEN, PHONE_ID e CERTIFICADO estão no .env");
        return;
    }

    console.log(`🚀 Tentando registrar e DEFINIR o PIN ${pinParaDefinir} para o ID: ${phoneId}...`);

    try {
        const url = `https://graph.facebook.com/v18.0/${phoneId}/register`;
        
        const body = {
            messaging_product: "whatsapp",
            cert: cert,
            pin: pinParaDefinir // <--- Estamos enviando isso para CRIAR o vínculo
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
            console.log("✅ SUCESSO ABSOLUTO! O número conectou e seu PIN agora é 123456.");
            console.log("👉 Guarde esse PIN, você pode precisar dele no futuro.");
        } else {
            // Análise de erros comuns
            if (data.error?.code === 131053) {
               console.log("⚠️ ERRO: O certificado pode estar vencido ou incorreto.");
            } else if (data.error?.message?.includes("pin")) {
               console.log("⚠️ O sistema ainda rejeitou o PIN. Pode ser que já exista um PIN diferente configurado anteriormente (mesmo que você não lembre).");
            }
        }

    } catch (error) {
        console.error("Erro na requisição:", error);
    }
}

ativarComPinPadrao();
