import { zodResolver } from "@hookform/resolvers/zod"
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { TimeEntriesService, type TimeEntryCreate } from "@/client"
import { getProjectsQueryOptions } from "@/components/Projects/queries"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import { todayIso } from "./dateUtils"

const formSchema = z.object({
  project_id: z.string().min(1, { message: "Select a project" }),
  entry_date: z.string().min(1, { message: "Date is required" }),
  hours: z
    .string()
    .min(1, { message: "Hours is required" })
    .refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
      message: "Hours must be greater than 0",
    }),
  description: z.string().optional(),
  is_billable: z.boolean(),
})

type FormData = z.infer<typeof formSchema>

const defaultValues: FormData = {
  project_id: "",
  entry_date: todayIso(),
  hours: "",
  description: "",
  is_billable: true,
}

const LogTimeForm = () => {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const { data: projects } = useSuspenseQuery(getProjectsQueryOptions())
  const activeProjects = projects.data.filter(
    (project) => project.status === "active",
  )

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    criteriaMode: "all",
    defaultValues,
  })

  const mutation = useMutation({
    mutationFn: (data: TimeEntryCreate) =>
      TimeEntriesService.createTimeEntry({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Time entry logged")
      form.reset({ ...defaultValues, entry_date: todayIso() })
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] })
      queryClient.invalidateQueries({ queryKey: ["time-entries-summary"] })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate({
      project_id: data.project_id,
      entry_date: data.entry_date,
      hours: data.hours,
      description: data.description,
      is_billable: data.is_billable,
    })
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h2 className="font-semibold">New time entry</h2>
        <p className="text-muted-foreground text-sm">
          All fields except description are required.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="project_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Project <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)
                    const project = activeProjects.find((p) => p.id === value)
                    if (project) {
                      form.setValue(
                        "is_billable",
                        project.is_billable_default ?? true,
                      )
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a project…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {activeProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                        {project.client ? ` — ${project.client}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

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
                      step="0.25"
                      min="0"
                      placeholder="e.g. 3.5"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="What did you work on?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_billable"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal">Billable</FormLabel>
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() =>
                form.reset({ ...defaultValues, entry_date: todayIso() })
              }
            >
              Cancel
            </Button>
            <LoadingButton type="submit" loading={mutation.isPending}>
              Save entry
            </LoadingButton>
          </div>
        </form>
      </Form>
    </Card>
  )
}

export default LogTimeForm
