import { Tooltip } from '@chakra-ui/tooltip';
import styled from '@emotion/styled';
import { AxiosError } from 'axios';
import React from 'react';
import { useQuery } from 'react-query';
import { Column } from 'react-table';
import { CronjobListDto, fetchCronjobs, useTranslateApiError } from '../api';
import { CronjobEnabledSwitch } from '../components/CronjobEnabledSwitch';
import { CronPopup } from '../components/CronPopup';
import DataTable from '../components/DataTable';
import Head from '../components/Head';
import Hero from '../components/Hero';
import LinkWithState from '../components/LinkWithState';
import { QueryProgress } from '../components/QueryProgress';
import DefaultLayout, { Clamp } from '../layout/layout';
import { useRequireAuth } from '../lib/useRequireAuth';

export default function Cronjobs() {
    useRequireAuth('pm');

    return (
        <DefaultLayout>
            <Head>
                <title>Cronjobs</title>
            </Head>

            <Hero>
                <Hero.Title>Cronjobs</Hero.Title>
                <Hero.Summary>
                    Cronjob is a scheduled task that sends a request to an URL.
                    <br />
                    Go to a project to create a new cronjob.
                </Hero.Summary>
            </Hero>

            <CronjobList />
        </DefaultLayout>
    );
}

const CronjobList: React.FC = () => {
    const query = useQuery<CronjobListDto[], AxiosError>('cronjobs', fetchCronjobs);
    const translateError = useTranslateApiError();

    const columns = React.useMemo(
        () =>
            [
                {
                    Header: 'Title',
                    accessor: 'title',
                    Cell: ({ row, value }) => (
                        <LinkWithState
                            isEmphasized={true}
                            pathname={`/cronjobs/${(row as any).original.id}`}
                            state={{ ...row.original }}
                        >
                            {value}
                        </LinkWithState>
                    ),
                },
                {
                    Header: 'Project',
                    accessor: 'projectTitle',
                    Cell: ({ row, value }) => (
                        <LinkWithState
                            pathname={`/projects/${(row as any).original.projectId}`}
                            state={{ title: value }}
                        >
                            {value}
                        </LinkWithState>
                    ),
                },
                {
                    Header: 'Schedule',
                    accessor: 'cron',
                    Cell: ({ value }) => (
                        <CronPopup cron={value} placement="right">
                            <NoWrap>{value}</NoWrap>
                        </CronPopup>
                    ),
                },
                {
                    Header: 'Action',
                    accessor: 'url',
                    Cell: ({ value: url, row }) => (
                        <CronjobAction>
                            <b>{row.original.httpMethod}</b>{' '}
                            <Tooltip color="black.400" backgroundColor="gray.50" label={<NoWrap>{url}</NoWrap>}>
                                {url}
                            </Tooltip>
                        </CronjobAction>
                    ),
                },
                {
                    Header: 'Enabled',
                    accessor: 'enabled',
                    Cell: ({ value, row }) => (
                        <CronjobEnabledSwitch enabled={value} id={row.original.id} projectId={row.original.projectId} />
                    ),
                },
            ] as Column<CronjobListDto>[],
        []
    );

    return (
        <Clamp>
            {query.error && translateError(query.error, 'list cronjobs')}
            <QueryProgress query={query} />
            {!query.isPlaceholderData && query.data && <DataTable columns={columns} data={query.data} />}
        </Clamp>
    );
};

const CronjobAction = styled.code`
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 25rem;
    overflow: hidden;
    display: inline-block;
`;

const NoWrap = styled.code`
    white-space: nowrap;
`;
