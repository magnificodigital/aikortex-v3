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
import Integrations from "./pages/Integrations";
import Partners from "./pages/Partners";
import Brand from "./pages/Brand";
import Aikortex from "./pages/Aikortex";
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
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/brand" element={<Brand />} />
          <Route path="/aikortex" element={<Aikortex />} />
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
