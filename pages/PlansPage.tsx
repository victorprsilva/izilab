import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Crown, Zap, Star, Sparkles, Loader2, Settings } from 'lucide-react';
import { stripeService, STRIPE_PRICES, PlanType } from '../services/stripeService';
import type { Session } from '@supabase/supabase-js';
import Logo from '../components/Logo';

interface PlansPageProps {
  session: Session | null;
}

const PlansPage: React.FC<PlansPageProps> = ({ session }) => {
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState<PlanType>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      if (session?.user?.id) {
        try {
          const plan = await stripeService.getCurrentPlan(session.user.id);
          setCurrentPlan(plan);
          const subscription = await stripeService.getActiveSubscription(session.user.id);
          setHasSubscription(!!subscription);
        } catch (error) {
          console.error('Error fetching plan:', error);
        }
      }
      setIsLoading(false);
    };
    fetchCurrentPlan();
  }, [session]);

  const handleSelectPlan = async (planId: string) => {
    if (!session) {
      navigate('/login');
      return;
    }

    if (planId === 'free' || planId === currentPlan) return;

    setIsProcessing(planId);
    try {
      if (planId === 'pro') {
        await stripeService.redirectToCheckout(STRIPE_PRICES.PRO);
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Erro ao processar. Tente novamente.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleManageSubscription = async () => {
    setIsProcessing('manage');
    try {
      await stripeService.redirectToPortal();
    } catch (error) {
      console.error('Error opening portal:', error);
      alert('Erro ao abrir portal. Tente novamente.');
    } finally {
      setIsProcessing(null);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Gratuito',
      price: 'R$ 0',
      period: '/mês',
      description: 'Para começar a explorar',
      icon: Zap,
      features: [
        '5 análises por mês',
        'Upload de até 3 arquivos',
        'Resultados básicos',
        'Suporte por email',
      ],
      buttonText: currentPlan === 'free' ? 'Plano Atual' : 'Selecionar',
      isPopular: false,
      isCurrent: currentPlan === 'free',
      isAvailable: true,
    },
    {
      id: 'pro',
      name: 'Profissional',
      price: 'R$ 49',
      period: '/mês',
      description: 'Para profissionais de saúde',
      icon: Crown,
      features: [
        'Análises ilimitadas',
        'Upload ilimitado de arquivos',
        'Resultados detalhados',
        'Customização de abreviações',
        'Exportação em PDF',
        'Suporte prioritário',
      ],
      buttonText: currentPlan === 'pro' ? 'Plano Atual' : 'Assinar Agora',
      isPopular: true,
      isCurrent: currentPlan === 'pro',
      isAvailable: true,
    },
    {
      id: 'enterprise',
      name: 'Empresarial',
      price: 'R$ 199',
      period: '/mês',
      description: 'Para clínicas e hospitais',
      icon: Star,
      features: [
        'Tudo do Profissional',
        'Múltiplos usuários',
        'API de integração',
        'Dashboard administrativo',
        'Relatórios avançados',
        'Suporte dedicado 24/7',
      ],
      buttonText: 'Em Breve',
      isPopular: false,
      isCurrent: false,
      isAvailable: false,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-brand-start" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')} 
            className="hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand-start rounded-xl p-1 -ml-1"
            title="Voltar ao início"
          >
            <Logo />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-start/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-end/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-6xl relative z-10">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Voltar</span>
          </button>

          {/* Page Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-start/10 border border-brand-start/20 text-brand-start text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles size={14} />
              Escolha seu plano
            </div>
            <h1 className="text-4xl font-bold text-white">Planos e Preços</h1>
            <p className="text-slate-400 mt-3 max-w-xl mx-auto">
              Escolha o plano ideal para suas necessidades. Todos os planos incluem acesso à nossa tecnologia de IA.
            </p>
            {hasSubscription && (
              <button
                onClick={handleManageSubscription}
                disabled={isProcessing === 'manage'}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surfaceHighlight hover:bg-border text-white text-sm font-medium transition-colors border border-border"
              >
                {isProcessing === 'manage' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Settings size={16} />
                )}
                Gerenciar Assinatura
              </button>
            )}
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan) => {
              const IconComponent = plan.icon;
              return (
                <div
                  key={plan.id}
                  className={`relative bg-surface/50 backdrop-blur-xl border rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                    plan.isPopular
                      ? 'border-brand-start shadow-xl shadow-brand-start/20'
                      : 'border-border hover:border-brand-start/30'
                  } ${plan.isCurrent ? 'ring-2 ring-green-500/50' : ''}`}
                >
                  {/* Popular Badge */}
                  {plan.isPopular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-brand-start to-brand-end text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl">
                      Mais Popular
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {plan.isCurrent && (
                    <div className="absolute top-0 left-0 bg-green-500 text-white text-xs font-bold px-4 py-1.5 rounded-br-xl">
                      Seu Plano
                    </div>
                  )}

                  <div className="p-6 lg:p-8">
                    {/* Plan Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      plan.isPopular 
                        ? 'bg-gradient-to-br from-brand-start to-brand-end text-white' 
                        : 'bg-surfaceHighlight text-slate-400'
                    }`}>
                      <IconComponent size={24} />
                    </div>

                    {/* Plan Name & Description */}
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-slate-400 text-sm mt-1">{plan.description}</p>

                    {/* Price */}
                    <div className="mt-6 mb-6">
                      <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                      <span className="text-slate-400">{plan.period}</span>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            plan.isPopular ? 'bg-brand-start/20 text-brand-start' : 'bg-green-500/20 text-green-500'
                          }`}>
                            <Check size={12} />
                          </div>
                          <span className="text-slate-300 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={plan.isCurrent || !plan.isAvailable || isProcessing === plan.id}
                      className={`w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                        plan.isCurrent
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                          : !plan.isAvailable
                          ? 'bg-slate-700/50 text-slate-500 border border-slate-600/30 cursor-not-allowed'
                          : plan.isPopular
                          ? 'bg-gradient-to-r from-brand-start to-brand-end hover:from-brand-600 hover:to-brand-700 text-white shadow-lg shadow-brand-start/20 hover:shadow-brand-start/40 active:scale-[0.98]'
                          : 'bg-surfaceHighlight hover:bg-border text-white border border-border'
                      }`}
                    >
                      {isProcessing === plan.id && <Loader2 size={18} className="animate-spin" />}
                      {plan.buttonText}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FAQ or Additional Info */}
          <div className="mt-12 text-center">
            <p className="text-slate-400 text-sm">
              Dúvidas? Entre em contato pelo{' '}
              <a href="mailto:suporte@izilab.com" className="text-brand-start hover:text-brand-end transition-colors">
                suporte@izilab.com
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlansPage;
