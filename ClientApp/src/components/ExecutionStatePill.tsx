import { Badge, Tag } from '@chakra-ui/react';
import React from 'react';
import { ExecutionState } from '../api';

export const ExecutionStatePill: React.FC<{ state?: ExecutionState }> = ({ state = '?' }) => {
    return (
        <Badge size="md" colorScheme="green">
            {state.toUpperCase()}
        </Badge>
    );
};
