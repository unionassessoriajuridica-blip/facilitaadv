import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Shield,
  Calendar,
  FileText,
  Bot,
  Scale,
  Clock,
  Wallet,
  CreditCard,
  Send,
  CheckCircle,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { SiFacebook, SiX, SiLinkedin } from "react-icons/si";
import { useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    { icon: Bot, title: "Automacao de Tarefas", description: "Automatize processos repetitivos" },
    { icon: Shield, title: "Criptografia SSL de 256 bits", description: "Protecao avancada para seus dados" },
    { icon: Calendar, title: "Agendamento Inteligente", description: "Gerencie compromissos facilmente" },
    { icon: FileText, title: "Geracao de Documentos", description: "Crie documentos rapidamente" },
  ];

  const diferenciais = [
    {
      icon: Scale,
      title: "Integracao com DataJud",
      description: "Protecao avancada para seus dados sensiveis",
    },
    {
      icon: Bot,
      title: "Pecas Juridicas com IA e assinadas digitalmente",
      description: "Geracao rapida de peticoes com modelos integrados",
    },
    {
      icon: Clock,
      title: "Gestao Proativa de Prazos",
      description: "Alertas automaticos e controle de prazos para evitar perdas",
    },
    {
      icon: Wallet,
      title: "Controle Financeiro",
      description: "Controle financeiro e emissao de recibos e controles de financeiro",
    },
    {
      icon: Send,
      title: "Cobranca Automatica",
      description: "Geracao rapida de peticoes com modelos integrados",
    },
    {
      icon: CreditCard,
      title: "Integracao com Gateway de Pagamento",
      description: "Alertas automaticos e controle de prazos para evitar perdas",
    },
  ];

  const faqItems = [
    {
      question: "Como a automacao melhora a eficiencia do escritorio?",
      answer: "Como a automacao melhora a eficiencia do escritorio? As veus dados esse econoe e donn em multinoras voriminas.",
    },
    {
      question: "Os meus dados estao seguros?",
      answer: "Sim, utilizamos criptografia SSL de 256 bits e seguimos todas as normas da LGPD para proteger seus dados.",
    },
    {
      question: "Qual e o custo da implementacao?",
      answer: "O custo varia de acordo com o plano escolhido. Entre em contato para uma proposta personalizada.",
    },
    {
      question: "Ha suporte tecnico disponivel?",
      answer: "Sim, oferecemos suporte tecnico por chat, email e telefone em horario comercial.",
    },
    {
      question: "Integra com outros sistemas que ja uso?",
      answer: "Integra ar integra com outros sistemas que ja uso.",
    },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-amber-400" />
            <span className="font-bold text-lg">Facilita ADV</span>
          </div>
          
          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollToSection("diferenciais")}
              className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium"
              data-testid="link-solucoes"
            >
              Solucoes
            </button>
            <button
              onClick={() => scrollToSection("diferenciais")}
              className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium"
              data-testid="link-funcionalidades"
            >
              Funcionalidades
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium"
              data-testid="link-seguranca"
            >
              Seguranca
            </button>
            <Link
              to="/sobre"
              className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium"
              data-testid="link-sobre"
            >
              Sobre
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/auth")}
              className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900"
              data-testid="button-header-login"
            >
              Login
            </Button>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-800 px-4 py-3 space-y-2">
            <button
              onClick={() => scrollToSection("diferenciais")}
              className="block w-full text-left text-sm text-amber-400 hover:text-amber-300 py-2 font-medium"
            >
              Solucoes
            </button>
            <button
              onClick={() => scrollToSection("diferenciais")}
              className="block w-full text-left text-sm text-amber-400 hover:text-amber-300 py-2 font-medium"
            >
              Funcionalidades
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="block w-full text-left text-sm text-amber-400 hover:text-amber-300 py-2 font-medium"
            >
              Seguranca
            </button>
            <Link
              to="/sobre"
              className="block text-sm text-amber-400 hover:text-amber-300 py-2 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sobre
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 md:py-24">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Eleve Sua Pratica Juridica
            <br />
            <span className="text-amber-400">com Automacao Inteligente</span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8 text-sm md:text-base">
            Simplifique fluxos de trabalho, proteja dados com criptografia SSL de 256 bits e foque no que importa. O futuro do direito esta aqui.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-8"
            data-testid="button-comece-hoje"
          >
            Comece Hoje
          </Button>
        </div>

        {/* Features Bar */}
        <div className="container mx-auto px-4 mt-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center p-4 bg-white/5 rounded-lg backdrop-blur-sm"
              >
                <feature.icon className="w-8 h-8 text-amber-400 mb-2" />
                <span className="text-sm font-medium">{feature.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais Section */}
      <section id="diferenciais" className="py-16 bg-gray-50 dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-foreground">
            Nossos Diferenciais Unicos
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {diferenciais.map((item, index) => (
              <Card
                key={index}
                className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-700"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-amber-200 dark:bg-amber-700 rounded-lg">
                      <item.icon className="w-6 h-6 text-amber-700 dark:text-amber-200" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-sm text-muted-foreground uppercase tracking-wider">FAQ</span>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-2">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3">
              {faqItems.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border rounded-lg px-4 bg-card"
                >
                  <AccordionTrigger
                    className="text-left text-sm md:text-base"
                    data-testid={`faq-question-${index}`}
                  >
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Sobre</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link to="/" className="hover:text-white transition-colors">Inicio</Link>
                </li>
                <li>
                  <Link to="/sobre" className="hover:text-white transition-colors">Sobre Nos</Link>
                </li>
                <li>
                  <Link to="/contato" className="hover:text-white transition-colors">Contato</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Funcionalidades</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <button onClick={() => scrollToSection("diferenciais")} className="hover:text-white transition-colors">
                    Carreiras
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("diferenciais")} className="hover:text-white transition-colors">
                    Visao
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("diferenciais")} className="hover:text-white transition-colors">
                    Previsibilidade
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Seguranca</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link to="/politica-privacidade" className="hover:text-white transition-colors">
                    Politica de Privacidade
                  </Link>
                </li>
                <li>
                  <Link to="/termos-servico" className="hover:text-white transition-colors">
                    Termos de Servico
                  </Link>
                </li>
                <li>
                  <Link to="/termos-servico" className="hover:text-white transition-colors">
                    Termos & Condicoes
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Follow Us</h4>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
                  data-testid="link-facebook"
                >
                  <SiFacebook className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
                  data-testid="link-twitter"
                >
                  <SiX className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
                  data-testid="link-linkedin"
                >
                  <SiLinkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-400" />
              <span className="text-sm">Facilita ADV - Escritorio de advocacia autiSeomo</span>
            </div>
            <span className="text-sm text-gray-400">© 2024 Todos os direitos reservados</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
