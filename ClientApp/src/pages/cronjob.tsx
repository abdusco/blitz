import { Progress, Stack, Table, Td, Th, Tr } from '@chakra-ui/react';
import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import { Link, useLocation, useRouteMatch } from 'react-router-dom';
import { Column } from 'react-table';
import { fetchCronjob, fetchCronjobExecutions } from '../api';
import { CronjobDetailDto, CronjobExecutionsListDto } from '../api';
import { CronjobEnabledSwitch } from '../components/CronjobEnabledSwitch';
import DataTable from '../components/DataTable';
import { ExecutionStatePill } from '../components/ExecutionStatePill';
import { CronPopup, QueryProgress } from '../components/QueryProgress';
import Head from '../components/Head';
import Hero from '../components/Hero';
import LinkWithState from '../components/LinkWithState';
import DefaultLayout, { Clamp } from '../layout/layout';

export default function Cronjob() {
    const {
        params: { id },
    } = useRouteMatch<{ id: string }>();
    const { state } = useLocation<CronjobDetailDto>();
    const cronjobQuery = useQuery(['cronjobs', id], () => fetchCronjob(id), { placeholderData: state });
    const executionsQuery = useQuery(['cronjobs', id, 'executions'], () => fetchCronjobExecutions(id), {
        placeholderData: [] as CronjobExecutionsListDto[],
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
                <Tr>
                    <Th>Project</Th>
                    <Td>
                        <LinkWithState pathname={`/projects/${data.projectId}`} state={{ title: data.projectTitle }}>
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
                        <LinkWithState emphasize pathname={`/executions/${row.original.id}`}>
                            {value}
                        </LinkWithState>
                    ),
                },
                { Header: 'Status', accessor: 'state', Cell: ({ value }) => <ExecutionStatePill state={value} /> },
            ] as Column<CronjobExecutionsListDto>[],
        []
    );

    return <DataTable data={data} columns={columns} />;
};
