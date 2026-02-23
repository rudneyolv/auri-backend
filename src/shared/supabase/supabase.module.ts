import { Module } from '@nestjs/common';
import { SupabaseProvider } from './supabase.provider';
import { SupabaseAdminProvider } from './supabase-admin.provider';

@Module({
  providers: [SupabaseProvider, SupabaseAdminProvider],
  exports: [SupabaseProvider, SupabaseAdminProvider],
})
export class SupabaseModule {}
