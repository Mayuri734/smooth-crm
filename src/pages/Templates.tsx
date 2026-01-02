import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FileText, Copy, Edit, Trash2, Search } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { StaggerContainer, StaggerItem } from "@/components/animations/AnimatedContainers";

interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
  created_at: string;
}

const Templates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    content: "",
    category: "general",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      fetchTemplates();
    };
    checkAuth();
  }, [navigate]);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to fetch templates", variant: "destructive" });
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (selectedTemplate) {
      const { error } = await supabase
        .from("templates")
        .update(formData)
        .eq("id", selectedTemplate.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update template", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Template updated successfully" });
        fetchTemplates();
      }
    } else {
      const { error } = await supabase.from("templates").insert({
        ...formData,
        user_id: user.id,
      });

      if (error) {
        toast({ title: "Error", description: "Failed to create template", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Template created successfully" });
        fetchTemplates();
      }
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("templates").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Template deleted" });
      fetchTemplates();
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied!", description: "Template copied to clipboard" });
  };

  const resetForm = () => {
    setFormData({ name: "", content: "", category: "general" });
    setSelectedTemplate(null);
  };

  const openEditDialog = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      category: template.category,
    });
    setIsDialogOpen(true);
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.content.toLowerCase().includes(search.toLowerCase())
  );

  const categoryColors: Record<string, string> = {
    general: "bg-muted text-muted-foreground",
    greeting: "bg-success/10 text-success",
    followup: "bg-info/10 text-info",
    closing: "bg-warning/10 text-warning",
  };

  return (
    <DashboardLayout>
      <Header title="Templates" subtitle={`${templates.length} message templates`} />

      <div className="p-6">
        {/* Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2">
                <Plus className="w-4 h-4" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{selectedTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Welcome Message"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., greeting, followup, closing"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Message Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Hi {{name}}, thank you for reaching out..."
                    rows={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {"{{name}}"} to insert contact name dynamically
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="gradient-primary">
                    {selectedTemplate ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Templates Grid */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : filteredTemplates.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-10 h-10 text-primary" />}
            title="No templates yet"
            description="Create message templates to save time and maintain consistent communication."
            action={
              <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Template
              </Button>
            }
          />
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredTemplates.map((template) => (
                <StaggerItem key={template.id}>
                  <motion.div
                    layout
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -2 }}
                    className="group"
                  >
                    <Card className="border-border/50 shadow-soft hover:shadow-medium transition-all duration-300 h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <Badge className={categoryColors[template.category] || categoryColors.general}>
                              {template.category}
                            </Badge>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopy(template.content)}
                              className="h-8 w-8"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(template)}
                              className="h-8 w-8"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(template.id)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-4">
                          {template.content}
                        </p>
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

export default Templates;
