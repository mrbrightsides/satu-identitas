import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { ChatBot } from "./components/ChatBot";

import Home from "./pages/Home";
import Register from "./pages/Register";
import VisaRegister from "./pages/VisaRegister";
import IdentityDetail from "./pages/IdentityDetail";
import Verify from "./pages/Verify";
import Dashboard from "./pages/Dashboard";
import VerifyQR from "./pages/VerifyQR";
import OverstayMonitor from "./pages/OverstayMonitor";
import NotFound from "./pages/not-found";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/register" component={Register} />
          <Route path="/visa-register" component={VisaRegister} />
          <Route path="/verify" component={Verify} />
          <Route path="/verify-qr" component={VerifyQR} />
          <Route path="/overstay-monitor" component={OverstayMonitor} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/did/:did" component={IdentityDetail} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <ChatBot />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
