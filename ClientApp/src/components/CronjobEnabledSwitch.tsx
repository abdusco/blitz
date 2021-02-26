import React, { useCallback, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toggleCronjobEnabled } from '../api';
import SpinnerSwitch from './SpinnerSwitch';

export const CronjobEnabledSwitch: React.FC<{ id: string; enabled: boolean; projectId?: string }> = ({
    id,
    enabled,
    projectId,
}) => {
    const queryClient = useQueryClient();

    const [checked, setChecked] = useState(enabled);
    useEffect(() => setChecked(enabled), [enabled]);

    const mutation = useMutation(toggleCronjobEnabled, {
        onSuccess: (apiEnabled) => {
            setChecked(apiEnabled);
            queryClient.invalidateQueries('cronjobs', { exact: true });
            queryClient.invalidateQueries(['cronjobs', id], { exact: true });
            queryClient.invalidateQueries(['projects', projectId]);
        },
    });

    return (
        <SpinnerSwitch
            isChecked={checked}
            onChange={(e) => mutation.mutate({ id, enabled: e.target.checked })}
            isLoading={mutation.isLoading}
        />
    );
};
