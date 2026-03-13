import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/cadastro-cliente/:token" element={<ClientRegistration />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/team" element={<Team />} />
          <Route path="/financial" element={<Financial />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/aikortex" element={<AikortexCRM />} />
          <Route path="/aikortex/crm" element={<AikortexCRM />} />
          <Route path="/aikortex/agents" element={<Aikortex />} />
          <Route path="/aikortex/automations" element={<AikortexAutomations />} />
          <Route path="/aikortex/messages" element={<AikortexMessages />} />
          <Route path="/aikortex/broadcasts" element={<AikortexBroadcasts />} />
          <Route path="/webedit" element={<WebEdit />} />
          <Route path="/alowdigital" element={<AlowDigital />} />
          <Route path="/iagora" element={<IAgora />} />
          <Route path="/sintonia" element={<SintonIA />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
