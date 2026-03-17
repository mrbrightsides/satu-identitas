import { db } from "./db";
import {
  identities,
  visaIdentities,
  verifications,
  fraudFlags,
  overstayEvents,
  type InsertIdentity,
  type InsertVisaIdentity,
  type Identity,
  type VisaIdentity,
  type Verification,
  type FraudFlag,
  type OverstayEvent,
} from "@shared/schema";
import { eq, and, inArray, like, lt, ne, desc } from "drizzle-orm";

export interface IStorage {
  // Identities
  getIdentities(): Promise<Identity[]>;
  getIdentityByDid(did: string): Promise<Identity | undefined>;
  createIdentity(identity: InsertIdentity & { did: string }): Promise<Identity>;
  updateTxHash(did: string, txHash: string): Promise<Identity>;
  
  // Visa Identities
  getVisaIdentities(): Promise<VisaIdentity[]>;
  getVisaIdentityByDid(did: string): Promise<VisaIdentity | undefined>;
  createVisaIdentity(identity: InsertVisaIdentity & { did: string }): Promise<VisaIdentity>;
  updateVisaIdTxHash(did: string, txHash: string): Promise<VisaIdentity>;
  
  // Verifications
  recordVerification(did: string, verifierName: string, reason: string, result: string): Promise<Verification>;
  getVerificationHistory(did: string): Promise<Verification[]>;
  batchCheckIdentities(dids: string[]): Promise<Map<string, Identity | undefined>>;
  
  // Fraud Detection
  createFraudFlag(did: string, flagType: string, description: string, severity: string, relatedDIDs?: string[]): Promise<FraudFlag>;
  getFraudFlags(did: string): Promise<FraudFlag[]>;
  checkForDuplicates(idNumber: string, fullName: string): Promise<string[]>;
  checkForSuspiciousPatterns(idNumber: string): Promise<string[]>;

  // Overstay Detection
  getExpiredVisas(): Promise<VisaIdentity[]>;
  flagOverstay(did: string): Promise<VisaIdentity>;
  createOverstayEvent(did: string, event: string, status: string, metadata?: Record<string, unknown>): Promise<OverstayEvent>;
  getOverstayEvents(limit?: number): Promise<OverstayEvent[]>;
  getOverstayEventsByDid(did: string): Promise<OverstayEvent[]>;
  getFlaggedVisas(): Promise<VisaIdentity[]>;

  // Alias
  updateIdentityTxHash(did: string, txHash: string): Promise<Identity>;
}

export class DatabaseStorage implements IStorage {
  // Identity Methods
  async getIdentities(): Promise<Identity[]> {
    return await db.select().from(identities);
  }

  async getIdentityByDid(did: string): Promise<Identity | undefined> {
    const [identity] = await db.select().from(identities).where(eq(identities.did, did));
    return identity;
  }

  async createIdentity(identity: InsertIdentity & { did: string; ipfsHash?: string }): Promise<Identity> {
    const [created] = await db.insert(identities).values(identity).returning();
    return created;
  }

  async updateTxHash(did: string, txHash: string): Promise<Identity> {
    const [updated] = await db.update(identities)
      .set({ txHash, status: 'registered' })
      .where(eq(identities.did, did))
      .returning();
    return updated;
  }

  // Visa Identity Methods
  async getVisaIdentities(): Promise<VisaIdentity[]> {
    return await db.select().from(visaIdentities);
  }

  async getVisaIdentityByDid(did: string): Promise<VisaIdentity | undefined> {
    const [identity] = await db.select().from(visaIdentities).where(eq(visaIdentities.did, did));
    return identity;
  }

  async createVisaIdentity(identity: InsertVisaIdentity & { did: string; ipfsHash?: string }): Promise<VisaIdentity> {
    const [created] = await db.insert(visaIdentities).values(identity).returning();
    return created;
  }

  async updateVisaIdTxHash(did: string, txHash: string): Promise<VisaIdentity> {
    const [updated] = await db.update(visaIdentities)
      .set({ txHash, status: 'registered' })
      .where(eq(visaIdentities.did, did))
      .returning();
    return updated;
  }

  // Verification Methods
  async recordVerification(did: string, verifierName: string, reason: string, result: string): Promise<Verification> {
    const [verification] = await db.insert(verifications).values({
      did,
      verifierName,
      verificationReason: reason,
      result,
    }).returning();
    return verification;
  }

  async getVerificationHistory(did: string): Promise<Verification[]> {
    return await db.select().from(verifications).where(eq(verifications.did, did));
  }

  async batchCheckIdentities(dids: string[]): Promise<Map<string, Identity | undefined>> {
    const results = await db.select().from(identities).where(inArray(identities.did, dids));
    const map = new Map<string, Identity>();
    results.forEach(identity => {
      map.set(identity.did, identity);
    });
    
    dids.forEach(did => {
      if (!map.has(did)) {
        map.set(did, undefined as any);
      }
    });
    
    return map;
  }

  // Fraud Detection Methods
  async createFraudFlag(
    did: string,
    flagType: string,
    description: string,
    severity: string,
    relatedDIDs?: string[]
  ): Promise<FraudFlag> {
    const [flag] = await db.insert(fraudFlags).values({
      did,
      flagType,
      description,
      severity,
      relatedDIDs: relatedDIDs || [],
    }).returning();
    return flag;
  }

  async getFraudFlags(did: string): Promise<FraudFlag[]> {
    return await db.select().from(fraudFlags).where(
      and(
        eq(fraudFlags.did, did),
        eq(fraudFlags.resolved, false)
      )
    );
  }

  async checkForDuplicates(idNumber: string, fullName: string): Promise<string[]> {
    const duplicateNik = await db.select().from(identities).where(
      eq(identities.idNumber, idNumber)
    );

    const duplicateDids: string[] = [];
    
    if (duplicateNik.length > 0) {
      duplicateDids.push(...duplicateNik.map(i => i.did));
      
      for (const identity of duplicateNik) {
        await this.createFraudFlag(
          identity.did,
          'duplicate_nik',
          `Same NIK/KK already registered`,
          'high',
          duplicateDids
        );
      }
    }

    return duplicateDids;
  }

  async checkForSuspiciousPatterns(idNumber: string): Promise<string[]> {
    const regionCode = idNumber.substring(0, 6);
    const similars = await db.select().from(identities).where(
      like(identities.idNumber, `${regionCode}%`)
    );

    const suspiciousDids: string[] = [];

    if (similars.length > 10) {
      for (const identity of similars) {
        const existing = await this.getFraudFlags(identity.did);
        if (!existing.some(f => f.flagType === 'suspicious_pattern')) {
          await this.createFraudFlag(
            identity.did,
            'suspicious_pattern',
            `Unusual number of registrations from same region`,
            'medium',
            similars.map(s => s.did)
          );
          suspiciousDids.push(identity.did);
        }
      }
    }

    return suspiciousDids;
  }

  // Overstay Detection Methods
  async getExpiredVisas(): Promise<VisaIdentity[]> {
    const now = new Date();
    return await db.select().from(visaIdentities).where(
      and(
        lt(visaIdentities.visaExpiry, now),
        ne(visaIdentities.status, 'flagged')
      )
    );
  }

  async flagOverstay(did: string): Promise<VisaIdentity> {
    const [updated] = await db.update(visaIdentities)
      .set({ status: 'flagged', flaggedAt: new Date() })
      .where(eq(visaIdentities.did, did))
      .returning();
    return updated;
  }

  async createOverstayEvent(
    did: string,
    event: string,
    status: string,
    metadata?: Record<string, unknown>
  ): Promise<OverstayEvent> {
    const [created] = await db.insert(overstayEvents).values({
      event,
      did,
      status,
      metadata: metadata || null,
    }).returning();
    return created;
  }

  async getOverstayEvents(limit = 50): Promise<OverstayEvent[]> {
    return await db.select().from(overstayEvents)
      .orderBy(desc(overstayEvents.timestamp))
      .limit(limit);
  }

  async getOverstayEventsByDid(did: string): Promise<OverstayEvent[]> {
    return await db.select().from(overstayEvents)
      .where(eq(overstayEvents.did, did))
      .orderBy(desc(overstayEvents.timestamp));
  }

  async getFlaggedVisas(): Promise<VisaIdentity[]> {
    return await db.select().from(visaIdentities)
      .where(eq(visaIdentities.status, 'flagged'))
      .orderBy(desc(visaIdentities.flaggedAt));
  }

  // Alias for routes compatibility
  async updateIdentityTxHash(did: string, txHash: string): Promise<Identity> {
    return this.updateTxHash(did, txHash);
  }
}

export const storage = new DatabaseStorage();
