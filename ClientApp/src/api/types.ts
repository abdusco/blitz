import { AxiosError } from 'axios';

export interface ApiError extends AxiosError {}

export interface ODataResponse<T> {
    '@odata.context': string;
    value: T;
}

export interface UserProfile {
    sub: string;
    name: string;
    roles: string[];
    permissions: string[];
}
