import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from backend directory or project root
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  APP_BASE_URL: z.string().default('http://localhost:5173'),
  API_BASE_URL: z.string().default('http://localhost:3000'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.string().default('info'),

  // Google Gemini
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),

  // Supabase
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_ANON_KEY: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),

  // Storage
  SUPABASE_DOCUMENTS_BUCKET: z.string().default('enterprise-documents'),
  MAX_UPLOAD_BYTES: z.coerce.number().default(10485760), // 10MB

  // AI Limits
  AI_MAX_INPUT_CHARS: z.coerce.number().default(30000),
  AI_MAX_OUTPUT_TOKENS: z.coerce.number().default(4096),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().default(30000),
  AI_MAX_REQUESTS_PER_MINUTE: z.coerce.number().default(10),

  // Security
  INVITATION_TOKEN_TTL_HOURS: z.coerce.number().default(72),
  SIGNED_URL_TTL_SECONDS: z.coerce.number().default(300),
  SESSION_REQUIRE_CONFIRMED_EMAIL: z.coerce.boolean().default(false),

  // Workflow
  WORKFLOW_MAX_STEPS: z.coerce.number().default(20),
  WORKFLOW_MAX_EXECUTION_DEPTH: z.coerce.number().default(5),
  WORKFLOW_EXECUTION_TIMEOUT_MS: z.coerce.number().default(30000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  throw new Error('Environment configuration error');
}

export const env = parsed.data;
