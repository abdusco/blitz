import { useEffect } from 'react';
import { useAuth } from './auth';
import { useHistory } from 'react-router-dom';
import { UserProfile } from '../api';

export const useRequireProjectClaim = (projectId: string) => {
    const { ready, user } = useAuth();
    const profile = (user?.profile as unknown) as UserProfile;
    const router = useHistory();

    useEffect(() => {
        if (!ready || !user) {
            return;
        }

        const isAdmin = profile.roles?.includes('admin');
        if (isAdmin) {
            return;
        }

        if (
            !profile.claims
                .filter((c) => c.claimType === 'Project')
                .map((c) => c.claimValue)
                .includes(projectId)
        ) {
            router.push('/forbidden', { reason: 'You are not authorized to view this project' });
        }
    }, [ready, user]);
};
