import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { MessageSquare, Search, Phone, Video, MoreVertical, Send, Paperclip, Smile, Star, Filter, Clock, Check, CheckCheck, AlertTriangle, Image as ImageIcon, Mic } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  name: string;
  initials: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  channel: "whatsapp" | "instagram" | "email";
  status?: "delivered" | "read" | "failed";
}

interface Message {
  id: string;
  sender: "user" | "contact" | "bot";
  text: string;
  time: string;
  status?: "sent" | "delivered" | "read" | "failed";
}

interface ContactDetail {
  id: string;
  name: string;
  initials: string;
  phone: string;
  email: string;
  localTime: string;
  contact: string;
  language: string;
  country: string;
  agendado: string;
  objetivo: string;
  resumo: string;
}

const MOCK_CONTACTS: Contact[] = [
  { id: "1", name: "Lucas Falcão", initials: "LF", lastMessage: "Okok", time: "12/11/2025", unread: 2, online: true, channel: "whatsapp", status: "read" },
  { id: "2", name: "Jessica Etiene", initials: "JE", lastMessage: "Obrigada! Igualmente!", time: "12/11/2025", unread: 0, online: false, channel: "whatsapp", status: "delivered" },
  { id: "3", name: "Jesus Vallejo", initials: "JV", lastMessage: "Un saludo", time: "10/11/2025", unread: 0, online: true, channel: "whatsapp" },
  { id: "4", name: "Bernardo Rabello", initials: "BR", lastMessage: "gostaria de saber apenas o preço", time: "09/11/2025", unread: 0, online: false, channel: "whatsapp", status: "failed" },
  { id: "5", name: "Carlos Bardaji", initials: "CB", lastMessage: "Bom dia!! Tudo certo", time: "07/11/2025", unread: 0, online: false, channel: "whatsapp", status: "delivered" },
  { id: "6", name: "Gustavo Filipe", initials: "GF", lastMessage: "Vamos agendar a reunião", time: "07/11/2025", unread: 0, online: true, channel: "whatsapp", status: "delivered" },
  { id: "7", name: "Biana Rebeca", initials: "BR2", lastMessage: "Ok", time: "06/11/2025", unread: 0, online: true, channel: "whatsapp" },
  { id: "8", name: "Renan Silva", initials: "RS", lastMessage: "Perfeito, obrigado!", time: "05/11/2025", unread: 0, online: false, channel: "instagram" },
];

const MOCK_MESSAGES: Message[] = [
  { id: "1", sender: "bot", text: "lembrete_2", time: "08:00" },
  { id: "2", sender: "bot", text: "Profe, tá quase na hora! Nos falamos em breve, em 15 minutos.\nSó me dá um OK aqui quando estiver pronto. Te espero lá!", time: "08:01", status: "delivered" },
  { id: "3", sender: "bot", text: "Profe, tá quase na hora! Nos falamos em breve, em 15 minutos.\nSó me dá um OK aqui quando estiver pronto. Te espero lá!", time: "08:15", status: "read" },
  { id: "4", sender: "contact", text: "Okok", time: "08:20" },
  { id: "5", sender: "bot", text: "Show, logo mais te envio o link aqui", time: "08:25", status: "read" },
  { id: "6", sender: "contact", text: "Ok", time: "08:30" },
  { id: "7", sender: "bot", text: "https://meet.google.com/xdv-sokr-zfo", time: "09:00", status: "read" },
  { id: "8", sender: "bot", text: "Te aguardo no link", time: "09:01", status: "read" },
  { id: "9", sender: "contact", text: "Okok", time: "09:10" },
];

const MOCK_DETAIL: ContactDetail = {
  id: "1",
  name: "Lucas Falcão",
  initials: "LF",
  phone: "558499912300",
  email: "lucasafonsof@hotmail.com",
  localTime: "21:32",
  contact: "11/11/2025 08:18",
  language: "Portuguese BR",
  country: "Brazil",
  agendado: "sim",
  objetivo: "Aprimorar processos de recrutamento",
  resumo: "Profissional de reabilitação...",
};

const AikortexMessages = () => {
  const [selectedContact, setSelectedContact] = useState<string>("1");
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "human" | "bot">("all");

  const selectedContactData = MOCK_CONTACTS.find(c => c.id === selectedContact);

  const handleSend = () => {
    if (!messageInput.trim()) return;
    setMessageInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredContacts = MOCK_CONTACTS.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "read": return <CheckCheck className="w-3.5 h-3.5 text-primary" />;
      case "delivered": return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />;
      case "failed": return <AlertTriangle className="w-3.5 h-3.5 text-destructive" />;
      default: return <Check className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-0px)] flex overflow-hidden -m-0">
        {/* LEFT — Contact List */}
        <div className="w-[320px] min-w-[280px] border-r border-border flex flex-col bg-card">
          {/* Filter Tabs */}
          <div className="px-3 pt-3 pb-2 border-b border-border">
            <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)}>
              <TabsList className="w-full h-8">
                <TabsTrigger value="all" className="flex-1 text-xs h-7">Todos</TabsTrigger>
                <TabsTrigger value="human" className="flex-1 text-xs h-7">Humano</TabsTrigger>
                <TabsTrigger value="bot" className="flex-1 text-xs h-7">Bot</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Search + Actions */}
          <div className="px-3 py-2 flex items-center gap-2 border-b border-border">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar conversas..."
                className="pl-8 h-8 text-xs"
              />
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <Filter className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Contact List */}
          <ScrollArea className="flex-1">
            <div className="py-1">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-accent/50",
                    selectedContact === contact.id && "bg-accent"
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
                        {contact.initials.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    {contact.online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                    )}
                    {contact.channel === "whatsapp" && (
                      <span className="absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Phone className="w-2.5 h-2.5 text-white" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate">{contact.name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{contact.time}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-muted-foreground truncate">{contact.lastMessage}</span>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {contact.status && getStatusIcon(contact.status)}
                        {contact.unread > 0 && (
                          <Badge className="h-4 min-w-[16px] px-1 text-[10px] bg-primary text-primary-foreground rounded-full">
                            {contact.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* CENTER — Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedContactData ? (
            <>
              {/* Chat Header */}
              <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-card shrink-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
                      {selectedContactData.initials.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{selectedContactData.name}</h3>
                    <p className="text-[10px] text-muted-foreground">Atribuir conversa</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Star className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 bg-background">
                <div className="p-4 space-y-3 max-w-3xl mx-auto">
                  {MOCK_MESSAGES.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.sender === "contact" ? "justify-start" : "justify-end"
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-xl px-3.5 py-2 text-sm max-w-[70%] shadow-sm",
                          msg.sender === "contact"
                            ? "bg-card text-foreground border border-border"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <div className={cn(
                          "flex items-center justify-end gap-1 mt-1",
                          msg.sender === "contact" ? "text-muted-foreground" : "text-primary-foreground/70"
                        )}>
                          <span className="text-[10px]">{msg.time}</span>
                          {msg.sender !== "contact" && msg.status && (
                            msg.status === "read"
                              ? <CheckCheck className="w-3 h-3" />
                              : msg.status === "delivered"
                                ? <CheckCheck className="w-3 h-3 opacity-60" />
                                : msg.status === "failed"
                                  ? <AlertTriangle className="w-3 h-3 text-destructive" />
                                  : <Check className="w-3 h-3 opacity-60" />
                          )}
                        </div>
                        {msg.status === "failed" && (
                          <p className="text-[10px] text-destructive mt-0.5">A mensagem não foi enviada.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Inactive notice */}
              <div className="px-4 py-2 bg-muted/50 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  O usuário ficou inativo por mais de 24 horas
                </p>
              </div>

              {/* Input Area */}
              <div className="border-t border-border bg-card px-4 py-3">
                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Smile className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex-1 relative">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Digite uma mensagem..."
                      className="pr-10 h-9 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Mic className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={handleSend}
                      disabled={!messageInput.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-[10px] gap-1 h-5">
                    <Phone className="w-3 h-3 text-emerald-500" /> Whatsapp
                  </Badge>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                <MessageSquare className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">Selecione uma conversa</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Contact Details */}
        {selectedContactData && (
          <div className="w-[300px] min-w-[260px] border-l border-border bg-card flex flex-col overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="p-5 space-y-5">
                {/* Avatar + Name */}
                <div className="flex flex-col items-center text-center space-y-2">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg font-semibold bg-muted text-muted-foreground">
                      {MOCK_DETAIL.initials}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-sm font-bold text-foreground">{MOCK_DETAIL.name}</h3>
                </div>

                {/* Detail Fields */}
                <div className="space-y-3">
                  {[
                    { label: "ID de contato", value: MOCK_DETAIL.phone },
                    { label: "Endereço de e-mail", value: MOCK_DETAIL.email },
                    { label: "Número de telefone", value: `+${MOCK_DETAIL.phone}` },
                    { label: "Horário local", value: MOCK_DETAIL.localTime },
                    { label: "Contact", value: MOCK_DETAIL.contact },
                    { label: "Idioma", value: MOCK_DETAIL.language },
                    { label: "País", value: MOCK_DETAIL.country },
                    { label: "Agendado", value: MOCK_DETAIL.agendado },
                    { label: "Objetivo", value: MOCK_DETAIL.objetivo },
                    { label: "Resumo", value: MOCK_DETAIL.resumo },
                  ].map((field) => (
                    <div key={field.label} className="flex items-start justify-between gap-3">
                      <span className="text-[11px] text-muted-foreground shrink-0 min-w-[100px]">{field.label}</span>
                      <span className="text-[11px] text-foreground text-right truncate">{field.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AikortexMessages;
