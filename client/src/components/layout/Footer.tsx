import { ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-white border-t py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <div>
              <h2 className="font-display font-bold text-xl">SatuIdentitas</h2>
              <p className="text-xs text-muted-foreground">Decentralized ID on Sepolia Testnet</p>
            </div>
          </div>
          
          <div className="flex gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/register" className="hover:text-primary transition-colors">Register</Link>
            <Link href="/verify" className="hover:text-primary transition-colors">Verify</Link>
            <a href="https://sepolia.etherscan.io/" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">Etherscan</a>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Indonesia DID Network. Open Source Initiative.</p>
          <p className="mt-2 md:mt-0 flex items-center gap-1">
            Built for security. Powered by Ethereum.
          </p>
        </div>
      </div>
    </footer>
  );
}
