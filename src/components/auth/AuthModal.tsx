import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const AuthModal = ({ open, onClose }: AuthModalProps) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Conta criada!", description: "Verifique seu email para confirmar." });
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      }
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-[#0f1119] p-8 shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-semibold text-white text-center mb-2">
          {isSignUp ? "Comece a criar com Aikortex" : "Entrar no Aikortex"}
        </h2>
        <p className="text-sm text-white/50 text-center mb-8">
          {isSignUp
            ? "Cadastre-se e ganhe 10 créditos grátis para começar"
            : "Acesse sua conta para continuar"}
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/30 uppercase tracking-wider">
            {isSignUp ? "Cadastre-se com email" : "Entre com email"}
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <input
              type="text"
              placeholder="Nome completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-white/30 outline-none focus:border-blue-500/50 transition-colors"
            />
          )}
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-white/30 outline-none focus:border-blue-500/50 transition-colors"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full h-12 px-4 pr-12 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-white/30 outline-none focus:border-blue-500/50 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Aguarde..." : isSignUp ? "Criar Conta" : "Entrar"}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center text-sm text-white/40 mt-6">
          {isSignUp ? "Já tem uma conta? " : "Não tem conta? "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-white font-semibold hover:underline"
          >
            {isSignUp ? "Entrar" : "Criar Conta"}
          </button>
        </p>

        {/* Terms */}
        <p className="text-center text-xs text-white/25 mt-4">
          Ao continuar, você concorda com nossos{" "}
          <span className="text-blue-400 cursor-pointer hover:underline">Termos</span> e{" "}
          <span className="text-blue-400 cursor-pointer hover:underline">Política de Privacidade</span>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
