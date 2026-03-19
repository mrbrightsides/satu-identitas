import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCreateIdentity, useUpdateTxHash } from "@/hooks/use-identities";
import { useBlockchain } from "@/hooks/use-blockchain";

// Client-side schema mirroring the backend for form validation
const formSchema = z.object({
  idType: z.enum(['NIK', 'KK'], { required_error: "Please select an ID type." }),
  idNumber: z.string()
    .min(16, "Must be exactly 16 digits")
    .max(16, "Must be exactly 16 digits")
    .regex(/^\d+$/, "Must contain only numbers"),
  fullName: z.string()
    .min(3, "Full name must be at least 3 characters")
    .max(100, "Name is too long"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createIdentity = useCreateIdentity();
  const updateTxHash = useUpdateTxHash();
  const blockchain = useBlockchain();
  const [isRegistering, setIsRegistering] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      idNumber: "",
      fullName: "",
    },
  });

  async function onSubmit(data: FormValues) {
    try {
      setIsRegistering(true);
      
      // Create identity first
      const result = await createIdentity.mutateAsync(data);
      
      toast({
        title: "DID Created",
        description: "Registering on Sepolia blockchain...",
      });
      
      // Automatically register on blockchain
      try {
        const txHash = await blockchain.registerDIDOnBlockchain(result.did, data.idNumber);
        
        // Save the transaction hash to the database
        await updateTxHash.mutateAsync({ did: result.did, txHash });
        
        toast({
          title: "Success!",
          description: "Your DID is now anchored on Sepolia and saved.",
        });
      } catch (blockchainError: any) {
        // Still navigate even if blockchain registration fails - user can retry from detail page
        toast({
          variant: "default",
          title: "DID Created",
          description: "You can register it on blockchain from the next screen.",
        });
      }
      
      // Navigate to the DID detail page
      setLocation(`/did/${result.did}`);
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
              <ShieldAlert className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground">Migrate to Decentralized ID</h1>
            <p className="mt-2 text-muted-foreground">
              Securely map your National Identity (NIK) or Family Card (KK) to the blockchain.
            </p>
          </div>

          <Card className="border-border/50 shadow-xl shadow-black/5 overflow-hidden">
            {/* Decorative top border */}
            <div className="h-1.5 w-full bg-gradient-to-r from-primary to-orange-400"></div>
            
            <CardHeader className="bg-white pb-8">
              <CardTitle className="text-2xl">Identity Information</CardTitle>
              <CardDescription>
                Your data is cryptographically hashed. We never store raw ID numbers publicly.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="bg-white">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="idType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Document Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl border-border/60 focus:ring-primary/20 transition-all">
                              <SelectValue placeholder="Select NIK or KK" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="NIK">Kartu Tanda Penduduk (KTP / NIK)</SelectItem>
                            <SelectItem value="KK">Kartu Keluarga (KK)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>Choose the type of ID you are registering.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="idNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">16-Digit Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. 3171234567890001" 
                            className="h-12 rounded-xl font-mono text-lg tracking-widest border-border/60 focus:ring-primary/20 transition-all" 
                            {...field} 
                            maxLength={16}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Full Name as on Document</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="John Doe" 
                            className="h-12 rounded-xl border-border/60 focus:ring-primary/20 transition-all" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full h-14 rounded-xl text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all hover:-translate-y-0.5"
                      disabled={createIdentity.isPending || isRegistering || blockchain.isRegistering}
                    >
                      {createIdentity.isPending || isRegistering || blockchain.isRegistering ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {blockchain.isRegistering ? "Registering on Sepolia..." : "Generating DID..."}
                        </>
                      ) : (
                        <>
                          Secure Identity <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
            
            <CardFooter className="bg-muted/30 border-t py-6">
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <p>
                  By proceeding, a unique DID will be generated and a smart contract transaction will be prepared for the Sepolia Testnet.
                </p>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
