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
    UserRolesUpdateRequest,
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

interface RolesUpdateRequest {
    roleNames: string[];
}

export const updateUserRoles = async (userId: string, req: RolesUpdateRequest) => {
    await axios.put(`/users/${userId}/roles`, req);
    await sleep();
};

export interface UserClaimsUpdateRequest {
    projectIds: string[];
}

export const updateUserClaims = async (userId: string, req: GrantUpdateRequest) => {
    await axios.put(`/users/${userId}/claims`, req);
    await sleep();
};

export const deleteUser = async (userId: string) => {
    await axios.delete(`/users/${userId}`);
    await sleep();
};
