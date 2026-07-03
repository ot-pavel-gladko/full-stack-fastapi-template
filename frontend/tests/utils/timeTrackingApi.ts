import {
  LoginService,
  OpenAPI,
  type ProjectCreate,
  ProjectsService,
  TimeEntriesService,
  type TimeEntryCreate,
} from "../../src/client"

OpenAPI.BASE = `${process.env.VITE_API_URL}`

export const getAccessToken = async (username: string, password: string) => {
  const tokenResponse = await LoginService.loginAccessToken({
    formData: { username, password },
  })
  return tokenResponse.access_token
}

export const createProjectAs = async (
  token: string,
  requestBody: ProjectCreate,
) => {
  OpenAPI.TOKEN = token
  return await ProjectsService.createProject({ requestBody })
}

export const updateProjectStatusAs = async (
  token: string,
  id: string,
  status: "active" | "archived",
) => {
  OpenAPI.TOKEN = token
  return await ProjectsService.updateProject({
    id,
    requestBody: { status },
  })
}

export const createTimeEntryAs = async (
  token: string,
  requestBody: TimeEntryCreate,
) => {
  OpenAPI.TOKEN = token
  return await TimeEntriesService.createTimeEntry({ requestBody })
}
