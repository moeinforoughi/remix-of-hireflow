import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Template {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  variables: string[];
  created_at: string;
}

export default function TemplatesList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setRemoveDialogOpen] = useState(false);
  const [templateToRemove, setTemplateToRemove] = useState<string | null>(null);
  const [isSiteAdmin, setIsSiteAdmin] = useState(false);

  useEffect(() => {
    fetchTemplates();
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "site_admin")
      .single();

    setIsSiteAdmin(!!data);
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .order("name");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching templates",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveClick = (id: string) => {
    setTemplateToRemove(id);
    setRemoveDialogOpen(true);
  };

  const handleRemoveConfirm = async () => {
    if (!templateToRemove) return;

    try {
      const { error } = await supabase
        .from("message_templates")
        .delete()
        .eq("id", templateToRemove);

      if (error) throw error;

      toast({
        title: "Template deleted",
        description: "The template has been deleted successfully",
      });

      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Error deleting template",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRemoveDialogOpen(false);
      setTemplateToRemove(null);
    }
  };

  if (loading) {
    return <div className="p-8">در حال بارگذاری...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">پیام Templates</h1>
        </div>
        <Button onClick={() => navigate("/templates/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">خیر templates yet</p>
            <Button onClick={() => navigate("/templates/new")}>
              <Plus className="mr-2 h-4 w-4" />
              ایجاد your first template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className="text-lg">{template.name}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/templates/${template.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveClick(template.id)}
                              disabled={!isSiteAdmin}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {!isSiteAdmin && (
                          <TooltipContent>
                            <p>Only site administrators can delete templates</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium mb-2">{template.subject}</p>
                {template.variables.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-2">Available Variables:</p>
                    <div className="flex flex-wrap gap-2">
                      {template.variables.map((variable) => (
                        <Badge key={variable} variant="outline" className="font-mono text-xs">
                          {"{{"}{variable}{"}}"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {template.body_html.replace(/<[^>]*>/g, "")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        onConfirm={handleRemoveConfirm}
        title="حذف Template"
        description="Are you sure you want to delete this template? This action cannot be undone."
        confirmText="حذف"
        variant="destructive"
      />
    </div>
  );
}
