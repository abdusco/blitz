import { Tag } from '@chakra-ui/react';
import React from 'react';
import { ExecutionState } from '../api';

export const ExecutionStatePill: React.FC<{ state?: ExecutionState }> = ({ state = '?' }) => {
    return (
        <Tag borderRadius={20} size="sm">
            {state.toUpperCase()}
        </Tag>
    );
};
