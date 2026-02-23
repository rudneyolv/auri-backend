import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN_TOKEN } from './supabase.tokens';

export const SupabaseAdminProvider = {
  provide: SUPABASE_ADMIN_TOKEN,
  useFactory: () => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        'Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias para o cliente admin.',
      );
    }

    return createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  },
};
