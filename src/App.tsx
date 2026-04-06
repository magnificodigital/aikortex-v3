import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Lazy-loaded pages
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Home = lazy(() => import("./pages/Home"));
const Index = lazy(() => import("./pages/Index"));
const Clients = lazy(() => import("./pages/Clients"));
const Projects = lazy(() => import("./pages/Projects"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Team = lazy(() => import("./pages/Team"));
const Financial = lazy(() => import("./pages/Financial"));
const Contracts = lazy(() => import("./pages/Contracts"));
const Reports = lazy(() => import("./pages/Reports"));
const Partners = lazy(() => import("./pages/Partners"));
const Sales = lazy(() => import("./pages/Sales"));
const Aikortex = lazy(() => import("./pages/Aikortex"));
const AgentDetail = lazy(() => import("./pages/AgentDetail"));
const AikortexCRM = lazy(() => import("./pages/AikortexCRM"));
const AikortexAutomations = lazy(() => import("./pages/AikortexAutomations"));
const AikortexMessages = lazy(() => import("./pages/AikortexMessages"));
const AikortexBroadcasts = lazy(() => import("./pages/AikortexBroadcasts"));
const WebEdit = lazy(() => import("./pages/WebEdit"));
const AlowDigital = lazy(() => import("./pages/AlowDigital"));
const IAgora = lazy(() => import("./pages/IAgora"));
const SintonIA = lazy(() => import("./pages/SintonIA"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ClientRegistration = lazy(() => import("./pages/ClientRegistration"));
const AppBuilder = lazy(() => import("./pages/AppBuilder"));
const Apps = lazy(() => import("./pages/Apps"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));

const Pricing = lazy(() => import("./pages/Pricing"));
const Templates = lazy(() => import("./pages/Templates"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Meetings = lazy(() => import("./pages/Meetings"));
const MeetingRoom = lazy(() => import("./pages/MeetingRoom"));
const Tutorials = lazy(() => import("./pages/Tutorials"));

const queryClient = new QueryClient();

const P = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const Loading = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/home" element={<P><Home /></P>} />
              <Route path="/apps" element={<P><Apps /></P>} />
              <Route path="/app-builder" element={<P><AppBuilder /></P>} />
              
              <Route path="/templates" element={<P><Templates /></P>} />
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
              <Route path="/aikortex/agents/:agentId" element={<P><AgentDetail /></P>} />
              
              <Route path="/aikortex/automations" element={<P><AikortexAutomations /></P>} />
              <Route path="/aikortex/messages" element={<P><AikortexMessages /></P>} />
              <Route path="/aikortex/broadcasts" element={<P><AikortexBroadcasts /></P>} />
              <Route path="/webedit" element={<P><WebEdit /></P>} />
              <Route path="/alowdigital" element={<P><AlowDigital /></P>} />
              <Route path="/iagora" element={<P><IAgora /></P>} />
              <Route path="/sintonia" element={<P><SintonIA /></P>} />
              <Route path="/admin" element={<ProtectedRoute roles={['platform_owner','platform_admin']}><AdminPanel /></ProtectedRoute>} />
              <Route path="/settings" element={<P><SettingsPage /></P>} />
              <Route path="/meetings" element={<P><Meetings /></P>} />
              <Route path="/meetings/:roomId" element={<MeetingRoom />} />
              <Route path="/tutorials" element={<P><Tutorials /></P>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
