import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { type TimeEntryCreate, ProjectsService, TimeEntriesService } from "@/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import { todayIsoDate } from "./utils"

const formSchema = z.object({
  projectId: z.string().min(1, { message: "Project is required" }),
  entryDate: z.string().min(1, { message: "Date is required" }),
  hours: z.string().min(1, { message: "Hours is required" }).refine(
    (value) => Number(value) > 0,
    { message: "Hours must be greater than 0" },
  ),
  description: z.string().optional(),
  billable: z.boolean(),
})

type FormData = z.infer<typeof formSchema>

function defaultValues(): FormData {
  return {
    projectId: "",
    entryDate: todayIsoDate(),
    hours: "",
    description: "",
    billable: true,
  }
}

function getProjectsQueryOptions() {
  return {
    queryFn: () => ProjectsService.readProjects({ skip: 0, limit: 100 }),
    queryKey: ["projects"],
  }
}

const LogTimeForm = () => {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const { data: projects } = useQuery(getProjectsQueryOptions())

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: defaultValues(),
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      TimeEntriesService.createTimeEntry({
        requestBody: {
          project_id: data.projectId,
          entry_date: data.entryDate,
          hours: Number(data.hours),
          description: data.description || undefined,
          billable: data.billable,
        } satisfies TimeEntryCreate,
      }),
    onSuccess: () => {
      showSuccessToast("Time entry logged successfully")
      form.reset(defaultValues())
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] })
      queryClient.invalidateQueries({ queryKey: ["hours-summary"] })
    },
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  const onClear = () => {
    form.reset(defaultValues())
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Time</CardTitle>
        <CardDescription>Record hours against a project.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Project <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(projects?.data ?? []).map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
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
                name="entryDate"
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
                        placeholder="e.g. 2.5"
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
                    <Textarea placeholder="What did you work on?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Billable</FormLabel>
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClear}
                disabled={mutation.isPending}
              >
                Clear
              </Button>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Save Entry
              </LoadingButton>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default LogTimeForm
