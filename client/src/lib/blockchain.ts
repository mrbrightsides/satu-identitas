import { SEPOLIA_CONFIG } from "@shared/blockchain";

export function getEtherscanUrl(txHash: string): string {
  return `${SEPOLIA_CONFIG.ETHERSCAN_URL}/tx/${txHash}`;
}

export function getContractAddress(): string {
  return SEPOLIA_CONFIG.CONTRACT_ADDRESS;
}

export function isValidDID(did: string): boolean {
  return did.startsWith("did:elpeef:citizen:") || did.startsWith("did:elpeef:visitor:");
}
