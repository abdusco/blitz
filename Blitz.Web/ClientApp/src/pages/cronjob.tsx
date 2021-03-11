import { Button, Stack, Table, Tbody, Td, Th, Tr, useToast } from '@chakra-ui/react';
import React, { useMemo } from 'react';
import { useMutation, useQuery } from 'react-query';
import { useHistory, useLocation, useRouteMatch } from 'react-router-dom';
import { Column } from 'react-table';
import {
    CronjobDetailDto,
    CronjobExecutionsListDto,
    fetchCronjob,
    fetchCronjobExecutions,
    triggerCronjob,
} from '../api';
import { CronjobEnabledSwitch } from '../components/CronjobEnabledSwitch';
import { CronPopup } from '../components/CronPopup';
import DataTable from '../components/DataTable';
import { ExecutionStatePill } from '../components/ExecutionStatePill';
import Head from '../components/Head';
import Hero from '../components/Hero';
import LinkWithState from '../components/LinkWithState';
import { QueryProgress } from '../components/QueryProgress';
import DefaultLayout, { Clamp } from '../layout/layout';
import { formatDateISO } from '../lib/date';
import { useRequireAuth } from '../lib/useRequireAuth';
import { useRequireProjectClaim } from '../lib/useRequireProjectClaim';

export default function Cronjob() {
    useRequireAuth('pm');
    const {
        params: { id },
    } = useRouteMatch<{ id: string }>();
    const { state } = useLocation<CronjobDetailDto>();
    const cronjobQuery = useQuery(['cronjobs', id], () => fetchCronjob(id), { placeholderData: state });
    const executionsQuery = useQuery(['cronjobs', id, 'executions'], () => fetchCronjobExecutions(id), {
        placeholderData: [] as CronjobExecutionsListDto[],
    });
    const history = useHistory();
    const toast = useToast();

    useRequireProjectClaim(cronjobQuery.data?.projectId);

    const mutation = useMutation(() => triggerCronjob(id), {
        onSuccess(executionId) {
            toast({
                title: 'Triggered',
                duration: 1000,
            });
            history.push(`/executions/${executionId}`);
        },
    });

    return (
        <DefaultLayout>
            <Head>
                <title>{cronjobQuery.data?.title}</title>
            </Head>

            <Hero>
                <Hero.Title>{cronjobQuery.data?.title}</Hero.Title>
                <Hero.Body>
                    <QueryProgress query={cronjobQuery} />
                    {!cronjobQuery.isPlaceholderData && cronjobQuery.data && (
                        <CronjobDetails data={cronjobQuery.data} />
                    )}
                    <Button
                        mt={4}
                        // size="sm"
                        colorScheme="blue"
                        isLoading={mutation.isLoading}
                        onClick={() => mutation.mutate()}
                    >
                        Trigger
                    </Button>
                </Hero.Body>
            </Hero>

            <Clamp>
                <Stack spacing={12}>
                    <div>
                        <QueryProgress query={executionsQuery} />
                        {!executionsQuery.isPlaceholderData && executionsQuery.data && (
                            <RecentExecutions data={executionsQuery.data} />
                        )}
                    </div>
                </Stack>
            </Clamp>
        </DefaultLayout>
    );
}

const CronjobDetails: React.FC<{ data: CronjobDetailDto }> = (props) => {
    const { data } = props;
    return (
        <>
            <Table width="unset">
                <Tbody>
                    <Tr>
                        <Th>Project</Th>
                        <Td>
                            <LinkWithState
                                pathname={`/projects/${data.projectId}`}
                                state={{ title: data.projectTitle }}
                            >
                                {data.projectTitle}
                            </LinkWithState>
                        </Td>
                    </Tr>
                    <Tr>
                        <Th>Cron</Th>
                        <Td>
                            <CronPopup placement="right" cron={data.cron}>
                                <span>
                                    <code>{data.cron}</code>
                                </span>
                            </CronPopup>
                        </Td>
                    </Tr>
                    <Tr>
                        <Th>URL</Th>
                        <Td>
                            <code>
                                <b>{data.httpMethod}</b> {data.url}
                            </code>
                        </Td>
                    </Tr>
                    <Tr>
                        <Th>Enabled</Th>
                        <Td>
                            <CronjobEnabledSwitch id={data.id} projectId={data.projectId} enabled={data.enabled} />
                        </Td>
                    </Tr>
                </Tbody>
            </Table>
        </>
    );
};

export const RecentExecutions: React.FC<{ data: CronjobExecutionsListDto[] }> = (props) => {
    const { data } = props;

    const columns = useMemo(
        () =>
            [
                {
                    Header: 'Date',
                    accessor: 'createdAt',
                    Cell: ({ value, row }) => (
                        <LinkWithState isEmphasized={true} pathname={`/executions/${row.original.id}`}>
                            {formatDateISO(value)}
                        </LinkWithState>
                    ),
                },
                { Header: 'Status', accessor: 'state', Cell: ({ value }) => <ExecutionStatePill state={value} /> },
            ] as Column<CronjobExecutionsListDto>[],
        []
    );

    return <DataTable data={data} columns={columns} />;
};
