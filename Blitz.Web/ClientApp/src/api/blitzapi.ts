import axios from 'axios';
import { ContextType } from 'react';

export interface ProjectListDto {
    id: string;
    title: string;
    cronjobsCount: number;
}

export interface ProjectCreateInput {
    title: string;
    auth?: TokenAuthCreateDto;
}

export interface TokenAuthDto {
    tokenEndpoint: string;
    clientId: string;
    scope: string;
}
export interface TokenAuthCreateDto {
    tokenEndpoint: string;
    clientId: string;
    clientSecret: string;
    scope: string;
}

export interface CronjobCreateDto {
    projectId: string;
    title: string;
    url: string;
    cron: string;
    httpMethod: string;
    auth?: TokenAuthCreateDto;
}

export interface CronjobListDto {
    id: string;
    projectId: string;
    title: string;
    url: string;
    cron: string;
    httpMethod: string;
}

export interface CronjobDetailDto {
    id: string;
    projectId: string;
    projectTitle: string;
    title: string;
    cron: string;
    url: string;
    httpMethod: string;
    enabled: boolean;
}

export interface CronJobOverviewDto {
    id: string;
    title: string;
    cron: string;
    enabled: boolean;
}

export interface ProjectDetailsDto {
    id: string;
    title: string;
    cronjobs: CronJobOverviewDto[];
}

export interface CronjobExecutionsListDto {
    id: string;
    cronjobId: string;
    createdAt: string;
    state?: ExecutionState;
}

export type ExecutionState = 'unknown' | 'pending' | 'triggered' | 'started' | 'finished' | 'failed' | 'timedout';

export interface ExecutionDetailDto {
    id: string;
    createdAt: string;
    cronjob: {
        id: string;
        projectId: string;
        projectTitle: string;
        title: string;
    };
    state: ExecutionState;
    updates: ExecutionStatusUpdate[];
}

export interface ExecutionStatusUpdate {
    id: string;
    createdAt: string;
    state: ExecutionState;
    details: Record<string, any>;
}

export interface ConfigTemplateCreateDto {
    title: string;
    auth: TokenAuthCreateDto;
}

export interface ConfigTemplateDto {
    id: string;
    title: string;
    auth: TokenAuthCreateDto;
}

export const fetchCronjob = async (id: string) => {
    const { data } = await axios.get<CronjobDetailDto>(`/cronjobs/${id}`);
    await sleep();
    return data;
};

export const triggerCronjob = async (id: string) => {
    const { data } = await axios.post<string>(`/cronjobs/${id}/trigger`);
    await sleep();
    return data;
};

export const sleep = async (duration: number = 0) => new Promise((resolve) => setTimeout(resolve, duration));

export const toggleCronjobEnabled = async ({ id, enabled }: { id: string; enabled: boolean }) => {
    await axios.patch(`/cronjobs/${id}`, { enabled });
    await sleep();
    return enabled;
};

export const createCronjob = async (payload: CronjobCreateDto) => {
    const { data } = await axios.post<CronjobDetailDto>(`/cronjobs`, payload);
    await sleep();
    return data;
};

export const fetchCronjobs = async () => {
    const { data } = await axios.get<CronjobListDto[]>('/cronjobs');
    await sleep();
    return data;
};

export const fetchCronjobExecutions = async (id: string) => {
    const { data } = await axios.get<CronjobExecutionsListDto[]>(`/cronjobs/${id}/executions`);
    await sleep();
    return data;
};

export const fetchProjects = async () => {
    const { data } = await axios.get<ProjectListDto[]>('/projects');
    await sleep();
    return data;
};

export const fetchProject = async (id: string) => {
    const { data } = await axios.get<ProjectDetailsDto>(`/projects/${id}`);
    await sleep();
    return data;
};

export const createProject = async (payload: ProjectCreateInput) => {
    const { data } = await axios.post<string>(`/projects`, payload);
    return data;
};

export const fetchExecution = async (id: string) => {
    const { data } = await axios.get<ExecutionDetailDto>(`/executions/${id}`);
    await sleep();
    return data;
};

export const fetchLatestExecutions = async () => {
    const { data } = await axios.get<ExecutionDetailDto[]>(`/executions`);
    await sleep();
    return data;
};

export interface UserClaimListDto {
    id: string;
    claimType: string;
    claimValue: string;
}

export interface UserListDto {
    id: string;
    name: string;
    roles: RoleListDto[];
    claims: UserClaimListDto[];
}

export const fetchUsers = async () => {
    const { data } = await axios.get<UserListDto[]>(`/users`);
    await sleep();
    return data;
};

export interface RoleListDto {
    id: string;
    name: string;
    title: string;
}

export const fetchRoles = async () => {
    const { data } = await axios.get<RoleListDto[]>(`/users/roles`);
    return data;
};

export interface UserDto extends UserListDto {
    id: string;
    name: string;
    roles: RoleListDto[];
    claims: UserClaimListDto[];
}

export const fetchUser = async (userId: string) => {
    const { data } = await axios.get<UserDto>(`/users/${userId}`);
    await sleep();
    return data;
};

export interface RoleUpdateRequest {
    roleNames: string[];
}

export const updateUserRoles = async (userId: string, req: RoleUpdateRequest) => {
    await axios.put(`/users/${userId}/roles`, req);
    await sleep();
};

export interface UserClaimsUpdateRequest {
    projectIds: string[];
}

export const updateUserClaims = async (userId: string, req: UserClaimsUpdateRequest) => {
    await axios.put(`/users/${userId}/claims`, req);
    await sleep();
};

export const deleteUser = async (userId: string) => {
    await axios.delete(`/users/${userId}`);
    await sleep();
};

export const createTemplate = async (payload: ConfigTemplateCreateDto): Promise<ConfigTemplateDto> => {
    const res = await axios.post<ConfigTemplateDto>(`/templates`, payload);
    return res.data;
};

export const fetchTemplates = async (): Promise<ConfigTemplateDto[]> => {
    const res = await axios.get<ConfigTemplateDto[]>(`/templates`);
    return res.data;
};

export const updateTemplate = async (
    templateId: string,
    payload: ConfigTemplateCreateDto
): Promise<ConfigTemplateDto> => {
    const res = await axios.patch<ConfigTemplateDto>(`/templates/${templateId}`, payload);
    return res.data;
};