import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FolderKanban, LayoutGrid, List, Calendar, GanttChart, User, Users, Layers } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  mockTaskEngine,
  getProjects,
  type TaskEngineItem,
  type UnifiedStatus,
} from "@/types/task-engine";
import ProjectFilters from "@/components/projects/ProjectFilters";
import ProjectMetrics from "@/components/projects/ProjectMetrics";
import ProjectKanban from "@/components/projects/ProjectKanban";
import ProjectList from "@/components/projects/ProjectList";
import ProjectCalendar from "@/components/projects/ProjectCalendar";
import ProjectTimeline from "@/components/projects/ProjectTimeline";
import ProjectDetailDialog from "@/components/projects/ProjectDetailDialog";
import NewProjectDialog from "@/components/projects/NewProjectDialog";
import UnifiedTaskList from "@/components/unified/UnifiedTaskList";
import UnifiedKanban from "@/components/unified/UnifiedKanban";
import UnifiedMyTasks from "@/components/unified/UnifiedMyTasks";
import UnifiedTeamView from "@/components/unified/UnifiedTeamView";

const Projects = () => {
  const [items, setItems] = useState(mockTaskEngine);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UnifiedStatus | "all">("all");
  const [selected, setSelected] = useState<TaskEngineItem | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [scope, setScope] = useState<"projects" | "tasks">("projects");

  const projects = useMemo(() => getProjects(items), [items]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.clientName.toLowerCase().includes(search.toLowerCase()) ||
        p.owner.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const filteredTasks = useMemo(() => {
    const tasks = items.filter((i) => i.task_type === "task");
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.clientName.toLowerCase().includes(search.toLowerCase()) ||
        t.assignee.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const handleUpdateItem = (updated: TaskEngineItem) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    if (selected?.id === updated.id) setSelected(updated);
  };

  const handleStatusChange = (itemId: string, newStatus: UnifiedStatus) => {
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, status: newStatus } : i));
  };

  const handleAddItem = (item: TaskEngineItem) => {
    setItems((prev) => [...prev, item]);
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id && i.parentId !== id));
  };

  const handleTaskClick = (task: TaskEngineItem) => {
    // Find the parent project and open it
    const project = items.find((i) => i.id === task.projectId);
    setSelected(project || task);
  };

  const totalTasks = items.filter((i) => i.task_type === "task").length;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projetos & Tarefas</h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} projeto{filtered.length !== 1 ? "s" : ""} · {totalTasks} tarefa{totalTasks !== 1 ? "s" : ""} · Motor unificado
            </p>
          </div>
        </div>

        {/* Scope toggle */}
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit">
          <button
            onClick={() => setScope("projects")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              scope === "projects" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Projetos
          </button>
          <button
            onClick={() => setScope("tasks")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              scope === "tasks" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="w-3.5 h-3.5" /> Tarefas
          </button>
        </div>

        <ProjectMetrics items={items} projects={filtered} />
        <ProjectFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          onNewProject={() => setShowNewProject(true)}
        />

        {scope === "projects" ? (
          <Tabs defaultValue="kanban">
            <TabsList>
              <TabsTrigger value="kanban" className="gap-1.5"><LayoutGrid className="w-3.5 h-3.5" /> Kanban</TabsTrigger>
              <TabsTrigger value="list" className="gap-1.5"><List className="w-3.5 h-3.5" /> Lista</TabsTrigger>
              <TabsTrigger value="calendar" className="gap-1.5"><Calendar className="w-3.5 h-3.5" /> Calendário</TabsTrigger>
              <TabsTrigger value="timeline" className="gap-1.5"><GanttChart className="w-3.5 h-3.5" /> Timeline</TabsTrigger>
            </TabsList>
            <TabsContent value="kanban">
              <ProjectKanban projects={filtered} allItems={items} onSelect={setSelected} onStatusChange={handleStatusChange} />
            </TabsContent>
            <TabsContent value="list">
              <ProjectList projects={filtered} allItems={items} onSelect={setSelected} />
            </TabsContent>
            <TabsContent value="calendar">
              <ProjectCalendar projects={filtered} allItems={items} onSelect={setSelected} />
            </TabsContent>
            <TabsContent value="timeline">
              <ProjectTimeline projects={filtered} allItems={items} onSelect={setSelected} />
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="list">
            <TabsList>
              <TabsTrigger value="list" className="gap-1.5"><List className="w-3.5 h-3.5" /> Lista</TabsTrigger>
              <TabsTrigger value="kanban" className="gap-1.5"><LayoutGrid className="w-3.5 h-3.5" /> Kanban</TabsTrigger>
              <TabsTrigger value="my" className="gap-1.5"><User className="w-3.5 h-3.5" /> Minhas</TabsTrigger>
              <TabsTrigger value="team" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Equipe</TabsTrigger>
            </TabsList>
            <TabsContent value="list">
              <UnifiedTaskList items={items.filter((i) => {
                if (i.task_type !== "task") return true;
                return filteredTasks.some((ft) => ft.id === i.id) || i.task_type !== "task";
              })} onItemClick={handleTaskClick} />
            </TabsContent>
            <TabsContent value="kanban">
              <UnifiedKanban items={items} onItemClick={handleTaskClick} />
            </TabsContent>
            <TabsContent value="my">
              <UnifiedMyTasks items={items} onItemClick={handleTaskClick} />
            </TabsContent>
            <TabsContent value="team">
              <UnifiedTeamView items={items} onItemClick={handleTaskClick} />
            </TabsContent>
          </Tabs>
        )}

        <ProjectDetailDialog
          project={selected}
          allItems={items}
          open={!!selected}
          onClose={() => setSelected(null)}
          onUpdateItem={handleUpdateItem}
          onAddItem={handleAddItem}
          onDeleteItem={handleDeleteItem}
        />
        <NewProjectDialog open={showNewProject} onOpenChange={setShowNewProject} onAdd={handleAddItem} />
      </div>
    </DashboardLayout>
  );
};

export default Projects;
