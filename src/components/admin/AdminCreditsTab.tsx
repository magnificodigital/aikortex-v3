import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Coins, Plus, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";

const AdminCreditsTab = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ userId: string; name: string } | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const { data: wallets = [], refetch } = useQuery({
    queryKey: ["admin-wallets"],
    queryFn: async () => {
      const { data: w, error } = await supabase
        .from("agency_wallets")
        .select("*");
      if (error) throw error;

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name");

      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));
      return (w ?? []).map((wallet) => ({
        ...wallet,
        agencyName: profileMap.get(wallet.user_id) ?? wallet.user_id,
      }));
    },
  });

  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);
  const totalConsumed = wallets.reduce((s, w) => s + w.total_consumed, 0);
  const totalPurchased = wallets.reduce((s, w) => s + w.total_purchased, 0);

  const handleAdd = async () => {
    if (!selectedUser || !amount || Number(amount) <= 0) {
      toast.error("Preencha quantidade válida.");
      return;
    }
    const amt = Number(amount);

    const wallet = wallets.find((w) => w.user_id === selectedUser.userId);
    const newBalance = (wallet?.balance ?? 0) + amt;

    const { error: txErr } = await supabase.from("credit_transactions").insert({
      user_id: selectedUser.userId,
      type: "manual",
      amount: amt,
      balance_after: newBalance,
      description: reason || "Créditos adicionados pelo admin",
    });
    if (txErr) {
      toast.error("Erro ao registrar transação.");
      return;
    }

    const { error: wErr } = await supabase
      .from("agency_wallets")
      .update({ balance: newBalance, total_purchased: (wallet?.total_purchased ?? 0) + amt })
      .eq("user_id", selectedUser.userId);
    if (wErr) {
      toast.error("Erro ao atualizar saldo.");
      return;
    }

    toast.success(`${amt} créditos adicionados para ${selectedUser.name}`);
    setAddOpen(false);
    setAmount("");
    setReason("");
    setSelectedUser(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Wallet className="w-8 h-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Créditos em circulação</p>
              <p className="text-xl font-bold text-foreground">{totalBalance.toLocaleString("pt-BR")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Consumo total</p>
              <p className="text-xl font-bold text-foreground">{totalConsumed.toLocaleString("pt-BR")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Coins className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total comprado</p>
              <p className="text-xl font-bold text-foreground">{totalPurchased.toLocaleString("pt-BR")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wallets Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agência</TableHead>
              <TableHead className="text-right">Saldo atual</TableHead>
              <TableHead className="text-right">Total comprado</TableHead>
              <TableHead className="text-right">Total consumido</TableHead>
              <TableHead className="text-right">Alerta baixo</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wallets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhuma carteira encontrada.
                </TableCell>
              </TableRow>
            ) : (
              wallets.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.agencyName}</TableCell>
                  <TableCell className="text-right">
                    <Badge className={w.balance < w.low_balance_alert ? "bg-red-500/10 text-red-500 border-0" : "bg-green-500/10 text-green-600 border-0"}>
                      {w.balance.toLocaleString("pt-BR")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{w.total_purchased.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-right">{w.total_consumed.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-right">{w.low_balance_alert}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => {
                        setSelectedUser({ userId: w.user_id, name: w.agencyName });
                        setAddOpen(true);
                      }}
                    >
                      <Plus className="w-3 h-3" /> Adicionar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add Credits Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar créditos — {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Quantidade de créditos</Label>
              <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ex: 500" />
            </div>
            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: Bônus por indicação" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCreditsTab;
