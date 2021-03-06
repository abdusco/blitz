import { ChevronRightIcon } from '@chakra-ui/icons';
import { Heading, IconButton, Progress, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import React, { useCallback, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { Link, useRouteMatch } from 'react-router-dom';
import { Column } from 'react-table';
import { fetchExecution } from '../api';
import { ExecutionDetailDto, ExecutionStatusUpdate } from '../api';
import DataTable from '../components/DataTable';
import { ExecutionStatePill } from '../components/ExecutionStatePill';
import { QueryProgress } from '../components/QueryProgress';
import Head from '../components/Head';
import Hero from '../components/Hero';
import DefaultLayout, { Clamp } from '../layout/layout';
import { flattenObject } from '../lib/objects';
import styles from './execution.module.scss';
import { formatDateISO } from '../lib/date';
import LinkWithState from '../components/LinkWithState';

export default function Execution() {
    const {
        params: { id },
    } = useRouteMatch<{ id: string }>();

    const query = useQuery(['executions', id], () => fetchExecution(id), { refetchInterval: 4000 });
    const { data } = query;

    return (
        <DefaultLayout>
            <Head>
                {!data && <title>Execution details for {id}</title>}
                {data && (
                    <title>
                        Details for {data.cronjob.title} execution at {data.createdAt}: {id}
                    </title>
                )}
            </Head>

            <Hero>
                <Hero.Title>Execution {id.toUpperCase()}</Hero.Title>
                <QueryProgress query={query} />
                {data && <ExecutionSummary data={data} />}
            </Hero>

            <Clamp>
                <Heading as="h2" size="md" mb="4">
                    Status updates
                </Heading>
                {data && <StatusUpdates data={data} />}
            </Clamp>
        </DefaultLayout>
    );
}

const ExecutionSummary: React.FC<{ data: ExecutionDetailDto }> = ({ data }) => {
    return (
        <Table width="unset">
            <Tbody>
                <Tr>
                    <Th>Project</Th>
                    <Td>
                        <LinkWithState
                            pathname={`/projects/${data.cronjob.projectId}`}
                            state={{ title: data.cronjob.projectTitle }}
                            isEmphasized
                        >
                            {data.cronjob.projectTitle}
                        </LinkWithState>
                    </Td>
                </Tr>
                <Tr>
                    <Th>Cronjob</Th>
                    <Td>
                        <LinkWithState
                            pathname={`/cronjobs/${data.cronjob.id}`}
                            state={{ title: data.cronjob.title }}
                            isEmphasized
                        >
                            {data.cronjob.title}
                        </LinkWithState>
                    </Td>
                </Tr>
                <Tr>
                    <Th>Triggered at</Th>
                    <Td>{formatDateISO(data.createdAt)}</Td>
                </Tr>
                <Tr>
                    <Th>State</Th>
                    <Td>
                        <ExecutionStatePill state={data.state} />
                    </Td>
                </Tr>
            </Tbody>
        </Table>
    );
};

const StatusUpdates: React.FC<{ data: ExecutionDetailDto }> = ({ data }) => {
    const canExpand = (row) => Object.keys(row.original.details).length > 0;
    const columns = useMemo(
        () =>
            [
                {
                    Header: '',
                    id: 'details',
                    Cell: ({ row }) => (
                        <IconButton
                            size="sm"
                            aria-label="Show update details"
                            icon={<ChevronRightIcon />}
                            disabled={!canExpand(row)}
                            onClick={() => row.toggleRowExpanded()}
                        />
                    ),
                    props: {
                        style: {
                            width: 0,
                            paddingRight: 0,
                        },
                    },
                },
                { Header: 'Date', accessor: 'createdAt', Cell: ({ value }) => formatDateISO(value) },
                { Header: 'State', accessor: 'state', Cell: ({ value }) => <ExecutionStatePill state={value} /> },
            ] as Column<ExecutionStatusUpdate>[],
        []
    );
    return (
        <>
            <DataTable
                data={data.updates}
                columns={columns}
                canExpand={canExpand}
                renderRowDetail={(row) => (
                    <Table className={styles.updatesTable}>
                        <Thead>
                            <Tr>
                                <Th className={styles.updateKey}>Key</Th>
                                <Th className={styles.updateValue}>Value</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {Object.entries(flattenObject(row.original.details)).map(([k, v]) => {
                                const isJson = typeof v === 'string' && v.startsWith('{') && v.endsWith('}');
                                if (isJson) {
                                    v = JSON.stringify(JSON.parse(v), null, 2);
                                }
                                return (
                                    <Tr key={k}>
                                        <Td className={styles.updateKey}>
                                            <b>{k}</b>
                                        </Td>
                                        <Td>
                                            <pre className={styles.updateValue}>
                                                <code>{v}</code>
                                            </pre>
                                        </Td>
                                    </Tr>
                                );
                            })}
                        </Tbody>
                    </Table>
                )}
            />
        </>
    );
};
