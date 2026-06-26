import { zodResolver } from "@hookform/resolvers/zod"
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Clock, FolderOpen, LayoutGrid, List, Pencil, Plus } from "lucide-react"
import { Suspense, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  type ProjectCreate,
  ProjectsService,
  type ProjectUpdate,
} from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import useCustomToast from "@/hooks/useCustomToast"
import { cn } from "@/lib/utils"
import { handleError } from "@/utils"

export const Route = createFileRoute("/_layout/projects")({
  component: Projects,
  head: () => ({
    meta: [{ title: "Projects - FastAPI Template" }],
  }),
})

// ---------------------------------------------------------------------------
// Query options
// ---------------------------------------------------------------------------
function getProjectsQueryOptions() {
  return {
    queryFn: () => ProjectsService.readProjects({ skip: 0, limit: 100 }),
    queryKey: ["projects"],
  }
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const projectFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
})
type ProjectFormData = z.infer<typeof projectFormSchema>

// ---------------------------------------------------------------------------
// New Project dialog
// ---------------------------------------------------------------------------
function AddProject() {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    mode: "onBlur",
    defaultValues: { name: "", description: "" },
  })

  const mutation = useMutation({
    mutationFn: (data: ProjectCreate) =>
      ProjectsService.createProjectEndpoint({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Project created successfully")
      form.reset()
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>
            Create a new project to start tracking time against it.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Project name" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What is this project about?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={mutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Create
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Edit Project dialog (archive / rename)
// ---------------------------------------------------------------------------
interface EditProjectDialogProps {
  project: {
    id: string
    name: string
    description?: string | null
    status?: string
  }
}

function EditProjectDialog({ project }: EditProjectDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const editSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    status: z.string().optional(),
  })
  type EditFormData = z.infer<typeof editSchema>

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: project.name,
      description: project.description ?? "",
      status: project.status ?? "active",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ProjectUpdate) =>
      ProjectsService.updateProjectEndpoint({
        id: project.id,
        requestBody: data,
      }),
    onSuccess: () => {
      showSuccessToast("Project updated")
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="px-2">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className={cn(
                          "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
                        )}
                      >
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={mutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Save
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Projects content
// ---------------------------------------------------------------------------
type ViewMode = "cards" | "grid"

function ProjectsContent() {
  const { data: projects } = useSuspenseQuery(getProjectsQueryOptions())
  const [view, setView] = useState<ViewMode>("cards")

  if (projects.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FolderOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No projects yet</h3>
        <p className="text-muted-foreground mt-1">
          Create your first project to start tracking time
        </p>
        <AddProject />
      </div>
    )
  }

  return (
    <>
      {/* View toggle */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex border rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => setView("cards")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium h-9 transition-colors",
              view === "cards"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Cards
          </button>
          <button
            type="button"
            onClick={() => setView("grid")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium h-9 border-l transition-colors",
              view === "grid"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <List className="h-3.5 w-3.5" />
            Grid
          </button>
        </div>
      </div>

      {view === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.data.map((project) => {
            const isArchived = project.status === "archived"
            return (
              <Card
                key={project.id}
                className={cn(
                  "transition-shadow hover:shadow-md",
                  isArchived && "opacity-70",
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">
                      {project.name}
                    </CardTitle>
                    <EditProjectDialog project={project} />
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {project.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="pb-2">
                  <Badge variant={isArchived ? "secondary" : "default"}>
                    {isArchived ? "Archived" : "Active"}
                  </Badge>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild={!isArchived}
                    disabled={isArchived}
                  >
                    {isArchived ? (
                      <>
                        <Clock className="mr-1 h-3.5 w-3.5" />
                        Log Time
                      </>
                    ) : (
                      <Link to="/log-time" search={{ project: project.id }}>
                        <Clock className="mr-1 h-3.5 w-3.5" />
                        Log Time
                      </Link>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.data.map((project) => {
                const isArchived = project.status === "archived"
                return (
                  <TableRow
                    key={project.id}
                    className={cn(isArchived && "opacity-70")}
                  >
                    <TableCell className="font-medium">
                      {project.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {project.description ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isArchived ? "secondary" : "default"}>
                        {isArchived ? "Archived" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild={!isArchived}
                          disabled={isArchived}
                        >
                          {isArchived ? (
                            <>
                              <Clock className="mr-1 h-3.5 w-3.5" />
                              Log Time
                            </>
                          ) : (
                            <Link
                              to="/log-time"
                              search={{ project: project.id }}
                            >
                              <Clock className="mr-1 h-3.5 w-3.5" />
                              Log Time
                            </Link>
                          )}
                        </Button>
                        <EditProjectDialog project={project} />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
function Projects() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Create and manage your time-tracking projects
          </p>
        </div>
        <AddProject />
      </div>
      <Suspense
        fallback={
          <div className="text-muted-foreground text-sm">Loading projects…</div>
        }
      >
        <ProjectsContent />
      </Suspense>
    </div>
  )
}
