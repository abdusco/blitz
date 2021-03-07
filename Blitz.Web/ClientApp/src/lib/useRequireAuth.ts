import { useEffect } from 'react';
import { useAuth } from './auth';
import { useHistory } from 'react-router-dom';
import { UserProfile } from '../api';

export const useRequireAuth = (...anyOfRoles: string[]) => {
    const { ready, user } = useAuth();
    const profile = (user?.profile as unknown) as UserProfile;
    const router = useHistory();

    useEffect(() => {
        if (ready && !user) {
            router.push('/forbidden', { next: router.location.pathname });
        }
    }, [ready, user]);

    useEffect(() => {
        if (!ready || !user) {
            return;
        }

        const isAdmin = profile.roles?.includes('admin');
        if (isAdmin) {
            return;
        }

        if (anyOfRoles.length && !anyOfRoles.some((r) => profile.roles?.includes(r))) {
            router.push('/forbidden');
        }
    }, [ready, user]);
};
