import { useEffect } from 'react';
import { useAuth } from './auth';
import { useHistory } from 'react-router-dom';

export const useRequireAuth = () => {
    const { ready, user } = useAuth();
    const router = useHistory();

    useEffect(() => {
        if (ready && !user) {
            router.push('/forbidden', { next: router.location.pathname });
        }
    }, [ready, user]);
};
