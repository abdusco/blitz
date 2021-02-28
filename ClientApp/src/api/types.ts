import { AxiosError } from 'axios';

export interface ApiError extends AxiosError {}

export interface ODataResponse<T> {
    '@odata.context': string;
    value: T;
}

export interface ProjectListDto {
    id: string;
    title: string;
    cronjobsCount: number;
}

export interface ProjectCreateInput {
    title: string;
}

export interface CronjobCreateDto {
    projectId: string;
    title: string;
    url: string;
    cron: string;
    httpMethod: string;
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

export interface UserOverview {
    id: string;
    name: string;
    roleIds: string[];
}

export interface RoleOverview {
    id: string;
    name: string;
}

export interface RoleUpdateRequest {
    roleNames: string[];
}

export interface UserGrant {
    claimType: string;
    resource: string;
}

export interface GrantUpdateRequest {
    projectIds: string[];
}

export interface UserProfile {
    sub: string;
    name: string;
    roles: string[];
    permissions: string[];
}