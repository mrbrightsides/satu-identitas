import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertIdentity } from "@shared/schema";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useIdentities() {
  return useQuery({
    queryKey: [api.identities.list.path],
    queryFn: async () => {
      const res = await fetch(api.identities.list.path, { credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch identities');
      const data = await res.json();
      return parseWithLogging(api.identities.list.responses[200], data, "identities.list");
    },
  });
}

export function useIdentity(did: string) {
  return useQuery({
    queryKey: ['/api/did', did],
    queryFn: async () => {
      if (!did) return null;
      const encodedDid = encodeURIComponent(did);
      const res = await fetch(`/api/did/${encodedDid}`, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch identity details');
      return res.json() as Promise<Record<string, any>>;
    },
    enabled: !!did,
  });
}

export function useCreateIdentity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (identityData: InsertIdentity) => {
      const validated = api.identities.create.input.parse(identityData);
      
      const res = await fetch(api.identities.create.path, {
        method: api.identities.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = parseWithLogging(api.identities.create.responses[400], data, "identities.create.error");
          throw new Error(error.message);
        }
        throw new Error('Failed to create decentralized identity');
      }
      
      return parseWithLogging(api.identities.create.responses[201], data, "identities.create.success");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.identities.list.path] });
    },
  });
}

export function useUpdateTxHash() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ did, txHash }: { did: string, txHash: string }) => {
      const encodedDid = encodeURIComponent(did);
      const res = await fetch(`/api/did/${encodedDid}/tx`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash }),
        credentials: "include",
      });
      if (!res.ok) throw new Error('Failed to update transaction hash');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/did', variables.did] });
      queryClient.invalidateQueries({ queryKey: [api.identities.list.path] });
    },
  });
}
