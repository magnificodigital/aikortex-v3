import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockAccountsPayable, mockAccountsReceivable, paymentStatusConfig, costCenterLabels } from "@/types/financial";
import { ArrowDownLeft, ArrowUpRight, AlertTriangle, Clock } from "lucide-react";

const AccountsView = () => {
  const totalPayable = mockAccountsPayable.reduce((s, a) => s + a.amount, 0);
  const overduePayable = mockAccountsPayable.filter(a => a.status === "overdue");
  const totalReceivable = mockAccountsReceivable.reduce((s, a) => s + a.amount, 0);
  const overdueReceivable = mockAccountsReceivable.filter(a => a.status === "overdue");

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownLeft className="w-4 h-4 text-[hsl(var(--success))]" />
            <span className="text-[11px] text-muted-foreground">A Receber</span>
          </div>
          <p className="text-xl font-bold text-foreground">R$ {(totalReceivable / 1000).toFixed(1)}k</p>
          <p className="text-[10px] text-muted-foreground">{mockAccountsReceivable.length} títulos</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-[11px] text-muted-foreground">Recebíveis Atrasados</span>
          </div>
          <p className="text-xl font-bold text-destructive">R$ {(overdueReceivable.reduce((s, a) => s + a.amount, 0) / 1000).toFixed(1)}k</p>
          <p className="text-[10px] text-muted-foreground">{overdueReceivable.length} títulos</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight className="w-4 h-4 text-destructive" />
            <span className="text-[11px] text-muted-foreground">A Pagar</span>
          </div>
          <p className="text-xl font-bold text-foreground">R$ {(totalPayable / 1000).toFixed(1)}k</p>
          <p className="text-[10px] text-muted-foreground">{mockAccountsPayable.length} títulos</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-[hsl(var(--warning))]" />
            <span className="text-[11px] text-muted-foreground">Pagáveis Atrasados</span>
          </div>
          <p className="text-xl font-bold text-[hsl(var(--warning))]">R$ {(overduePayable.reduce((s, a) => s + a.amount, 0) / 1000).toFixed(1)}k</p>
          <p className="text-[10px] text-muted-foreground">{overduePayable.length} títulos</p>
        </div>
      </div>

      <Tabs defaultValue="receivable" className="space-y-4">
        <TabsList>
          <TabsTrigger value="receivable">Contas a Receber</TabsTrigger>
          <TabsTrigger value="payable">Contas a Pagar</TabsTrigger>
        </TabsList>

        <TabsContent value="receivable">
          <div className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="text-xs">Cliente</TableHead>
                  <TableHead className="text-xs">Descrição</TableHead>
                  <TableHead className="text-xs">Valor</TableHead>
                  <TableHead className="text-xs">Vencimento</TableHead>
                  <TableHead className="text-xs">Fatura</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAccountsReceivable.map(ar => {
                  const cfg = paymentStatusConfig[ar.status];
                  return (
                    <TableRow key={ar.id} className="border-border/30">
                      <TableCell className="text-sm font-medium text-foreground">{ar.client}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{ar.description}</TableCell>
                      <TableCell className="text-sm font-semibold text-foreground">R$ {ar.amount.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(ar.dueDate).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{ar.invoiceId || "-"}</TableCell>
                      <TableCell><Badge variant="secondary" className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="payable">
          <div className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="text-xs">Fornecedor</TableHead>
                  <TableHead className="text-xs">Descrição</TableHead>
                  <TableHead className="text-xs">Valor</TableHead>
                  <TableHead className="text-xs">Vencimento</TableHead>
                  <TableHead className="text-xs">Centro de Custo</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAccountsPayable.map(ap => {
                  const cfg = paymentStatusConfig[ap.status];
                  return (
                    <TableRow key={ap.id} className="border-border/30">
                      <TableCell className="text-sm font-medium text-foreground">{ap.vendor}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{ap.description}</TableCell>
                      <TableCell className="text-sm font-semibold text-foreground">R$ {ap.amount.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(ap.dueDate).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{costCenterLabels[ap.category]}</TableCell>
                      <TableCell><Badge variant="secondary" className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountsView;
