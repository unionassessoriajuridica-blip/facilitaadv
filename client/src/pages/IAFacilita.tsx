import * as React from "react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { ArrowLeft, Bot, User, Globe, Zap, Search, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast.ts";
import { supabase } from "@/integrations/supabase/client.ts";
import { AdvancedChatInput } from "@/components/AdvancedChatInput.tsx";

interface Message {
  id: number;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  mode?: "chat" | "agent" | "research" | "investigate";
  files?: any[];
  toolCalls?: any[];
  sources?: any[];
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  path: string;
}

const IAFacilita = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "ai",
      content:
        "Olá! Sou a IA-Facilita, sua assistente jurídica avançada. Agora com novos modos:\n\n🤖 **Chat** - Conversa normal\n⚡ **Agente** - Análise autônoma estruturada\n🔍 **Pesquisa** - Busca informações atualizadas na web\n👁️ **Investigar** - Investigação detalhada com múltiplas fontes\n\nVocê também pode anexar arquivos para análise. Como posso ajudá-lo hoje?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (
    message: string,
    mode: "chat" | "agent" | "research" | "investigate",
    files: UploadedFile[]
  ) => {
    if (!message.trim() && files.length === 0) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: message,
      timestamp: new Date(),
      mode,
      files,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setLoading(true);

    try {
      let response;
      let aiContent = "";
      let additionalData = {};
      let agentData, agentError;
      switch (mode) {
        case "investigate": {
          console.log("🔍 Modo Investigação ativado");
          const { data: investigateData, error: investigateError } =
            await supabase.functions.invoke("agent-mode", {
              body: {
                message: `MODO INVESTIGAÇÃO ATIVADO - Realize uma investigação detalhada sobre: ${message}. 
        Combine múltiplas abordagens: análise jurídica, busca de precedentes, verificação de fontes e análise de contexto.`,
                context: "Sistema jurídico - modo investigação avançada",
                files: files.map((f) => ({ name: f.name, type: f.type })),
                previousMessages: messages.slice(-3).map((m) => ({
                  role: m.type === "user" ? "user" : "assistant",
                  content: m.content,
                })),
              },
            });

          if (investigateError) throw investigateError;

          aiContent = investigateData.response;
          additionalData = {
            toolCalls: investigateData.toolCalls,
            reasoning: investigateData.reasoning,
            investigation: true,
          };
          break;
        }
        case "research":
          console.log("🔍 Modo Pesquisa ativado");
          try {
            const { data: searchData, error: searchError } =
              await supabase.functions.invoke("web-search", {
                body: {
                  query: message,
                  sources: [],
                },
              });

            if (searchError) {
              console.warn(
                "⚠️ Fallback para OpenAI devido ao erro:",
                searchError
              );
              // Fallback para OpenAI quando Perplexity não funciona
              const { data: chatData, error: chatError } =
                await supabase.functions.invoke("ai-chat", {
                  body: {
                    message: `PESQUISA WEB SIMULADA: ${message}\n\nNota: Como assistente jurídico, forneça uma resposta baseada no conhecimento existente sobre: ${message}`,
                    context:
                      "Modo pesquisa - respondendo com base no conhecimento jurídico existente",
                  },
                });

              if (chatError) throw chatError;

              aiContent =
                chatData.response +
                "\n\n⚠️ Nota: Esta resposta foi gerada com base no conhecimento existente. Para pesquisas web atualizadas, configure a chave da API Perplexity.";
              additionalData = {
                sources: [],
                relatedQuestions: [],
                fallback: true,
              };
            } else {
              aiContent = searchData.result;
              additionalData = {
                sources: searchData.sources,
                relatedQuestions: searchData.relatedQuestions,
              };
            }
          } catch (err) {
            console.error("Erro na pesquisa:", err);
            throw err;
          }
          break;

        case "agent":
          console.log("⚡ Modo Agente ativado");
          ({ data: agentData, error: agentError } =
            await supabase.functions.invoke("agent-mode", {
              body: {
                message,
                context: "Sistema jurídico - análise autônoma",
                files: files.map((f) => ({ name: f.name, type: f.type })),
                previousMessages: messages.slice(-5).map((m) => ({
                  role: m.type === "user" ? "user" : "assistant",
                  content: m.content,
                })),
              },
            }));

          if (agentError) throw agentError;

          aiContent = agentData.response;
          additionalData = {
            toolCalls: agentData.toolCalls,
            reasoning: agentData.reasoning,
          };
          break;

        case "chat":
        default: {
          console.log("🤖 Modo Chat ativado");
          const { data: chatData, error: chatError } =
            await supabase.functions.invoke("ai-chat", {
              body: {
                message,
                context:
                  "Sistema jurídico - assistente para advogados especializado em direito brasileiro",
              },
            });

          if (chatError) throw chatError;

          aiContent = chatData.response;
          break;
        }
      }

      const aiResponse: Message = {
        id: messages.length + 2,
        type: "ai",
        content: aiContent || "Desculpe, não consegui processar sua mensagem.",
        timestamp: new Date(),
        mode,
        ...additionalData,
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);

      const errorResponse: Message = {
        id: messages.length + 2,
        type: "ai",
        content:
          "Desculpe, ocorreu um erro ao processar sua mensagem. Verifique se as configurações estão corretas.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);

      toast({
        title: "Erro",
        description: "Não foi possível processar sua mensagem",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getModeIcon = (mode?: string) => {
    switch (mode) {
      case "agent":
        return <Zap className="w-4 h-4 text-purple-600" />;
      case "research":
        return <Search className="w-4 h-4 text-green-600" />;
      case "investigate":
        return <Eye className="w-4 h-4 text-orange-600" />;
      case "chat":
      default:
        return <Bot className="w-4 h-4 text-blue-600" />;
    }
  };

  const getModeLabel = (mode?: string) => {
    switch (mode) {
      case "agent":
        return "Agente";
      case "research":
        return "Pesquisa";
      case "investigate":
        return "Investigar";
      case "chat":
      default:
        return "Chat";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-purple" />
            <h1 className="text-2xl font-bold">IA-Facilita</h1>
            <span className="bg-purple/10 text-purple px-2 py-1 rounded-full text-xs font-medium">
              PRO
            </span>
          </div>
        </div>

        {/* Chat Interface */}
        <Card className="h-[700px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple" />
              Assistente Jurídico Avançado
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex gap-3 max-w-[85%] ${
                      message.type === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.type === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-purple/10 text-purple"
                      }`}
                    >
                      {message.type === "user" ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>

                    <div
                      className={`rounded-lg p-4 ${
                        message.type === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {/* Mode Badge */}
                      {message.mode && message.type === "user" && (
                        <div className="flex items-center gap-1 mb-2 opacity-80">
                          {getModeIcon(message.mode)}
                          <span className="text-xs">
                            {getModeLabel(message.mode)}
                          </span>
                        </div>
                      )}

                      {/* Message Content */}
                      <div className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </div>

                      {/* Files */}
                      {message.files && message.files.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-current/20">
                          <div className="text-xs opacity-80 mb-1">
                            Arquivos anexados:
                          </div>
                          {message.files.map((file, index) => (
                            <div key={index} className="text-xs opacity-70">
                              📎 {file.name}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tool Calls (Agent Mode) */}
                      {message.toolCalls && message.toolCalls.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-current/20">
                          <div className="text-xs opacity-80 mb-1">
                            🔧 Ferramentas utilizadas:
                          </div>
                          {message.toolCalls.map((call, index) => (
                            <div key={index} className="text-xs opacity-70">
                              • {call.function.name}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Sources (Research Mode) */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-current/20">
                          <div className="text-xs opacity-80 mb-1">
                            🌐 Fontes consultadas:
                          </div>
                          {message.sources.map((source, index) => (
                            <div key={index} className="text-xs opacity-70">
                              • {source.title || source.url}
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple/10 text-purple flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-purple rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-purple rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-purple rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Input */}
            <AdvancedChatInput
              value={inputMessage}
              onChange={setInputMessage}
              onSend={handleSendMessage}
              disabled={loading}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IAFacilita;
