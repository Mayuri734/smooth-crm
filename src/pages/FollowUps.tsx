import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Bell, Calendar, Clock, CheckCircle, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { StaggerContainer, StaggerItem } from "@/components/animations/AnimatedContainers";

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  status: string;
  priority: string;
  contact_id: string | null;
  contact?: { name: string } | null;
}

const FollowUps = () => {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      fetchReminders();
    };
    checkAuth();
  }, [navigate]);

  const fetchReminders = async () => {
    const { data, error } = await supabase
      .from("reminders")
      .select(`
        *,
        contact:contacts(name)
      `)
      .order("due_date", { ascending: true });

    if (error) {
      toast({ title: "Error", description: "Failed to fetch reminders", variant: "destructive" });
    } else {
      setReminders(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("reminders").insert({
      ...formData,
      user_id: user.id,
      status: "pending",
    });

    if (error) {
      toast({ title: "Error", description: "Failed to create reminder", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Reminder created successfully" });
      fetchReminders();
      setIsDialogOpen(false);
      setFormData({ title: "", description: "", due_date: "", priority: "medium" });
    }
  };

  const handleComplete = async (id: string) => {
    const { error } = await supabase
      .from("reminders")
      .update({ status: "completed" })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to update reminder", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Reminder marked as completed" });
      fetchReminders();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("reminders").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete reminder", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Reminder deleted" });
      fetchReminders();
    }
  };

  const pendingReminders = reminders.filter((r) => r.status === "pending");
  const completedReminders = reminders.filter((r) => r.status === "completed");

  return (
    <DashboardLayout>
      <Header title="Follow-ups" subtitle={`${pendingReminders.length} pending reminders`} />

      <div className="p-6">
        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-6"
        >
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Clock className="w-4 h-4" />
              Pending ({pendingReminders.length})
            </Button>
            <Button variant="ghost" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Completed ({completedReminders.length})
            </Button>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2">
                <Plus className="w-4 h-4" />
                Add Reminder
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Reminder</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date *</Label>
                    <Input
                      id="due_date"
                      type="datetime-local"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="gradient-primary">
                    Create
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Reminders Grid */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : pendingReminders.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-10 h-10 text-primary" />}
            title="No pending follow-ups"
            description="Create reminders to never miss an important follow-up with your contacts."
            action={
              <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Reminder
              </Button>
            }
          />
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {pendingReminders.map((reminder) => (
                <StaggerItem key={reminder.id}>
                  <motion.div
                    layout
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -2 }}
                    className="group"
                  >
                    <Card className="border-border/50 shadow-soft hover:shadow-medium transition-all duration-300">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{reminder.title}</CardTitle>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleComplete(reminder.id)}
                              className="h-8 w-8"
                            >
                              <CheckCircle className="w-4 h-4 text-success" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(reminder.id)}
                              className="h-8 w-8"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {reminder.description && (
                          <p className="text-sm text-muted-foreground">{reminder.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(reminder.due_date), "MMM d, yyyy 'at' HH:mm")}
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={reminder.priority} />
                          {reminder.contact && (
                            <span className="text-sm text-muted-foreground">
                              • {reminder.contact.name}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </StaggerItem>
              ))}
            </AnimatePresence>
          </StaggerContainer>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FollowUps;
