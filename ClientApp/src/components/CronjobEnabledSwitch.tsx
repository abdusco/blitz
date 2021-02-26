import React, { useCallback, useState } from 'react';
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
    const mutation = useMutation(toggleCronjobEnabled, {
        onSuccess: useCallback(
            (currentEnabled) => {
                setChecked(currentEnabled);
                queryClient.invalidateQueries('cronjobs');
                queryClient.invalidateQueries(['cronjobs', id]);
                queryClient.invalidateQueries(['projects', projectId]);
            },
            [enabled, setChecked]
        ),
    });

    return (
        <SpinnerSwitch
            defaultChecked={checked}
            onChange={(e) => mutation.mutate({ id, enabled: e.target.checked })}
            isLoading={mutation.isLoading}
        />
    );
};
