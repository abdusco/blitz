import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from './auth';

export const useRequireProjectClaim = (projectId: string|undefined) => {
    const { user, ready } = useAuth();
    const history = useHistory();

    useEffect(() => {
        if (!ready || !user) {
            return;
        }

        if (!projectId) {
            return;
        }

        if (user.hasRole('admin')) {
            return;
        }

        if (!user.hasClaim('Project', projectId)) {
            history.push('/forbidden', { reason: 'You are not authorized to view this project' });
        }
    }, [ready, user, projectId]);
};
