import { Progress, ProgressProps } from '@chakra-ui/react';
import React from 'react';
import { UseQueryResult } from 'react-query';

export const QueryProgress: React.FC<{ query: UseQueryResult } & ProgressProps> = (props) => {
    const { query, ...progressProps } = props;
    const inProgress = !query.isError && (query.isLoading || query.isPlaceholderData || query.isFetching);

    return <Progress height={1} size="xs" isIndeterminate {...progressProps} opacity={inProgress ? 1 : 0} />;
};
