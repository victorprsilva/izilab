import { supabase } from './supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// IDs dos preços do Stripe (sandbox)
export const STRIPE_PRICES = {
  FREE: 'price_1StrFz1d9SPexqgf9h51340y',
  PRO: 'price_1StrGv1d9SPexqgf7IAils8y',
} as const;

export type PlanType = 'free' | 'pro';

export interface Subscription {
  id: string;
  user_id: string;
  price_id: string | null;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export interface SubscriptionWithProduct extends Subscription {
  stripe_prices?: {
    id: string;
    unit_amount: number;
    stripe_products?: {
      id: string;
      name: string;
    };
  };
}

export const stripeService = {
  /**
   * Busca a assinatura ativa do usuário
   */
  async getActiveSubscription(userId: string): Promise<SubscriptionWithProduct | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data;
  },

  /**
   * Retorna o plano atual do usuário baseado na assinatura
   */
  async getCurrentPlan(userId: string): Promise<PlanType> {
    const subscription = await this.getActiveSubscription(userId);
    
    if (!subscription || !['active', 'trialing'].includes(subscription.status)) {
      return 'free';
    }

    if (subscription.price_id === STRIPE_PRICES.PRO) {
      return 'pro';
    }

    return 'free';
  },

  /**
   * Cria uma sessão de checkout para upgrade de plano
   */
  async createCheckoutSession(priceId: string, successUrl?: string, cancelUrl?: string): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        priceId,
        successUrl: successUrl || `${window.location.origin}/`,
        cancelUrl: cancelUrl || `${window.location.origin}/plans`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const { url } = await response.json();
    return url;
  },

  /**
   * Cria uma sessão do portal do cliente Stripe
   */
  async createPortalSession(returnUrl?: string): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        returnUrl: returnUrl || window.location.href,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create portal session');
    }

    const { url } = await response.json();
    return url;
  },

  /**
   * Redireciona para o checkout do Stripe
   */
  async redirectToCheckout(priceId: string): Promise<void> {
    const url = await this.createCheckoutSession(priceId);
    if (url) {
      window.location.href = url;
    }
  },

  /**
   * Redireciona para o portal do cliente Stripe
   */
  async redirectToPortal(): Promise<void> {
    const url = await this.createPortalSession();
    if (url) {
      window.location.href = url;
    }
  },

  /**
   * Verifica se o usuário tem um plano pago ativo
   */
  async hasPaidPlan(userId: string): Promise<boolean> {
    const plan = await this.getCurrentPlan(userId);
    return plan !== 'free';
  },

  /**
   * Busca todos os produtos e preços disponíveis
   */
  async getProducts() {
    const { data, error } = await supabase
      .from('stripe_products')
      .select(`
        *,
        stripe_prices (*)
      `)
      .eq('active', true)
      .order('name');

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data;
  },
};
