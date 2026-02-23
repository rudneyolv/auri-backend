import { createClient } from '@supabase/supabase-js';
import { SUPABASE_TOKEN } from './supabase.tokens';

export const SupabaseProvider = {
  provide: SUPABASE_TOKEN,
  useFactory: () => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      throw new Error(
        'Variáveis de ambiente SUPABASE_URL e SUPABASE_KEY são necessárias para o cliente',
      );
    }

    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  },
};
