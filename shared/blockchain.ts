const INFURA_KEY =
  (import.meta as any).env?.VITE_INFURA_KEY ||
  "f8d248f838ec4f12b0f01efd2b238206";

const CONTRACT_ADDRESS =
  (import.meta as any).env?.VITE_CONTRACT_ADDRESS ||
  "0xc0B12ACf49BA12655ae561f102FF8d22D2d9902C";

export const SEPOLIA_CONFIG = {
  CONTRACT_ADDRESS,
  INFURA_KEY,
  RPC_URL: `https://sepolia.infura.io/v3/${INFURA_KEY}`,
  NETWORK_ID: 11155111,
  NETWORK_NAME: "Sepolia",
  ETHERSCAN_URL: "https://sepolia.etherscan.io",
};

export const DID_REGISTRY_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "string", name: "did", type: "string" },
      { indexed: false, internalType: "string", name: "idHash", type: "string" },
      { indexed: true, internalType: "address", name: "owner", type: "address" },
    ],
    name: "DIDRegistered",
    type: "event",
  },
  {
    inputs: [
      { internalType: "string", name: "_did", type: "string" },
      { internalType: "string", name: "_idHash", type: "string" },
    ],
    name: "registerDID",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_did", type: "string" }],
    name: "getIdentity",
    outputs: [
      { internalType: "string", name: "", type: "string" },
      { internalType: "string", name: "", type: "string" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "address", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "", type: "string" }],
    name: "identities",
    outputs: [
      { internalType: "string", name: "did", type: "string" },
      { internalType: "string", name: "idHash", type: "string" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "address", name: "owner", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
