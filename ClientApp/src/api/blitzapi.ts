import axios from 'axios';
import {
    CronjobCreateDto,
    CronjobDetailDto,
    CronjobExecutionsListDto,
    CronjobListDto,
    ExecutionDetailDto,
    GrantUpdateRequest,
    ProjectCreateInput,
    ProjectDetailsDto,
    ProjectListDto,
    RoleUpdateRequest,
    UserGrant,
    UserOverview,
} from './types';

export const fetchCronjob = async (id: string) => {
    const { data } = await axios.get<CronjobDetailDto>(`/cronjobs/${id}`);
    await sleep();
    return data;
};

export const sleep = async (duration: number = Math.random() * 300 + 700) =>
    new Promise((resolve) => setTimeout(resolve, duration));

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

interface UserClaimListDto {
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
}

export const fetchRoles = async () => {
    const { data } = await axios.get<RoleListDto[]>(`/users/roles`);
    return data;
};

export const fetchUserRoles = async (userId: string) => {
    const { data } = await axios.get<UserGrant[]>(`/users/${userId}/roles`);
    await sleep();
    return data;
};

export const updateUserRoles = async (userId: string, req: RoleUpdateRequest) => {
    await axios.put(`/users/${userId}/roles`, req);
    await sleep();
};

export const fetchUserClaims = async (userId: string) => {
    const { data } = await axios.get<UserClaimListDto[]>(`/users/${userId}/claims`);
    await sleep();
    return data;
};

export interface UserClaimsUpdateRequest {
    projectIds: string[];
}

export const updateUserClaims = async (userId: string, req: GrantUpdateRequest) => {
    await axios.put(`/users/${userId}/claims`, req);
    await sleep();
};
