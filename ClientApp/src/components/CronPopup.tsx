import { Box, Popover, PopoverContent, PopoverProps, PopoverTrigger, Stack } from '@chakra-ui/react';
import React from 'react';

export const CronPopup: React.FC<PopoverProps & { cron: string }> = (props) => {
    const { cron, children, ...tooltipProps } = props;
    return (
        <Popover trigger="hover" arrowSize={4} autoFocus={false} isLazy={true} {...tooltipProps}>
            <PopoverTrigger>{children}</PopoverTrigger>
            <PopoverContent bg="gray.200" borderRadius={'xl'}>
                <Box p={4}>
                    <Stack spacing={4}>
                        <b>Cron Description</b>
                        <span>{cron}</span>
                    </Stack>
                </Box>
            </PopoverContent>
        </Popover>
    );
};
