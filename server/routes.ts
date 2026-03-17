import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { uploadDIDToIPFS, uploadVisaCredentialToIPFS, getIPFSUrl, type DIDBlobData } from "./ipfs";
import { api } from "@shared/routes";
import { z } from "zod";
import crypto from "crypto";
import { generateChatResponse } from "./gemini";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ============== VISA IDENTITY ENDPOINTS ==============
  
  app.post(api.visaIdentities.create.path, async (req, res) => {
    try {
      const input = api.visaIdentities.create.input.parse(req.body);
      
      // Generate a unique DID for visa holder
      const uniqueId = crypto.randomBytes(16).toString("hex");
      const did = `did:elpeef:visitor:${uniqueId}`;

      // Hash passport number for privacy (SHA-256)
      const passportHash = crypto.createHash('sha256').update(input.passportNumber).digest('hex');
      const issuedAt = new Date().toISOString();
      const validFrom = issuedAt;
      const validUntil = new Date(input.visaExpiry).toISOString();

      // Deterministic holder sub-DID from passport hash
      const holderDid = `did:elpeef:holder:${passportHash.substring(0, 24)}`;

      // Pseudo-proof JWS: HMAC-SHA256 of (did + passportHash) for demo purposes
      const jws = '0x' + crypto.createHmac('sha256', did).update(passportHash).digest('hex');

      const ipfsData = {
        did,
        type: 'visa' as const,
        registeredAt: issuedAt,

        subject: {
          id: holderDid,
          nationality: input.nationality,
          passportHash,
        },

        visa: {
          type: input.visaType,
          validFrom,
          validUntil,
        },

        entry: {
          portOfEntry: 'Soekarno-Hatta International Airport',
          entryDate: issuedAt,
        },

        issuer: {
          id: 'did:elpeef:issuer:indonesia-immigration',
          name: 'Direktorat Jenderal Imigrasi — Republik Indonesia',
          issuedAt,
        },

        status: {
          state: 'active' as const,
        },

        proof: {
          type: 'EcdsaSecp256k1Signature',
          created: issuedAt,
          verificationMethod: 'did:elpeef:issuer:indonesia-immigration#key-1',
          proofPurpose: 'assertionMethod',
          jws,
        },
      };

      let ipfsHash = '';
      try {
        ipfsHash = await uploadVisaCredentialToIPFS(ipfsData);
      } catch (e) {
        console.error('IPFS upload failed, continuing without IPFS hash:', e);
      }

      const visaIdentity = await storage.createVisaIdentity({
        ...input,
        did,
        visaExpiry: new Date(input.visaExpiry),
        ipfsHash: ipfsHash || undefined,
      });
      
      res.status(201).json(visaIdentity);
    } catch (err) {
      console.error("Visa registration error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // GET /api/visa-identities/flagged — must be before /:did wildcard
  app.get('/api/visa-identities/flagged', async (req, res) => {
    try {
      const flagged = await storage.getFlaggedVisas();
      return res.json(flagged);
    } catch {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.visaIdentities.get.path, async (req, res) => {
    const { did } = req.params;
    const visaIdentity = await storage.getVisaIdentityByDid(did);
    if (!visaIdentity) {
      return res.status(404).json({ message: "Visa identity not found" });
    }
    res.json(visaIdentity);
  });

  app.patch(api.visaIdentities.updateTx.path, async (req, res) => {
    try {
      const { did } = req.params;
      const input = api.visaIdentities.updateTx.input.parse(req.body);
      
      const existing = await storage.getVisaIdentityByDid(did);
      if (!existing) {
        return res.status(404).json({ message: "Visa identity not found" });
      }

      const updated = await storage.updateVisaIdTxHash(did, input.txHash);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // ============== IDENTITY ENDPOINTS ==============
  
  app.post(api.identities.create.path, async (req, res) => {
    try {
      const input = api.identities.create.input.parse(req.body);
      
      // Check for duplicates BEFORE creating
      const duplicates = await storage.checkForDuplicates(input.idNumber, input.fullName);
      if (duplicates.length > 0) {
        return res.status(400).json({
          message: "This ID number has already been registered",
          duplicateCount: duplicates.length,
        });
      }

      // Generate a unique DID
      const uniqueId = crypto.randomBytes(16).toString("hex");
      const did = `did:elpeef:citizen:${uniqueId}`;

      // Hash NIK/KK number for privacy (SHA-256)
      const idHash = crypto.createHash('sha256').update(input.idNumber).digest('hex');

      // Upload to IPFS
      const ipfsData: DIDBlobData = {
        did,
        type: 'identity',
        name: input.fullName,
        identifier: input.idNumber,
        registeredAt: new Date().toISOString(),
        metadata: {
          idType: input.idType,
          idHash,
          credentialIssuer: {
            id: 'did:elpeef:issuer:dukcapil-ri',
            name: 'Direktorat Jenderal Kependudukan dan Pencatatan Sipil — Republik Indonesia',
            platform: 'SatuIdentitas DID Network',
            issuedAt: new Date().toISOString(),
          },
        },
        proof: {
          type: 'HashProof',
          algorithm: 'SHA-256',
        },
      };

      let ipfsHash = '';
      try {
        ipfsHash = await uploadDIDToIPFS(ipfsData);
      } catch (e) {
        console.error('IPFS upload failed, continuing without IPFS hash:', e);
      }

      // Check for suspicious patterns
      await storage.checkForSuspiciousPatterns(input.idNumber);

      const identity = await storage.createIdentity({
        ...input,
        did,
        ipfsHash: ipfsHash || undefined,
      });
      
      res.status(201).json(identity);
    } catch (err) {
      console.error("Registration error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Unified DID lookup — checks citizens then visa holders
  app.get('/api/did/:did', async (req, res) => {
    const { did } = req.params;
    const citizen = await storage.getIdentityByDid(did);
    if (citizen) {
      return res.json({ ...citizen, identityType: 'citizen' });
    }
    const visitor = await storage.getVisaIdentityByDid(did);
    if (visitor) {
      return res.json({ ...visitor, identityType: 'visitor' });
    }
    return res.status(404).json({ message: "Identity not found" });
  });

  // ============== OFFLINE JWT ENDPOINTS ==============

  function base64url(buf: Buffer): string {
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  function signJWT(payload: object): string {
    const secret = process.env.SESSION_SECRET || 'satuid-fallback-secret';
    const header = base64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
    const body = base64url(Buffer.from(JSON.stringify(payload)));
    const sig = base64url(crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest());
    return `${header}.${body}.${sig}`;
  }

  function verifyJWT(token: string): Record<string, any> {
    const secret = process.env.SESSION_SECRET || 'satuid-fallback-secret';
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Malformed token');
    const [header, payload, sig] = parts;
    const expectedSig = base64url(crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest());
    if (sig !== expectedSig) throw new Error('Invalid signature — token may have been tampered');
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');
    return decoded;
  }

  // Generate offline-verifiable JWT for a DID
  app.get('/api/did/:did/offline-jwt', async (req, res) => {
    const { did } = req.params;
    const citizen = await storage.getIdentityByDid(did);
    const visitor = !citizen ? await storage.getVisaIdentityByDid(did) : null;
    const identity = citizen || visitor;
    if (!identity) return res.status(404).json({ message: 'Identity not found' });

    const now = Math.floor(Date.now() / 1000);
    const isCitizen = !!citizen;
    const ttl = isCitizen ? 365 * 24 * 3600 : 30 * 24 * 3600;

    const payload: Record<string, any> = {
      iss: `did:elpeef:issuer:${isCitizen ? 'dukcapil-ri' : 'indonesia-immigration'}`,
      sub: did,
      iat: now,
      exp: now + ttl,
      did,
      fullName: identity.fullName,
      identityType: isCitizen ? 'citizen' : 'visitor',
      status: identity.status,
      txHash: identity.txHash || null,
    };

    if (isCitizen && citizen) {
      payload.idType = (citizen as any).idType;
      payload.idHash = crypto.createHash('sha256').update((citizen as any).idNumber).digest('hex');
    } else if (visitor) {
      payload.nationality = (visitor as any).nationality;
      payload.visaType = (visitor as any).visaType;
      payload.passportHash = crypto.createHash('sha256').update((visitor as any).passportNumber).digest('hex');
      payload.visaExpiry = (visitor as any).visaExpiry;
    }

    const jwt = signJWT(payload);
    res.json({ jwt, expiresIn: isCitizen ? '1 year' : '30 days' });
  });

  // Verify offline JWT — no blockchain call needed
  app.post('/api/verify-jwt', (req, res) => {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ valid: false, message: 'token is required' });
    }
    try {
      const payload = verifyJWT(token.trim());
      res.json({ valid: true, payload });
    } catch (e: any) {
      res.status(400).json({ valid: false, message: e.message });
    }
  });

  // Unified txHash update — updates correct table based on DID prefix
  app.patch('/api/did/:did/tx', async (req, res) => {
    const { did } = req.params;
    const { txHash } = req.body;
    if (!txHash || typeof txHash !== 'string') {
      return res.status(400).json({ message: 'txHash required' });
    }
    const citizen = await storage.getIdentityByDid(did);
    if (citizen) {
      const updated = await storage.updateIdentityTxHash(did, txHash);
      return res.json({ ...updated, identityType: 'citizen' });
    }
    const visitor = await storage.getVisaIdentityByDid(did);
    if (visitor) {
      const updated = await storage.updateVisaIdTxHash(did, txHash);
      return res.json({ ...updated, identityType: 'visitor' });
    }
    return res.status(404).json({ message: "Identity not found" });
  });

  app.get(api.identities.get.path, async (req, res) => {
    const { did } = req.params;
    const identity = await storage.getIdentityByDid(did);
    if (!identity) {
      return res.status(404).json({ message: "Identity not found" });
    }
    res.json(identity);
  });

  app.get(api.identities.list.path, async (req, res) => {
    const items = await storage.getIdentities();
    res.json(items);
  });

  app.patch(api.identities.updateTx.path, async (req, res) => {
    try {
      const { did } = req.params;
      const input = api.identities.updateTx.input.parse(req.body);
      
      const existing = await storage.getIdentityByDid(did);
      if (!existing) {
        return res.status(404).json({ message: "Identity not found" });
      }

      const updated = await storage.updateTxHash(did, input.txHash);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // ============== BATCH VERIFICATION ENDPOINT ==============
  
  app.post(api.verifications.batch.path, async (req, res) => {
    try {
      const input = api.verifications.batch.input.parse(req.body);
      
      if (input.dids.length === 0) {
        return res.status(400).json({ message: "No DIDs provided" });
      }

      if (input.dids.length > 1000) {
        return res.status(400).json({ message: "Maximum 1000 DIDs per batch" });
      }

      // Batch lookup
      const identityMap = await storage.batchCheckIdentities(input.dids);
      
      const results = [];
      let validCount = 0;
      let fraudCount = 0;

      for (const did of input.dids) {
        const identity = identityMap.get(did);
        
        if (!identity) {
          results.push({
            did,
            found: false,
          });
        } else {
          validCount++;
          const fraudFlags = await storage.getFraudFlags(did);
          
          if (fraudFlags.length > 0) {
            fraudCount++;
          }

          // Record this verification
          await storage.recordVerification(
            did,
            input.verifierName,
            input.reason,
            fraudFlags.length > 0 ? "rejected" : "verified"
          );

          results.push({
            did,
            found: true,
            status: identity.status,
            txHash: identity.txHash || undefined,
            fraudFlags: fraudFlags.length > 0 ? fraudFlags.map(f => ({
              flagType: f.flagType,
              severity: f.severity,
            })) : undefined,
          });
        }
      }

      res.json({
        results,
        totalChecked: input.dids.length,
        validDIDs: validCount,
        fraudDetected: fraudCount,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // ============== VERIFICATION HISTORY ENDPOINT ==============
  
  app.get(api.verifications.history.path, async (req, res) => {
    try {
      const { did } = req.params;
      
      const identity = await storage.getIdentityByDid(did);
      if (!identity) {
        return res.status(404).json({ message: "Identity not found" });
      }

      const history = await storage.getVerificationHistory(did);
      res.json(history);
    } catch (err) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // ============== FRAUD CHECK ENDPOINT ==============
  
  app.get(api.fraud.check.path, async (req, res) => {
    try {
      const { did } = req.params;
      
      const identity = await storage.getIdentityByDid(did);
      if (!identity) {
        return res.status(404).json({ message: "Identity not found" });
      }

      const flags = await storage.getFraudFlags(did);
      
      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      const criticalCount = flags.filter(f => f.severity === 'critical').length;
      const highCount = flags.filter(f => f.severity === 'high').length;
      const mediumCount = flags.filter(f => f.severity === 'medium').length;

      if (criticalCount > 0) riskLevel = 'critical';
      else if (highCount > 0) riskLevel = 'high';
      else if (mediumCount > 0) riskLevel = 'medium';

      // Collect related identities
      const relatedDIDs = new Set<string>();
      for (const flag of flags) {
        if (flag.relatedDIDs && Array.isArray(flag.relatedDIDs)) {
          flag.relatedDIDs.forEach(d => relatedDIDs.add(d));
        }
      }

      res.json({
        did,
        hasFraudFlags: flags.length > 0,
        flags: flags.map(f => ({
          flagType: f.flagType,
          severity: f.severity,
          description: f.description || '',
        })),
        riskLevel,
        relatedIdentities: Array.from(relatedDIDs),
      });
    } catch (err) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // ============== FRAUD REPORT ENDPOINT ==============
  
  app.post(api.fraud.report.path, async (req, res) => {
    try {
      const input = api.fraud.report.input.parse(req.body);
      
      const identity = await storage.getIdentityByDid(input.did);
      if (!identity) {
        return res.status(404).json({ message: "Identity not found" });
      }

      const severity = input.severity || 'medium';
      const flag = await storage.createFraudFlag(
        input.did,
        'manual_report',
        input.reason,
        severity
      );

      res.status(201).json({
        id: flag.id,
        did: flag.did,
        flagType: flag.flagType,
        severity: flag.severity,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // ============== OVERSTAY MONITOR ENDPOINTS ==============

  // GET /api/overstay-events — latest overstay event log
  app.get('/api/overstay-events', async (req, res) => {
    try {
      const limit = parseInt((req.query.limit as string) || '50', 10);
      const events = await storage.getOverstayEvents(limit);
      return res.json(events);
    } catch {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // GET /api/overstay-events/:did — events for a specific DID
  app.get('/api/overstay-events/:did', async (req, res) => {
    try {
      const did = decodeURIComponent(req.params.did);
      const events = await storage.getOverstayEventsByDid(did);
      return res.json(events);
    } catch {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // POST /api/overstay-events/trigger — manual trigger (for demo/testing)
  app.post('/api/overstay-events/trigger', async (req, res) => {
    try {
      const expired = await storage.getExpiredVisas();
      const triggered: string[] = [];
      const now = new Date();

      for (const visa of expired) {
        const diffMs = now.getTime() - visa.visaExpiry.getTime();
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        const overstayDuration = hours >= 24
          ? `${Math.floor(hours / 24)}d ${hours % 24}h ${minutes}m`
          : `${hours}h ${minutes}m`;

        await storage.flagOverstay(visa.did);
        await storage.createOverstayEvent(visa.did, 'OVERSTAY_DETECTED', 'flagged', {
          fullName: visa.fullName,
          nationality: visa.nationality ?? 'Unknown',
          passportNumber: visa.passportNumber,
          visaType: visa.visaType,
          visaExpiry: visa.visaExpiry.toISOString(),
          overstayDuration,
          detectedAt: now.toISOString(),
        });
        triggered.push(visa.did);
      }

      return res.json({
        triggered: triggered.length,
        dids: triggered,
        message: triggered.length === 0
          ? 'No expired visas found'
          : `Flagged ${triggered.length} overstay(s)`,
      });
    } catch {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // ============== CHATBOT (Gemini) ==============

  app.post('/api/chat', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    console.log('[chat] handler reached, body:', JSON.stringify(req.body).slice(0, 100));
    try {
      const { messages, message } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).end(JSON.stringify({ message: "message is required" }));
        return;
      }

      const history: { role: "user" | "model"; content: string }[] = Array.isArray(messages)
        ? messages.filter((m: any) => m.role && m.content)
        : [];

      const reply = await generateChatResponse(history, message);
      res.status(200).end(JSON.stringify({ reply }));
    } catch (err: any) {
      console.error("[chat] Error:", err?.message || err);
      const msg = err?.message?.includes("GEMINI_API_KEY")
        ? "AI service not configured"
        : "Failed to get AI response";
      res.status(500).end(JSON.stringify({ message: msg }));
    }
  });

  return httpServer;
}
