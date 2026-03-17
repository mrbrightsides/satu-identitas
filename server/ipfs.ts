const PINATA_JWT = process.env.PINATA_JWT;

export interface DIDBlobData {
  did: string;
  type: 'identity' | 'visa';
  name: string;
  identifier: string;
  registeredAt: string;
  metadata?: Record<string, any>;
  proof?: {
    type: string;
    algorithm: string;
  };
}

export interface VisaCredentialData {
  did: string;
  type: 'visa';
  registeredAt: string;

  subject: {
    id: string;
    nationality: string;
    passportHash: string;
  };

  visa: {
    type: string;
    validFrom: string;
    validUntil: string;
  };

  entry: {
    portOfEntry: string;
    entryDate: string;
  };

  issuer: {
    id: string;
    name: string;
    issuedAt: string;
  };

  status: {
    state: 'active' | 'expired' | 'revoked';
  };

  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    jws: string;
  };
}

/**
 * Upload a Visa Verifiable Credential to IPFS via Pinata
 */
export async function uploadVisaCredentialToIPFS(data: VisaCredentialData): Promise<string> {
  if (!PINATA_JWT) {
    console.warn('⚠️  Pinata JWT not configured, skipping IPFS upload');
    return '';
  }

  try {
    const blobJson = JSON.stringify(data, null, 2);

    const formData = new FormData();
    formData.append('file', new Blob([blobJson], { type: 'application/json' }), `${data.did}.json`);

    const pinataMetadata = {
      name: `Visa Credential — ${data.subject.nationality} (${data.visa.type})`,
      keyvalues: {
        did: data.did,
        type: 'visa',
        nationality: data.subject.nationality,
        visaType: data.visa.type,
        timestamp: data.registeredAt,
      },
    };

    formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Pinata API error: ${response.statusText}`);
    }

    const result = await response.json() as { IpfsHash: string };
    const ipfsHash = result.IpfsHash;
    console.log(`✅ Uploaded to IPFS: ${data.did} → ${ipfsHash}`);
    return ipfsHash;
  } catch (error) {
    console.error('Failed to upload visa credential to IPFS:', error);
    return '';
  }
}

/**
 * Upload DID certificate to IPFS via Pinata (citizen identity)
 * Returns the IPFS hash (CID)
 */
export async function uploadDIDToIPFS(data: DIDBlobData): Promise<string> {
  if (!PINATA_JWT) {
    console.warn('⚠️  Pinata JWT not configured, skipping IPFS upload');
    return '';
  }

  try {
    const blobJson = JSON.stringify(data, null, 2);
    
    const formData = new FormData();
    formData.append('file', new Blob([blobJson], { type: 'application/json' }), `${data.did}.json`);

    const metadata = {
      name: `DID Certificate - ${data.name}`,
      keyvalues: {
        did: data.did,
        type: data.type,
        timestamp: new Date().toISOString(),
      },
    };

    formData.append('pinataMetadata', JSON.stringify(metadata));

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Pinata API error: ${response.statusText}`);
    }

    const result = await response.json() as { IpfsHash: string };
    const ipfsHash = result.IpfsHash;
    console.log(`✅ Uploaded to IPFS: ${data.did} → ${ipfsHash}`);
    return ipfsHash;
  } catch (error) {
    console.error('Failed to upload to IPFS:', error);
    return '';
  }
}

/**
 * Get IPFS URL for viewing the certificate
 */
export function getIPFSUrl(hash: string): string {
  const gateway = process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs';
  return `${gateway}/${hash}`;
}

/**
 * Get Pinata pinning URL for the certificate
 */
export function getPinataPinUrl(hash: string): string {
  return `https://pinata.cloud/pins/${hash}`;
}
