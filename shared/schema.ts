import { pgTable, text, serial, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const identities = pgTable("identities", {
  id: serial("id").primaryKey(),
  idType: text("id_type").notNull(), // 'NIK' or 'KK'
  idNumber: text("id_number").notNull().unique(), // The NIK or KK number
  fullName: text("full_name").notNull(),
  did: text("did").notNull().unique(),
  txHash: text("tx_hash"),
  ipfsHash: text("ipfs_hash"), // IPFS hash for DID certificate
  status: text("status").notNull().default("pending"), // pending, registered
  createdAt: timestamp("created_at").defaultNow(),
});

export const visaIdentities = pgTable("visa_identities", {
  id: serial("id").primaryKey(),
  visaType: text("visa_type").notNull(), // 'tourist', 'work', 'business'
  passportNumber: text("passport_number").notNull().unique(),
  fullName: text("full_name").notNull(),
  nationality: text("nationality"),
  visaExpiry: timestamp("visa_expiry").notNull(),
  did: text("did").notNull().unique(),
  kycUrl: text("kyc_url"),
  auditUrl: text("audit_url"),
  txHash: text("tx_hash"),
  ipfsHash: text("ipfs_hash"),
  status: text("status").notNull().default("pending"), // pending, registered, flagged
  flaggedAt: timestamp("flagged_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Overstay event log
export const overstayEvents = pgTable("overstay_events", {
  id: serial("id").primaryKey(),
  event: text("event").notNull(), // 'OVERSTAY_DETECTED', 'STATUS_CHANGED', 'ENTRY_RECORDED'
  did: text("did").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  status: text("status").notNull().default("flagged"),
  metadata: jsonb("metadata"), // fullName, nationality, visaExpiry, overstayDuration
});

export const verifications = pgTable("verifications", {
  id: serial("id").primaryKey(),
  did: text("did").notNull(),
  verifiedAt: timestamp("verified_at").defaultNow(),
  verifierName: text("verifier_name"), // e.g., "BCA Bank", "PT Something"
  verificationReason: text("verification_reason"), // e.g., "KYC", "Account Opening", "Loan Application"
  result: text("result").notNull(), // 'verified', 'rejected', 'pending'
  metadata: jsonb("metadata"), // Extra data from verifier
});

export const fraudFlags = pgTable("fraud_flags", {
  id: serial("id").primaryKey(),
  did: text("did").notNull(),
  flagType: text("flag_type").notNull(), // 'duplicate_nik', 'duplicate_name', 'suspicious_pattern', 'manual_report'
  description: text("description"),
  severity: text("severity").notNull().default("low"), // 'low', 'medium', 'high', 'critical'
  resolved: boolean("resolved").default(false),
  relatedDIDs: text("related_dids").array(), // Array of related DIDs with similar patterns
  flaggedAt: timestamp("flagged_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertIdentitySchema = createInsertSchema(identities).omit({ 
  id: true, 
  did: true,
  txHash: true,
  status: true,
  createdAt: true 
}).extend({
  idType: z.enum(['NIK', 'KK']),
  idNumber: z.string().min(16).max(16, "NIK/KK must be 16 digits"),
  fullName: z.string().min(3)
});

export const insertVisaIdentitySchema = z.object({
  visaType: z.enum(['tourist', 'work', 'business']),
  passportNumber: z.string().min(6).max(20),
  fullName: z.string().min(3),
  nationality: z.string().optional(),
  visaExpiry: z.string().pipe(z.coerce.date()),
  kycUrl: z.string().url("Must be a valid URL to KYC service"),
  auditUrl: z.string().url("Must be a valid URL to audit trail").optional(),
});

export type Identity = typeof identities.$inferSelect;
export type VisaIdentity = typeof visaIdentities.$inferSelect;
export type OverstayEvent = typeof overstayEvents.$inferSelect;
export type Verification = typeof verifications.$inferSelect;
export type FraudFlag = typeof fraudFlags.$inferSelect;
export type InsertIdentity = z.infer<typeof insertIdentitySchema>;
export type InsertVisaIdentity = z.infer<typeof insertVisaIdentitySchema>;
export type CreateIdentityRequest = InsertIdentity;
export type CreateVisaIdentityRequest = InsertVisaIdentity;
export type IdentityResponse = Identity;
export type VisaIdentityResponse = VisaIdentity;

// Batch verification types
export interface BatchVerificationRequest {
  dids: string[];
  verifierName: string;
  reason: string;
}

export interface BatchVerificationResponse {
  results: {
    did: string;
    found: boolean;
    status?: string;
    txHash?: string;
    fraudFlags?: FraudFlag[];
  }[];
  totalChecked: number;
  validDIDs: number;
  fraudDetected: number;
}

// Fraud detection types
export interface FraudCheckResponse {
  did: string;
  hasFraudFlags: boolean;
  flags: FraudFlag[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  relatedIdentities: string[];
}
