import axios from 'axios';
import {
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

export const fetchUsers = async () => {
    const { data } = await axios.get<UserOverview[]>(`/users`);
    await sleep();
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

export const fetchUserGrants = async (userId: string) => {
    const { data } = await axios.get<UserGrant[]>(`/users/${userId}/grants`);
    await sleep();
    return data;
};

export const updateUserGrants = async (userId: string, req: GrantUpdateRequest) => {
    await axios.put(`/users/${userId}/grants`, req);
    await sleep();
};
