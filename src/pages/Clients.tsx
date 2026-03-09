import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Users, Plus, Link2, Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Client, MOCK_CLIENTS } from "@/types/client";
import ClientMetrics from "@/components/clients/ClientMetrics";
import ClientFilters from "@/components/clients/ClientFilters";
import ClientTable from "@/components/clients/ClientTable";
import ClientProfileDialog from "@/components/clients/ClientProfileDialog";
import NewClientDialog from "@/components/clients/NewClientDialog";

const Clients = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const filtered = MOCK_CLIENTS.filter(c => {
    const matchesSearch =
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.contactName.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesIndustry = industryFilter === "all" || c.industry === industryFilter;
    const matchesManager = managerFilter === "all" || c.accountManager === managerFilter;
    return matchesSearch && matchesStatus && matchesIndustry && matchesManager;
  });

  const generateLink = () => {
    const token = crypto.randomUUID();
    setGeneratedLink(`${window.location.origin}/cadastro-cliente/${token}`);
    setShowLinkDialog(true);
    setCopied(false);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
              <p className="text-sm text-muted-foreground">Gestão completa de clientes da agência</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={generateLink}>
              <Link2 className="w-4 h-4" />
              Gerar Link
            </Button>
            <Button className="glow-primary" onClick={() => setShowNewClient(true)}>
              <Plus className="w-4 h-4" />
              Novo Cliente
            </Button>
          </div>
        </div>

        <ClientMetrics clients={MOCK_CLIENTS} />

        <ClientFilters
          search={search} onSearchChange={setSearch}
          status={statusFilter} onStatusChange={setStatusFilter}
          industry={industryFilter} onIndustryChange={setIndustryFilter}
          manager={managerFilter} onManagerChange={setManagerFilter}
        />

        <ClientTable clients={filtered} onSelect={setSelectedClient} />
      </div>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Link de Cadastro do Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Envie este link para o cliente preencher o próprio cadastro.</p>
            <div className="flex items-center gap-2">
              <Input value={generatedLink} readOnly className="font-mono text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={copyToClipboard}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Client Profile */}
      <ClientProfileDialog client={selectedClient} onClose={() => setSelectedClient(null)} />
    </DashboardLayout>
  );
};

export default Clients;
