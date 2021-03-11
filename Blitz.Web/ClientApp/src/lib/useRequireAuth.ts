import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from './auth';

export const useRequireAuth = (...anyOfRoles: string[]) => {
    const { ready, user } = useAuth();
    const router = useHistory();

    useEffect(() => {
        if (ready && !user) {
            router.push('/unauthenticated', { next: router.location.pathname });
        }
    }, [ready, user]);

    useEffect(() => {
        if (!ready || !user) {
            return;
        }

        if (user.hasRole('admin')) {
            return;
        }

        if (anyOfRoles.length && !user.hasRole(...anyOfRoles)) {
            router.push('/forbidden', { next: router.location.pathname });
        }
    }, [ready, user]);
};
