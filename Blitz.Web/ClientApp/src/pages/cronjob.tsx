import { InfoOutlineIcon, LockIcon, UnlockIcon } from '@chakra-ui/icons';
import {
    Box,
    Button,
    Checkbox,
    FormControl,
    FormHelperText,
    FormLabel,
    HStack,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    Stack,
    Table,
    Tbody,
    Td,
    Th,
    Tr,
    useDisclosure,
    useToast,
} from '@chakra-ui/react';
import React, { ChangeEvent, PropsWithChildren, useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useHistory, useLocation, useRouteMatch } from 'react-router-dom';
import { Column } from 'react-table';
import {
    CronjobDetailDto,
    CronjobExecutionsListDto,
    CronjobUpdateDto,
    fetchCronjob,
    fetchCronjobExecutions,
    fetchTemplates,
    ProjectDetailsDto,
    ProjectUpdateDto,
    TokenAuthCreateDto,
    triggerCronjob,
    updateCronjobDetails,
    updateProjectDetails,
} from '../api';
import { CronjobEnabledSwitch } from '../components/CronjobEnabledSwitch';
import { CronPopup } from '../components/CronPopup';
import DataTable from '../components/DataTable';
import { ExecutionStatePill } from '../components/ExecutionStatePill';
import Head from '../components/Head';
import Hero from '../components/Hero';
import LinkWithState from '../components/LinkWithState';
import { QueryProgress } from '../components/QueryProgress';
import TokenAuthForm from '../components/TokenAuthForm';
import DefaultLayout, { Clamp } from '../layout/layout';
import { formatDateISO } from '../lib/date';
import { useRequireAuth } from '../lib/useRequireAuth';
import { useRequireProjectClaim } from '../lib/useRequireProjectClaim';

const BellIcon = () => (
    <svg style={{ width: '1em', height: '1em' }} viewBox="0 0 24 24">
        <path
            fill="currentColor"
            d="M21,19V20H3V19L5,17V11C5,7.9 7.03,5.17 10,4.29C10,4.19 10,4.1 10,4A2,2 0 0,1 12,2A2,2 0 0,1 14,4C14,4.1 14,4.19 14,4.29C16.97,5.17 19,7.9 19,11V17L21,19M14,21A2,2 0 0,1 12,23A2,2 0 0,1 10,21"
        />
    </svg>
);

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

    const editDialog = useDisclosure();

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
                    <HStack mt="4" spacing="2">
                        <Button colorScheme="blue" isLoading={mutation.isLoading} onClick={() => mutation.mutate()}>
                            Trigger
                        </Button>
                        <Button onClick={editDialog.onOpen}>Edit</Button>
                    </HStack>
                    {!cronjobQuery.isPlaceholderData && cronjobQuery.data && editDialog.isOpen && (
                        <CronjobEditDialog
                            cronjob={cronjobQuery.data}
                            onClose={editDialog.onClose}
                            isOpen={editDialog.isOpen}
                        />
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
                        <Th>Authentication</Th>
                        <Td>{data.isAuthenticated ? <LockIcon color="green.400" /> : <UnlockIcon color="gray" />}</Td>
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

const CronjobEditDialog: React.FC<{
    cronjob: CronjobDetailDto;
    isOpen: boolean;
    onClose: () => void;
}> = (props) => {
    const queryClient = useQueryClient();
    const form = useForm<CronjobUpdateDto>({ defaultValues: { ...props.cronjob, auth: props.cronjob.effectiveAuth } });

    const templatesQuery = useQuery(['templates'], fetchTemplates);

    const editMutation = useMutation(async (data: CronjobUpdateDto) => updateCronjobDetails(props.cronjob.id, data), {
        onSuccess: () => {
            queryClient.invalidateQueries(['cronjobs', props.cronjob.id], { exact: true });
        },
    });
    const onSubmit = async (data: CronjobUpdateDto) => {
        await editMutation.mutateAsync(data);
        props.onClose();
    };

    const onTemplateSelected = useCallback(
        (e: ChangeEvent<HTMLSelectElement>) => {
            const selectedId = e.target.value;
            if (!selectedId) {
                return;
            }
            const template = templatesQuery.data?.find((it) => it.id == selectedId);
            console.log(template);

            if (!template) {
                return;
            }
            form.setValue('auth', template.auth);
        },
        [form, templatesQuery]
    );

    const { isDirty, isValid } = form.formState;

    const isAuthenticated = form.watch('isAuthenticated', props.cronjob.isAuthenticated);

    return (
        <>
            <Modal isOpen={props.isOpen} onClose={props.onClose} size="3xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Editing {props.cronjob.title}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <form onSubmit={form.handleSubmit(onSubmit)} id="cronjobEditForm">
                            <Stack spacing={4}>
                                <FormControl id="authentication">
                                    <FormLabel>Authentication</FormLabel>
                                    <Checkbox ref={form.register} name="isAuthenticated">
                                        Authenticate with token
                                    </Checkbox>
                                    <FormHelperText>
                                        When checked, requests will be authenticated with a bearer token using client
                                        credentials grant.
                                    </FormHelperText>
                                </FormControl>

                                {isAuthenticated && (
                                    <>
                                        {templatesQuery.data && (
                                            <FormControl id="template">
                                                <FormLabel>Fill from a template</FormLabel>
                                                <Select placeholder="Pick a template" onChange={onTemplateSelected}>
                                                    {templatesQuery.data.map((it) => (
                                                        <option key={it.id} value={it.id}>
                                                            {it.title}
                                                        </option>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        )}
                                        <Stack spacing={4}>
                                            <FormControl id="tokenEndpoint" isRequired>
                                                <FormLabel>Token Endpoint</FormLabel>
                                                <Input
                                                    name="auth.tokenEndpoint"
                                                    ref={form.register}
                                                    required
                                                    type="url"
                                                    placeholder="https://id.server/connect/token"
                                                />
                                                <FormHelperText>
                                                    An endpoint that issues tokens for <code>client_credentials</code>{' '}
                                                    grant requests
                                                </FormHelperText>
                                            </FormControl>
                                            <HStack spacing={2}>
                                                <FormControl id="clientId" isRequired>
                                                    <FormLabel>Client ID</FormLabel>
                                                    <Input
                                                        name="auth.clientId"
                                                        ref={form.register}
                                                        required
                                                        type="text"
                                                        placeholder="my_server_client"
                                                    />
                                                </FormControl>
                                                <FormControl id="clientSecret" isRequired>
                                                    <FormLabel>Client Secret</FormLabel>
                                                    <Input
                                                        name="auth.clientSecret"
                                                        ref={form.register}
                                                        required
                                                        type="text"
                                                        placeholder="12345678-ABCD-WXYZ-1234567890AB"
                                                    />
                                                </FormControl>
                                            </HStack>

                                            <HStack spacing={2} alignItems="flex-start">
                                                <FormControl id="scope">
                                                    <FormLabel>Scopes to request</FormLabel>
                                                    <Input
                                                        name="auth.scope"
                                                        ref={form.register}
                                                        type="text"
                                                        placeholder="scope1 scope2"
                                                    />
                                                </FormControl>
                                                <FormControl id="grantType">
                                                    <FormLabel>Grant Type</FormLabel>
                                                    <Input type="text" readOnly value="client_credentials" disabled />
                                                </FormControl>
                                            </HStack>
                                        </Stack>
                                    </>
                                )}
                            </Stack>
                        </form>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            disabled={!isValid}
                            colorScheme="blue"
                            isLoading={editMutation.isLoading}
                            type="submit"
                            form="cronjobEditForm"
                        >
                            Save
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
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
                            <InfoOutlineIcon /> {formatDateISO(value)}
                        </LinkWithState>
                    ),
                },
                { Header: 'Status', accessor: 'state', Cell: ({ value }) => <ExecutionStatePill state={value} /> },
            ] as Column<CronjobExecutionsListDto>[],
        []
    );

    return <DataTable data={data} columns={columns} />;
};
