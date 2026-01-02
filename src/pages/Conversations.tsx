import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Search, User, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Conversation {
  id: string;
  contact_id: string;
  last_message_at: string;
  unread_count: number;
  contact?: {
    name: string;
    phone: string | null;
  };
}

interface Message {
  id: string;
  content: string;
  is_outgoing: boolean;
  status: string;
  created_at: string;
}

const Conversations = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      fetchConversations();
    };
    checkAuth();
  }, [navigate]);

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        *,
        contact:contacts(name, phone)
      `)
      .order("last_message_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to fetch conversations", variant: "destructive" });
    } else {
      setConversations(data || []);
    }
    setLoading(false);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Error", description: "Failed to fetch messages", variant: "destructive" });
    } else {
      setMessages(data || []);
    }
  };

  const handleSelectConvo = (convo: Conversation) => {
    setSelectedConvo(convo);
    fetchMessages(convo.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConvo) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("messages").insert({
      user_id: user.id,
      conversation_id: selectedConvo.id,
      content: newMessage.trim(),
      is_outgoing: true,
      status: "sent",
    });

    if (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } else {
      setNewMessage("");
      fetchMessages(selectedConvo.id);
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedConvo.id);
    }
  };

  const filteredConvos = conversations.filter((c) =>
    c.contact?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <Header title="Conversations" subtitle="Manage your customer chats" />

      <div className="flex h-[calc(100vh-120px)]">
        {/* Conversation List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full md:w-80 lg:w-96 border-r border-border bg-card flex flex-col"
        >
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : filteredConvos.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              <AnimatePresence>
                {filteredConvos.map((convo, index) => (
                  <motion.div
                    key={convo.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelectConvo(convo)}
                    className={cn(
                      "p-4 border-b border-border cursor-pointer transition-colors hover:bg-muted/50",
                      selectedConvo?.id === convo.id && "bg-accent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium truncate">{convo.contact?.name || "Unknown"}</h4>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(convo.last_message_at), "HH:mm")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {convo.contact?.phone || "No phone"}
                        </p>
                      </div>
                      {convo.unread_count > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                          {convo.unread_count}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        {/* Chat Window */}
        <div className="hidden md:flex flex-1 flex-col bg-background">
          {selectedConvo ? (
            <>
              {/* Chat Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border-b border-border bg-card flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{selectedConvo.contact?.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedConvo.contact?.phone}</p>
                </div>
              </motion.div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                  <ChatBubble
                    key={msg.id}
                    content={msg.content}
                    isOutgoing={msg.is_outgoing}
                    timestamp={format(new Date(msg.created_at), "HH:mm")}
                    status={msg.status as any}
                    delay={index * 0.05}
                  />
                ))}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="min-h-[50px] max-h-[120px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <Button type="submit" size="icon" className="gradient-primary h-[50px] w-[50px]">
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={<MessageSquare className="w-10 h-10 text-primary" />}
                title="Select a conversation"
                description="Choose a conversation from the list to start chatting"
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Conversations;
