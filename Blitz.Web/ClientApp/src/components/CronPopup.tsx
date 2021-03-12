import { Box, Popover, PopoverContent, PopoverProps, PopoverTrigger, Stack } from '@chakra-ui/react';
import styled from '@emotion/styled';
import cronstrue from 'cronstrue';
import React from 'react';


const humanizeCron = (cron: string): { error?: string; description?: string } => {
    if (!cron?.trim()) return {};
    try {
        const description = cronstrue.toString(cron, {
            use24HourTimeFormat: true,
            verbose: false,
            throwExceptionOnParseError: true,
        });
        return { description };
    } catch (error) {
        return { error };
    }
};

const CronScheduleList = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0;
`;

export const CronPopup: React.FC<PopoverProps & { cron: string }> = (props) => {
    const { cron, children, ...tooltipProps } = props;
    const humanCron = humanizeCron(cron);
    
    // schedule estimation doesn't work properly :/
    // const next = nextDates(cron).map((d) => dayjs(d, {utc: true}).local().format('YYYY-MM-DD HH:mm'));
    return (
        <Popover trigger="hover" arrowSize={4} autoFocus={false} isLazy={true} {...tooltipProps}>
            <PopoverTrigger>{children}</PopoverTrigger>
            <PopoverContent
                color={humanCron.error ? 'red.600' : 'black'}
                bg={humanCron.error ? 'red.100' : 'gray.200'}
                borderRadius={'xl'}
            >
                <Box p={4}>
                    <Stack spacing={2}>
                        <b>Description</b>
                        {humanCron.description && <span>{humanCron.description}</span>}
                        {humanCron.error && <span>{humanCron.error}</span>}
                        {/* {next && (
                            <>
                                <b>Estimated schedule</b>
                                <CronScheduleList>
                                    {next.map((d) => (
                                        <li key={d}>{d}</li>
                                    ))}
                                </CronScheduleList>
                            </>
                        )} */}
                    </Stack>
                </Box>
            </PopoverContent>
        </Popover>
    );
};
