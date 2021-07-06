import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
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
    Radio,
    RadioGroup,
    Select,
    Spacer,
    Stack,
    useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';
import React, { ChangeEvent, PropsWithChildren, useCallback, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useHistory, useLocation, useRouteMatch } from 'react-router-dom';
import { Column } from 'react-table';
import {
    createCronjob,
    CronjobCreateDto,
    CronJobOverviewDto,
    deleteProject,
    fetchProject,
    fetchTemplates,
    ProjectDetailsDto,
    ProjectUpdateDto,
    TokenAuthCreateDto,
    updateProjectDetails,
} from '../api';
import { CronjobEnabledSwitch } from '../components/CronjobEnabledSwitch';
import { CronPopup } from '../components/CronPopup';
import DataTable from '../components/DataTable';
import Head from '../components/Head';
import Hero from '../components/Hero';
import LinkWithState from '../components/LinkWithState';
import { QueryProgress } from '../components/QueryProgress';
import TokenAuthForm from '../components/TokenAuthForm';
import DefaultLayout, { Clamp } from '../layout/layout';
import { useRequireAuth } from '../lib/useRequireAuth';
import { useRequireProjectClaim } from '../lib/useRequireProjectClaim';

export default function Project() {
    useRequireAuth('pm');
    const location = useLocation();
    const history = useHistory();

    const {
        params: { id },
    } = useRouteMatch<{ id: string }>();
    const { state: { title = 'Project' } = {} } = location;

    useRequireProjectClaim(id);

    const placeholderData: ProjectDetailsDto = {
        id,
        title,
        cronjobs: [],
    };
    const query = useQuery(['projects', id], () => fetchProject(id), { placeholderData });

    const newCronjobDialog = useDisclosure();
    const projectEditDialog = useDisclosure();
    const deleteProjectDialog = useDisclosure();

    const queryClient = useQueryClient();
    const deleteMutation = useMutation(() => deleteProject(id), {
        onSuccess: () => {
            queryClient.invalidateQueries(['projects'], { exact: true });
            history.push('/projects');
        },
    });

    const cancelRef = useRef<any>();

    return (
        <DefaultLayout>
            <Head>
                <title>{query.data?.title}</title>
            </Head>

            <Hero>
                <Hero.Title>{query.data?.title}</Hero.Title>
                <Hero.Body>
                    <HStack spacing="2">
                        <Button colorScheme="blue" onClick={newCronjobDialog.onOpen}>
                            New Cronjob
                        </Button>
                        <Button onClick={projectEditDialog.onOpen}>Edit</Button>
                        <Spacer />
                        <Button colorScheme="red" onClick={deleteProjectDialog.onOpen}>
                            Delete
                        </Button>
                    </HStack>
                </Hero.Body>
            </Hero>

            <Clamp>
                {!query.isPlaceholderData && query.data && (
                    <CreateCronjobDialog
                        projectId={id}
                        isOpen={newCronjobDialog.isOpen}
                        onClose={newCronjobDialog.onClose}
                    />
                )}

                {!query.isPlaceholderData && query.data && projectEditDialog.isOpen && (
                    <ProjectEditDialog
                        project={query.data}
                        isOpen={projectEditDialog.isOpen}
                        onClose={projectEditDialog.onClose}
                    />
                )}

                <QueryProgress query={query} />
                {!query.isPlaceholderData && query.data && <ProjectDetail project={query.data} />}
                {!query.isPlaceholderData && query.data && <CronjobList data={query.data} />}
                {query.data && deleteProjectDialog.isOpen && (
                    <AlertDialog
                        isOpen={deleteProjectDialog.isOpen}
                        leastDestructiveRef={cancelRef}
                        onClose={deleteProjectDialog.onClose}
                    >
                        <AlertDialogOverlay>
                            <AlertDialogContent>
                                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                                    Delete {query.data?.title}
                                </AlertDialogHeader>

                                <AlertDialogBody>Are you sure? You can't undo this action afterwards.</AlertDialogBody>

                                <AlertDialogFooter>
                                    <Button ref={cancelRef} onClick={deleteProjectDialog.onClose}>
                                        Cancel
                                    </Button>
                                    <Button colorScheme="red" onClick={() => deleteMutation.mutateAsync()} ml={3}>
                                        Delete
                                    </Button>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialogOverlay>
                    </AlertDialog>
                )}
            </Clamp>
        </DefaultLayout>
    );
}

function ProjectEditDialog(
    props: PropsWithChildren<{
        project: ProjectDetailsDto;
        isOpen: boolean;
        onClose: () => void;
    }>
) {
    const queryClient = useQueryClient();
    console.log('props', props.project);

    const form = useForm<ProjectUpdateDto>({ defaultValues: props.project });
    const [isAuthenticated, setIsAuthenticated] = useState(!!props.project.auth);

    const { isDirty, isValid } = form.formState;

    const editMutation = useMutation(async (data: ProjectUpdateDto) => updateProjectDetails(props.project.id, data), {
        onSuccess: () => queryClient.invalidateQueries(['projects', props.project.id], { exact: true }),
    });
    const onSubmit = async (data: ProjectUpdateDto) => {
        await editMutation.mutateAsync(data);
        props.onClose();
    };

    const templatesQuery = useQuery(['templates'], fetchTemplates);

    const onTemplateSelected = useCallback(
        (e: ChangeEvent<HTMLSelectElement>) => {
            const selectedId = e.target.value;
            if (!selectedId) {
                return;
            }

            const template = templatesQuery.data?.find((it) => it.id == selectedId);
            if (!template) {
                return;
            }
            form.setValue('auth', template.auth);
        },
        [form, templatesQuery]
    );

    return (
        <Modal isOpen={props.isOpen} onClose={props.onClose} size="3xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Editing {props.project.title}</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <Stack spacing={4}>
                        <FormControl id="authentication">
                            <FormLabel>Authentication</FormLabel>
                            <Checkbox
                                defaultIsChecked
                                isChecked={isAuthenticated}
                                onChange={(e) => setIsAuthenticated(e.target.checked)}
                            >
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
                                <form onSubmit={form.handleSubmit(onSubmit)} id="projectEditForm">
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
                                                An endpoint that issues tokens for <code>client_credentials</code> grant
                                                requests
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
                                </form>
                            </>
                        )}
                    </Stack>
                </ModalBody>
                <ModalFooter>
                    <Button
                        disabled={!isValid}
                        colorScheme="blue"
                        isLoading={editMutation.isLoading}
                        type="submit"
                        form="projectEditForm"
                    >
                        Save
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

export const CreateCronjobForm: React.FC<{
    projectId: string;
    onSubmit: (data: CronjobCreateDto) => Promise<void> | void;
    defaultValues?: Partial<CronjobCreateDto>;
    formProps?: any;
}> = (props) => {
    const form = useForm<CronjobCreateDto>({
        defaultValues: props.defaultValues ?? {
            httpMethod: 'POST',
        },
    });
    const currentCron = form.watch('cron');
    return (
        <form {...props.formProps} onSubmit={form.handleSubmit(props.onSubmit)}>
            <Stack spacing={4}>
                <input type="hidden" ref={form.register} name="projectId" value={props.projectId} />
                <FormControl isRequired>
                    <FormLabel>Title</FormLabel>
                    <Input placeholder="e.g. warm up cache" name="title" ref={form.register} required />
                    <FormHelperText>A name for this cronjob</FormHelperText>
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>URL</FormLabel>
                    <Input
                        placeholder="https://url.to.api/-/cronjobs/warmupcache"
                        name="url"
                        type="url"
                        ref={form.register}
                        required
                    />
                    <FormHelperText>URL to be sent request to</FormHelperText>
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Schedule</FormLabel>
                    <CronPopup cron={currentCron} placement="right" isOpen={!!currentCron}>
                        <Input
                            placeholder="* * * * *"
                            name="cron"
                            type="text"
                            pattern="(\S+ ?){5}"
                            ref={form.register}
                            required
                            autoComplete="off"
                        />
                    </CronPopup>
                    <FormHelperText>A cronjob expression: {currentCron}.</FormHelperText>
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>HTTP Method</FormLabel>
                    <RadioGroup defaultValue="POST">
                        <Stack direction="row">
                            <Radio name="httpMethod" ref={form.register} value="POST">
                                POST
                            </Radio>
                            <Radio name="httpMethod" ref={form.register} value="GET">
                                GET
                            </Radio>
                        </Stack>
                    </RadioGroup>
                </FormControl>
            </Stack>
        </form>
    );
};

export const CreateCronjobDialog: React.FC<{
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
    // onSubmit: (input: CronjobCreateDto) => Promise<void>;
}> = (props) => {
    const queryClient = useQueryClient();
    const history = useHistory();
    const mutation = useMutation((payload: CronjobCreateDto) => createCronjob(payload), {
        onSuccess(data) {
            queryClient.invalidateQueries('cronjobs', { exact: true });
            queryClient.invalidateQueries(['projects', data.projectId]);
            history.push(`/cronjobs/${data.id}`, data);
            props.onClose();
        },
    });
    const onSubmit = async (form: CronjobCreateDto) => {
        await mutation.mutateAsync(form);
    };

    return (
        <Modal isOpen={props.isOpen} onClose={props.onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Create a new cronjob</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <CreateCronjobForm
                        projectId={props.projectId}
                        onSubmit={onSubmit}
                        formProps={{ id: 'createCronjob' }}
                    />
                </ModalBody>
                <ModalFooter>
                    <Button
                        colorScheme="blue"
                        form={'createCronjob'}
                        type={'submit'}
                        isLoading={mutation.isLoading}
                        mr={3}
                    >
                        Save
                    </Button>
                    <Button onClick={props.onClose}>Cancel</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

const ProjectDetail: React.FC<{ project: ProjectDetailsDto }> = ({}) => {
    return <div></div>;
};

const CronjobList: React.FC<{ data: ProjectDetailsDto }> = ({ data }) => {
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
                        <CronPopup cron={value}>
                            <code>{value}</code>
                        </CronPopup>
                    ),
                },
                {
                    Header: 'Enabled',
                    accessor: 'enabled',
                    Cell: ({ value, row }) => (
                        <CronjobEnabledSwitch enabled={value} id={(row.original as any).id} projectId={data.id} />
                    ),
                },
            ] as Column<CronJobOverviewDto>[],
        []
    );

    return <DataTable columns={columns} data={data.cronjobs} />;
};
