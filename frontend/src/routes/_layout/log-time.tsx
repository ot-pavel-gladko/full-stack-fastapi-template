import { zodResolver } from "@hookform/resolvers/zod"
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { CheckCircle2 } from "lucide-react"
import { Suspense, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  ProjectsService,
  TimeEntriesService,
  type TimeEntryCreate,
} from "@/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

// ---------------------------------------------------------------------------
// Search schema
// ---------------------------------------------------------------------------
const searchSchema = z.object({
  project: z.string().optional(),
})

export const Route = createFileRoute("/_layout/log-time")({
  component: LogTimePage,
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Log Time - FastAPI Template" }],
  }),
})

// ---------------------------------------------------------------------------
// Form schema
// ---------------------------------------------------------------------------
const formSchema = z.object({
  project_id: z.string().min(1, "Project is required"),
  entry_date: z.string().min(1, "Date is required"),
  hours: z
    .string()
    .min(1, "Hours are required")
    .refine(
      (v) => {
        const n = parseFloat(v)
        return !Number.isNaN(n) && n >= 0.25 && n <= 24
      },
      { message: "Hours must be between 0.25 and 24" },
    )
    .refine(
      (v) => {
        const n = parseFloat(v)
        return Math.round(n * 4) === n * 4
      },
      { message: "Hours must be a multiple of 0.25" },
    ),
  description: z.string().optional(),
  is_billable: z.boolean().default(true),
})

type FormData = z.infer<typeof formSchema>

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// Projects query
// ---------------------------------------------------------------------------
function getProjectsQueryOptions() {
  return {
    queryFn: () => ProjectsService.readProjects({ skip: 0, limit: 100 }),
    queryKey: ["projects"],
  }
}

// ---------------------------------------------------------------------------
// Log Time Form
// ---------------------------------------------------------------------------
function LogTimeForm() {
  const { project: preselectedProjectId } = Route.useSearch()
  const { data: projectsData } = useSuspenseQuery(getProjectsQueryOptions())
  const queryClient = useQueryClient()
  const { showErrorToast } = useCustomToast()
  const [saved, setSaved] = useState(false)

  // Only active projects can receive time entries
  const activeProjects = projectsData.data.filter(
    (p) => p.status !== "archived",
  )

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      project_id: preselectedProjectId ?? "",
      entry_date: today(),
      hours: "",
      description: "",
      is_billable: true,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: TimeEntryCreate) =>
      TimeEntriesService.createTimeEntryEndpoint({ requestBody: data }),
    onSuccess: () => {
      setSaved(true)
      form.reset({
        project_id: preselectedProjectId ?? "",
        entry_date: today(),
        hours: "",
        description: "",
        is_billable: true,
      })
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] })
    },
  })

  const onSubmit = (data: FormData) => {
    setSaved(false)
    mutation.mutate({
      project_id: data.project_id,
      entry_date: data.entry_date,
      hours: parseFloat(data.hours),
      description: data.description || undefined,
      is_billable: data.is_billable,
    })
  }

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>New Time Entry</CardTitle>
          <CardDescription>
            Fill in the details below. All fields except description are
            required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
              {/* Project select */}
              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Project <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a project…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeProjects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date + Hours row */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="entry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Date <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Hours <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 2.5"
                          min={0.25}
                          max={24}
                          step={0.25}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Minimum 0.25 h (15 min)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Description{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What did you work on?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Billable switch */}
              <FormField
                control={form.control}
                name="is_billable"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between rounded-md border bg-muted p-4">
                      <div>
                        <FormLabel className="text-base font-medium">
                          Billable
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Mark this entry as billable to the client
                        </p>
                      </div>
                      <FormControl>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={field.value}
                          onClick={() => field.onChange(!field.value)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            field.value ? "bg-primary" : "bg-input"
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              field.value ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-1">
                <LoadingButton type="submit" loading={mutation.isPending}>
                  Save Entry
                </LoadingButton>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset()
                    setSaved(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Success banner */}
      {saved && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="font-semibold">Entry saved</p>
                <p className="text-sm text-muted-foreground">
                  Your time entry has been recorded.
                </p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto" asChild>
                <Link to="/hours-dashboard">View Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
function LogTimePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Log Time</h1>
        <p className="text-muted-foreground">
          Record hours worked against a project
        </p>
      </div>
      <Suspense
        fallback={<div className="text-muted-foreground text-sm">Loading…</div>}
      >
        <LogTimeForm />
      </Suspense>
    </div>
  )
}
