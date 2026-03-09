import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FolderKanban, LayoutGrid, List, Calendar, GanttChart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockProjects, Project, ProjectStatus } from "@/types/project";
import ProjectFilters from "@/components/projects/ProjectFilters";
import ProjectMetrics from "@/components/projects/ProjectMetrics";
import ProjectKanban from "@/components/projects/ProjectKanban";
import ProjectList from "@/components/projects/ProjectList";
import ProjectCalendar from "@/components/projects/ProjectCalendar";
import ProjectTimeline from "@/components/projects/ProjectTimeline";
import ProjectDetailDialog from "@/components/projects/ProjectDetailDialog";

const Projects = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [selected, setSelected] = useState<Project | null>(null);

  const filtered = useMemo(() => {
    return mockProjects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.client.toLowerCase().includes(search.toLowerCase()) ||
        p.manager.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projetos</h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} projeto{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <ProjectMetrics projects={mockProjects} />
        <ProjectFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />

        {/* Views */}
        <Tabs defaultValue="kanban">
          <TabsList>
            <TabsTrigger value="kanban" className="gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-1.5">
              <List className="w-3.5 h-3.5" /> Lista
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Calendário
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1.5">
              <GanttChart className="w-3.5 h-3.5" /> Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kanban">
            <ProjectKanban projects={filtered} onSelect={setSelected} />
          </TabsContent>
          <TabsContent value="list">
            <ProjectList projects={filtered} onSelect={setSelected} />
          </TabsContent>
          <TabsContent value="calendar">
            <ProjectCalendar projects={filtered} onSelect={setSelected} />
          </TabsContent>
          <TabsContent value="timeline">
            <ProjectTimeline projects={filtered} onSelect={setSelected} />
          </TabsContent>
        </Tabs>

        <ProjectDetailDialog
          project={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
        />
      </div>
    </DashboardLayout>
  );
};

export default Projects;
