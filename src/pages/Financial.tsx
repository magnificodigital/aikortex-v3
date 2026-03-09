import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DollarSign, Plus, Search, Download, FileText, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import FinancialMetrics from "@/components/financial/FinancialMetrics";
import RevenueChart from "@/components/financial/RevenueChart";
import InvoiceTable from "@/components/financial/InvoiceTable";
import InvoiceDetailDialog from "@/components/financial/InvoiceDetailDialog";
import SubscriptionList from "@/components/financial/SubscriptionList";
import ExpenseTracker from "@/components/financial/ExpenseTracker";
import NewInvoiceDialog from "@/components/financial/NewInvoiceDialog";
import NewExpenseDialog from "@/components/financial/NewExpenseDialog";
import CashFlowView from "@/components/financial/CashFlowView";
import BudgetTracker from "@/components/financial/BudgetTracker";
import TransactionHistory from "@/components/financial/TransactionHistory";
import ProfitLossView from "@/components/financial/ProfitLossView";
import AccountsView from "@/components/financial/AccountsView";
import CostCenterView from "@/components/financial/CostCenterView";
import { mockInvoices, Invoice } from "@/types/financial";
import { toast } from "@/hooks/use-toast";

const Financial = () => {
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [showNewExpense, setShowNewExpense] = useState(false);

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
              <p className="text-sm text-muted-foreground">Controle financeiro completo da operação</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" /> Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toast({ title: "Exportando PDF..." })}>
                  <FileText className="w-4 h-4 mr-2" /> Relatório PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast({ title: "Exportando CSV..." })}>
                  <Download className="w-4 h-4 mr-2" /> Planilha CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Novo
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowNewInvoice(true)}>
                  <FileText className="w-4 h-4 mr-2" /> Nova Fatura
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowNewExpense(true)}>
                  <Receipt className="w-4 h-4 mr-2" /> Nova Despesa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <FinancialMetrics />

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
            <TabsTrigger value="invoices">Faturas</TabsTrigger>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
            <TabsTrigger value="accounts">Contas</TabsTrigger>
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
            <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
            <TabsTrigger value="budget">Orçamento</TabsTrigger>
            <TabsTrigger value="dre">DRE</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <RevenueChart />
          </TabsContent>

          <TabsContent value="cashflow">
            <CashFlowView />
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar faturas..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <InvoiceTable invoices={filteredInvoices} onView={setSelectedInvoice} />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionHistory />
          </TabsContent>

          <TabsContent value="accounts">
            <AccountsView />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpenseTracker />
          </TabsContent>

          <TabsContent value="subscriptions">
            <SubscriptionList />
          </TabsContent>

          <TabsContent value="budget">
            <BudgetTracker />
          </TabsContent>

          <TabsContent value="dre">
            <ProfitLossView />
          </TabsContent>
        </Tabs>

        <InvoiceDetailDialog invoice={selectedInvoice} open={!!selectedInvoice} onOpenChange={(o) => !o && setSelectedInvoice(null)} />
        <NewInvoiceDialog open={showNewInvoice} onOpenChange={setShowNewInvoice} />
        <NewExpenseDialog open={showNewExpense} onOpenChange={setShowNewExpense} />
      </div>
    </DashboardLayout>
  );
};

export default Financial;
