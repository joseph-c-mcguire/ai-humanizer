import supabase from '../utils/supabaseClient';

/**
 * Fetches the current user's credits, plan type, and total credits used.
 * @returns An object with credits_remaining, plan_type, and total_credits_used, or null if not found.
 */
export const getUserCredits = async (): Promise<{
  credits_remaining: number;
  plan_type: string;
  total_credits_used: number;
} | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_credits')
      .select('credits_remaining, plan_type, total_credits_used')
      .eq('id', user.id)
      .single();

    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error fetching user credits:', error);
    return null;
  }
};

/**
 * Type for a credit history entry.
 */
export type CreditHistoryItem = {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  created_at: string;
};

/**
 * Fetches the current user's credit usage history.
 * @returns An array of credit history items.
 */
export const getCreditHistory = async (): Promise<CreditHistoryItem[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('credit_usage_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error('Error fetching credit history:', error);
    return [];
  }
};
