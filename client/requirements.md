## Packages
qrcode.react | Used to generate and render the DID QR codes for users to download
framer-motion | Essential for page transitions, smooth entries, and premium micro-interactions

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  sans: ["var(--font-sans)"],
  display: ["var(--font-display)"],
}
Dynamic images are not required. We will use Unsplash for the landing page hero image.
The backend API exposes `/api/identities` for creating and fetching Decentralized Identities.
