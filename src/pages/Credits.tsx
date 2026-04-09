import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/hooks/use-credits";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coins, ShoppingCart, History, Sparkles, Zap, Mic, Info } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const typeLabels: Record<string, string> = {
  purchase: "Compra",
  consumption: "Consumo",
  refund: "Reembolso",
  bonus: "Bônus",
  manual: "Manual",
};

const typeBadgeClass: Record<string, string> = {
  purchase: "bg-green-500/10 text-green-600 border-0",
  consumption: "bg-blue-500/10 text-blue-600 border-0",
  refund: "bg-orange-500/10 text-orange-600 border-0",
  bonus: "bg-purple-500/10 text-purple-600 border-0",
  manual: "bg-muted text-muted-foreground border-0",
};

const Credits = () => {
  const { user } = useAuth();
  const { balance, totalPurchased, totalConsumed, isLoading: walletLoading } = useCredits();
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: packages = [] } = useQuery({
    queryKey: ["credit-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["credit-transactions", user?.id, typeFilter],
    enabled: !!user?.id,
    queryFn: async () => {
      let q = supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (typeFilter !== "all") q = q.eq("type", typeFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Coins className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Créditos de IA</h1>
            <p className="text-sm text-muted-foreground">Gerencie seus créditos para uso nos agentes e automações.</p>
          </div>
        </div>

        <Tabs defaultValue="buy" className="space-y-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="buy" className="text-xs gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5" /> Comprar Créditos
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs gap-1.5">
              <History className="w-3.5 h-3.5" /> Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-6">
            {/* Balance Card */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo atual</p>
                    <p className="text-4xl font-bold text-foreground mt-1">
                      {walletLoading ? "..." : balance.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">créditos disponíveis</p>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total comprado</p>
                      <p className="font-semibold text-foreground">{totalPurchased.toLocaleString("pt-BR")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total consumido</p>
                      <p className="font-semibold text-foreground">{totalConsumed.toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Packages Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {packages.map((pkg) => (
                <Card key={pkg.id} className={`relative ${pkg.is_featured ? "border-primary ring-1 ring-primary/20" : ""}`}>
                  {pkg.is_featured && (
                    <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px]">
                      Mais popular
                    </Badge>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <CardDescription>{pkg.credits.toLocaleString("pt-BR")} créditos</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-2xl font-bold text-foreground">
                      R$ {Number(pkg.price_brl).toFixed(2).replace(".", ",")}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      R$ {(Number(pkg.price_brl) / pkg.credits * 1000).toFixed(2).replace(".", ",")} / 1k créditos
                    </p>
                    <Button
                      className="w-full"
                      variant={pkg.is_featured ? "default" : "outline"}
                      onClick={() => toast.info("Em breve — integração com pagamento será ativada em instantes.")}
                    >
                      Comprar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Info Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" /> O que são créditos?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  1 crédito = 1.000 tokens processados (entrada + saída). Veja estimativas de uso:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">~50 conversas simples</p>
                      <p className="text-xs text-muted-foreground">por 1.000 créditos</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Zap className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">~10 fluxos complexos</p>
                      <p className="text-xs text-muted-foreground">por 1.000 créditos</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Mic className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">~5 sessões de voz</p>
                      <p className="text-xs text-muted-foreground">por 1.000 créditos</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="flex items-center gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="purchase">Compras</SelectItem>
                  <SelectItem value="consumption">Consumo</SelectItem>
                  <SelectItem value="bonus">Bônus</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="refund">Reembolso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Provedor / Modelo</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Créditos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhuma transação encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-xs">
                          {format(new Date(tx.created_at!), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge className={typeBadgeClass[tx.type] ?? ""}>
                            {typeLabels[tx.type] ?? tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{tx.description ?? "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {[tx.provider, tx.model].filter(Boolean).join(" / ") || "—"}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {(tx.tokens_input || 0) + (tx.tokens_output || 0) > 0
                            ? `${((tx.tokens_input || 0) + (tx.tokens_output || 0)).toLocaleString("pt-BR")}`
                            : "—"}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${tx.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                          {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Credits;
