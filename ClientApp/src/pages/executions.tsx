import React, { useMemo } from 'react';
import DefaultLayout, { Clamp } from '../layout/layout';
import Head from '../components/Head';
import Hero from '../components/Hero';
import { Button, color, Progress } from '@chakra-ui/react';
import { fetchLatestExecutions } from '../api';
import { useQuery } from 'react-query';
import { ExecutionDetailDto } from '../api';
import DataTable from '../components/DataTable';
import { Column } from 'react-table';
import { ExecutionStatePill } from '../components/ExecutionStatePill';
import { Link } from 'react-router-dom';

export default function Executions() {
    const { data, isLoading } = useQuery('executions', fetchLatestExecutions);

    return (
        <DefaultLayout>
            <Head>
                <title>Executions</title>
            </Head>

            <Hero>
                <Hero.Title>Executions</Hero.Title>
                <Hero.Summary>You can monitor the recent executions here.</Hero.Summary>
            </Hero>

            <Clamp>
                {isLoading && <Progress size="xs" isIndeterminate />}
                {data && <ExecutionsList data={data} />}
            </Clamp>
        </DefaultLayout>
    );
}

const ExecutionsList: React.FC<{ data: ExecutionDetailDto[] }> = ({ data }) => {
    const columns = useMemo(
        () =>
            [
                { Header: 'Date', accessor: 'createdAt' },
                {
                    Header: 'Cronjob',
                    accessor: 'cronjob.title',
                    Cell: ({ value, row }) => (
                        <Link
                            to={{
                                pathname: `/cronjobs/${(row.original as ExecutionDetailDto).cronjob.id}`,
                                state: {
                                    title: (row.original as ExecutionDetailDto).cronjob.title,
                                },
                            }}
                        >
                            {value}
                        </Link>
                    ),
                },
                {
                    Header: 'Project',
                    accessor: 'cronjob.projectTitle',
                    Cell: ({ value, row }) => (
                        <Link
                            to={{
                                pathname: `/projects/${(row.original as ExecutionDetailDto).cronjob.projectId}`,
                                state: {
                                    title: (row.original as ExecutionDetailDto).cronjob.projectTitle,
                                },
                            }}
                        >
                            {value}
                        </Link>
                    ),
                },
                { Header: 'State', accessor: 'state', Cell: ({ value }) => <ExecutionStatePill state={value} /> },
            ] as Column<ExecutionDetailDto>[],
        []
    );
    return <DataTable data={data} columns={columns} />;
};
