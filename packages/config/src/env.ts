import { z } from 'zod';

const booleanString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().url(),
    SESSION_SECRET: z.string().min(32),
    DEV_AUTH_ENABLED: booleanString.default('false'),
    PAYMENT_PROVIDER: z
      .enum(['mock', 'offline_merchant_direct', 'wechat_service_provider', 'wechat_platform'])
      .default('mock'),
    ORDER_PAYMENT_TIMEOUT_MINUTES: z.coerce.number().int().min(1).max(60).default(10),
    CORS_ORIGINS: z.string().default('http://localhost:5173'),
  })
  .superRefine((env, context) => {
    if (env.NODE_ENV === 'production' && env.DEV_AUTH_ENABLED) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['DEV_AUTH_ENABLED'],
        message: 'DEV_AUTH_ENABLED must be false in production',
      });
    }
    if (env.NODE_ENV === 'production' && env.PAYMENT_PROVIDER === 'mock') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['PAYMENT_PROVIDER'],
        message: 'mock payments are forbidden in production',
      });
    }
  });

export type AppEnv = z.infer<typeof envSchema>;

export function parseEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(source);
}
