import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, MessageSquare, Bell, TrendingUp } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/ui/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StaggerContainer, StaggerItem } from "@/components/animations/AnimatedContainers";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    contacts: 0,
    conversations: 0,
    reminders: 0,
    templates: 0,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      fetchStats();
    };
    checkAuth();
  }, [navigate]);

  const fetchStats = async () => {
    const [contactsRes, conversationsRes, remindersRes, templatesRes] = await Promise.all([
      supabase.from("contacts").select("id", { count: "exact", head: true }),
      supabase.from("conversations").select("id", { count: "exact", head: true }),
      supabase.from("reminders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("templates").select("id", { count: "exact", head: true }),
    ]);

    setStats({
      contacts: contactsRes.count || 0,
      conversations: conversationsRes.count || 0,
      reminders: remindersRes.count || 0,
      templates: templatesRes.count || 0,
    });
  };

  return (
    <DashboardLayout>
      <Header title="Dashboard" subtitle="Welcome back! Here's your overview." />
      
      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Contacts"
            value={stats.contacts}
            subtitle="Active leads & customers"
            icon={Users}
            trend={{ value: 12, isPositive: true }}
            delay={0}
          />
          <StatsCard
            title="Conversations"
            value={stats.conversations}
            subtitle="Active chats"
            icon={MessageSquare}
            delay={0.1}
          />
          <StatsCard
            title="Pending Follow-ups"
            value={stats.reminders}
            subtitle="Action required"
            icon={Bell}
            delay={0.2}
          />
          <StatsCard
            title="Templates"
            value={stats.templates}
            subtitle="Quick responses"
            icon={TrendingUp}
            delay={0.3}
          />
        </div>

        {/* Quick Actions */}
        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StaggerItem>
            <Card className="hover-lift border-border/50 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Recent Contacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>No contacts yet.</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/contacts")}
                    className="mt-2 text-primary hover:underline"
                  >
                    Add your first contact →
                  </motion.button>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="hover-lift border-border/50 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Upcoming Reminders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>No pending reminders.</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/follow-ups")}
                    className="mt-2 text-primary hover:underline"
                  >
                    Create a reminder →
                  </motion.button>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
