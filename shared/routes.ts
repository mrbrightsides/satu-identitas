import { z } from 'zod';
import { insertIdentitySchema, insertVisaIdentitySchema, identities, visaIdentities } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }).passthrough(),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  identities: {
    create: {
      method: 'POST' as const,
      path: '/api/identities' as const,
      input: insertIdentitySchema,
      responses: {
        201: z.custom<typeof identities.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/identities/:did' as const,
      responses: {
        200: z.custom<typeof identities.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/identities' as const,
      responses: {
        200: z.array(z.custom<typeof identities.$inferSelect>()),
      }
    },
    updateTx: {
      method: 'PATCH' as const,
      path: '/api/identities/:did/tx' as const,
      input: z.object({ txHash: z.string() }),
      responses: {
        200: z.custom<typeof identities.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    }
  },
  visaIdentities: {
    create: {
      method: 'POST' as const,
      path: '/api/visa-identities' as const,
      input: insertVisaIdentitySchema,
      responses: {
        201: z.custom<typeof visaIdentities.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/visa-identities/:did' as const,
      responses: {
        200: z.custom<typeof visaIdentities.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    updateTx: {
      method: 'PATCH' as const,
      path: '/api/visa-identities/:did/tx' as const,
      input: z.object({ txHash: z.string() }),
      responses: {
        200: z.custom<typeof visaIdentities.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    }
  },
  verifications: {
    batch: {
      method: 'POST' as const,
      path: '/api/verifications/batch' as const,
      input: z.object({
        dids: z.array(z.string()),
        verifierName: z.string(),
        reason: z.string(),
      }),
      responses: {
        200: z.object({
          results: z.array(z.object({
            did: z.string(),
            found: z.boolean(),
            status: z.string().optional(),
            txHash: z.string().optional(),
            fraudFlags: z.array(z.object({
              flagType: z.string(),
              severity: z.string(),
            })).optional(),
          })),
          totalChecked: z.number(),
          validDIDs: z.number(),
          fraudDetected: z.number(),
        }),
        400: errorSchemas.validation,
      },
    },
    history: {
      method: 'GET' as const,
      path: '/api/identities/:did/verifications' as const,
      responses: {
        200: z.array(z.object({
          id: z.number(),
          did: z.string(),
          verifiedAt: z.date(),
          verifierName: z.string().optional(),
          result: z.string(),
        })),
        404: errorSchemas.notFound,
      },
    },
  },
  fraud: {
    check: {
      method: 'GET' as const,
      path: '/api/fraud/check/:did' as const,
      responses: {
        200: z.object({
          did: z.string(),
          hasFraudFlags: z.boolean(),
          flags: z.array(z.object({
            flagType: z.string(),
            severity: z.string(),
            description: z.string().optional(),
          })),
          riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
          relatedIdentities: z.array(z.string()),
        }),
        404: errorSchemas.notFound,
      },
    },
    report: {
      method: 'POST' as const,
      path: '/api/fraud/report' as const,
      input: z.object({
        did: z.string(),
        reason: z.string(),
        severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      }),
      responses: {
        201: z.object({
          id: z.number(),
          did: z.string(),
          flagType: z.string(),
          severity: z.string(),
        }),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
