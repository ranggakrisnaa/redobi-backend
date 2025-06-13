import validateConfig from '@/utils/validate-config';
import { registerAs } from '@nestjs/config';
import { IsString } from 'class-validator';
import process from 'node:process';
import { SupabaseConfig } from './supabase.config.type';

export class EnvironmentVariablesValidator {
  @IsString()
  SUPABASE_URL: string;

  @IsString()
  SUPABASE_KEY: string;
}

export default registerAs<SupabaseConfig>('supabase', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
  };
});
