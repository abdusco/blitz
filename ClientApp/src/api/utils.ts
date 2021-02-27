import { AxiosError } from 'axios';

export const useTranslateApiError = (): ((error: AxiosError, verb?: string) => string) => {
    return (error, verb = 'to perform this operation') => {
        if (error.response?.status === 403) {
            return `You are unauthorized to ${verb}`;
        }
        if (error.response?.status === 401) {
            return `You need to be authenticated to ${verb}`;
        }

        

        return `Failed to ${verb}.`;
    };
};
