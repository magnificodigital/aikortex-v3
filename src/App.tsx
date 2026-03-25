import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Team from "./pages/Team";
import Financial from "./pages/Financial";
import Contracts from "./pages/Contracts";
import Reports from "./pages/Reports";
import Partners from "./pages/Partners";
import Sales from "./pages/Sales";
import Aikortex from "./pages/Aikortex";
import AgentDetail from "./pages/AgentDetail";
import AikortexCRM from "./pages/AikortexCRM";
import AikortexAutomations from "./pages/AikortexAutomations";
import AikortexMessages from "./pages/AikortexMessages";
import AikortexBroadcasts from "./pages/AikortexBroadcasts";
import WebEdit from "./pages/WebEdit";
import AlowDigital from "./pages/AlowDigital";
import IAgora from "./pages/IAgora";
import SintonIA from "./pages/SintonIA";
import SettingsPage from "./pages/SettingsPage";
import ClientRegistration from "./pages/ClientRegistration";
import AppBuilder from "./pages/AppBuilder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const P = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<P><Home /></P>} />
            <Route path="/app-builder" element={<P><AppBuilder /></P>} />
            <Route path="/dashboard" element={<P><Index /></P>} />
            <Route path="/cadastro-cliente/:token" element={<ClientRegistration />} />
            <Route path="/clients" element={<P><Clients /></P>} />
            <Route path="/projects" element={<P><Projects /></P>} />
            <Route path="/tasks" element={<P><Tasks /></P>} />
            <Route path="/team" element={<P><Team /></P>} />
            <Route path="/financial" element={<P><Financial /></P>} />
            <Route path="/contracts" element={<P><Contracts /></P>} />
            <Route path="/reports" element={<P><Reports /></P>} />
            <Route path="/partners" element={<P><Partners /></P>} />
            <Route path="/sales" element={<P><Sales /></P>} />
            <Route path="/aikortex" element={<P><AikortexCRM /></P>} />
            <Route path="/aikortex/crm" element={<P><AikortexCRM /></P>} />
            <Route path="/aikortex/agents" element={<P><Aikortex /></P>} />
            <Route path="/aikortex/automations" element={<P><AikortexAutomations /></P>} />
            <Route path="/aikortex/messages" element={<P><AikortexMessages /></P>} />
            <Route path="/aikortex/broadcasts" element={<P><AikortexBroadcasts /></P>} />
            <Route path="/webedit" element={<P><WebEdit /></P>} />
            <Route path="/alowdigital" element={<P><AlowDigital /></P>} />
            <Route path="/iagora" element={<P><IAgora /></P>} />
            <Route path="/sintonia" element={<P><SintonIA /></P>} />
            <Route path="/settings" element={<P><SettingsPage /></P>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
