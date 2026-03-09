import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DollarSign, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import FinancialMetrics from "@/components/financial/FinancialMetrics";
import RevenueChart from "@/components/financial/RevenueChart";
import InvoiceTable from "@/components/financial/InvoiceTable";
import InvoiceDetailDialog from "@/components/financial/InvoiceDetailDialog";
import SubscriptionList from "@/components/financial/SubscriptionList";
import ExpenseTracker from "@/components/financial/ExpenseTracker";
import NewInvoiceDialog from "@/components/financial/NewInvoiceDialog";
import { mockInvoices, Invoice } from "@/types/financial";

const Financial = () => {
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showNewInvoice, setShowNewInvoice] = useState(false);

  const filteredInvoices = mockInvoices.filter(i =>
    i.client.toLowerCase().includes(search.toLowerCase()) ||
    i.id.toLowerCase().includes(search.toLowerCase()) ||
    i.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
              <p className="text-sm text-muted-foreground">Controle financeiro da operação</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowNewInvoice(true)}>
            <Plus className="w-4 h-4 mr-1" /> Nova Fatura
          </Button>
        </div>

        <FinancialMetrics />

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="invoices">Faturas</TabsTrigger>
            <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <RevenueChart />
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar faturas..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <InvoiceTable invoices={filteredInvoices} onView={setSelectedInvoice} />
          </TabsContent>

          <TabsContent value="subscriptions">
            <SubscriptionList />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpenseTracker />
          </TabsContent>
        </Tabs>

        <InvoiceDetailDialog invoice={selectedInvoice} open={!!selectedInvoice} onOpenChange={(o) => !o && setSelectedInvoice(null)} />
        <NewInvoiceDialog open={showNewInvoice} onOpenChange={setShowNewInvoice} />
      </div>
    </DashboardLayout>
  );
};

export default Financial;
