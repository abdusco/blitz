import { Badge, Tag, ThemeTypings } from '@chakra-ui/react';
import React from 'react';
import { ExecutionState } from '../api';

const colors: Record<ExecutionState, ThemeTypings['colorSchemes']> = {
    failed: 'red',
    finished: 'green',
    timedout: 'yellow',
    started: 'blue',
    triggered: 'cyan',
    pending: 'gray',
    unknown: 'gray',
};

export const ExecutionStatePill: React.FC<{ state?: ExecutionState }> = ({ state = '?' }) => {
    return (
        <Badge size="md" colorScheme={colors[state]}>
            {state.toUpperCase()}
        </Badge>
    );
};
