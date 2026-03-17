import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Ticket, ArrowRight, Loader2, ExternalLink } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  visaType: z.enum(['tourist', 'work', 'business'], { required_error: "Select visa type" }),
  passportNumber: z.string().min(6, "Passport number must be at least 6 characters"),
  fullName: z.string().min(3, "Full name required"),
  nationality: z.string().optional(),
  visaExpiry: z.string().refine(date => new Date(date) > new Date(), "Visa must be valid"),
  kycUrl: z.string().url("Must be valid KYC URL"),
  auditUrl: z.string().url("Must be valid Audit URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export default function VisaRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      visaType: undefined,
      passportNumber: "",
      fullName: "",
      nationality: "",
      visaExpiry: "",
      kycUrl: "https://kyc.elpeef.com",
      auditUrl: "https://auditour.elpeef.com",
    },
  });

  async function onSubmit(data: FormValues) {
    try {
      setIsLoading(true);

      const res = await fetch("/api/visa-identities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          visaExpiry: new Date(data.visaExpiry).toISOString(),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Registration failed");
      }

      const result = await res.json();

      toast({
        title: "Visa DID Created! 🎉",
        description: "Your temporary identity is ready for use during your stay in Indonesia.",
      });

      setLocation(`/did/${result.did}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
              <Ticket className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground">Visa Holder DID</h1>
            <p className="mt-2 text-muted-foreground">
              Create a temporary decentralized identity linked to your visa and KYC verification.
            </p>
          </div>

          <Card className="border-border/50 shadow-xl shadow-black/5 overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary to-orange-400"></div>

            <CardHeader className="bg-white pb-8">
              <CardTitle className="text-2xl">Visa Information</CardTitle>
              <CardDescription>
                Your DID will be linked to your KYC verification and audit trail for transparency.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Visa Type */}
                  <FormField
                    control={form.control}
                    name="visaType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Visa Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl border-border/60">
                              <SelectValue placeholder="Select visa type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="tourist">Tourist Visa</SelectItem>
                            <SelectItem value="work">Work Visa</SelectItem>
                            <SelectItem value="business">Business Visa</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Passport Number */}
                  <FormField
                    control={form.control}
                    name="passportNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Passport Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. AB123456"
                            className="h-12 rounded-xl font-mono text-lg border-border/60"
                            {...field}
                            maxLength={20}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Full Name */}
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="As on passport"
                            className="h-12 rounded-xl border-border/60"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Nationality */}
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Nationality</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your country"
                            className="h-12 rounded-xl border-border/60"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Visa Expiry */}
                  <FormField
                    control={form.control}
                    name="visaExpiry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Visa Expiry Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="h-12 rounded-xl border-border/60"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Must be a future date</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* KYC URL */}
                  <FormField
                    control={form.control}
                    name="kycUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground flex items-center gap-2">
                          KYC Service URL
                          <a href="https://kyc.elpeef.com" target="_blank" rel="noreferrer">
                            <ExternalLink className="w-4 h-4 text-primary hover:text-primary/80" />
                          </a>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://kyc.elpeef.com"
                            className="h-12 rounded-xl border-border/60"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Link to your KYC verification</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Audit URL */}
                  <FormField
                    control={form.control}
                    name="auditUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground flex items-center gap-2">
                          Audit Trail URL
                          <a href="https://auditour.elpeef.com" target="_blank" rel="noreferrer">
                            <ExternalLink className="w-4 h-4 text-primary hover:text-primary/80" />
                          </a>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://auditour.elpeef.com"
                            className="h-12 rounded-xl border-border/60"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Transparent tracking of your transactions and activities</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full h-14 rounded-xl text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating DID...
                        </>
                      ) : (
                        <>
                          Create Visa DID <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
