import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { mockExpenses } from "@/types/financial";

const categoryColors: Record<string, string> = {
  Software: "hsl(217, 91%, 60%)",
  Marketing: "hsl(38, 92%, 50%)",
  Operacional: "hsl(142, 71%, 45%)",
};

const ExpenseTracker = () => {
  const totalExpenses = mockExpenses.reduce((s, e) => s + e.amount, 0);
  const byCategory = mockExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="glass-card rounded-xl p-5 flex flex-col items-center justify-center">
        <h3 className="text-sm font-semibold text-foreground mb-1">Despesas Totais</h3>
        <p className="text-2xl font-bold text-foreground mb-3">R$ {(totalExpenses / 1000).toFixed(1)}k</p>
        <div className="h-40 w-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={2} stroke="hsl(220, 16%, 96%)">
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={categoryColors[entry.name] || "hsl(215, 15%, 45%)"} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          {pieData.map(d => (
            <div key={d.name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[d.name] }} />
              {d.name}
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground">Despesas Detalhadas</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead className="text-xs">Descrição</TableHead>
              <TableHead className="text-xs">Categoria</TableHead>
              <TableHead className="text-xs">Valor</TableHead>
              <TableHead className="text-xs">Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockExpenses.map(exp => (
              <TableRow key={exp.id} className="border-border/30">
                <TableCell className="text-sm text-foreground">{exp.description}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{exp.category}</TableCell>
                <TableCell className="text-sm font-semibold text-foreground">R$ {exp.amount.toLocaleString("pt-BR")}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[10px]">{exp.recurring ? "Recorrente" : "Único"}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ExpenseTracker;
