import {
    Button,
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
    Stack,
    useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useHistory, useLocation, useRouteMatch } from 'react-router-dom';
import { Column } from 'react-table';
import {
    createCronjob,
    CronjobCreateDto,
    CronJobOverviewDto,
    fetchProject,
    ProjectDetailsDto,
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

    return (
        <DefaultLayout>
            <Head>
                <title>{query.data?.title}</title>
            </Head>

            <Hero>
                <Hero.Title>{query.data?.title}</Hero.Title>
                <Hero.Body>
                    <HStack spacing="2">
                        <Button colorScheme='blue' onClick={newCronjobDialog.onOpen}>New Cronjob</Button>
                        <Button onClick={projectEditDialog.onOpen}>Edit</Button>
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

                {!query.isPlaceholderData && query.data && (
                    <ProjectEditDialog
                        project={query.data}
                        isOpen={projectEditDialog.isOpen}
                        onClose={projectEditDialog.onClose}
                    />
                )}

                <QueryProgress query={query} />
                {!query.isPlaceholderData && query.data && <ProjectDetail project={query.data} />}
                {!query.isPlaceholderData && query.data && <CronjobList data={query.data} />}
            </Clamp>
        </DefaultLayout>
    );
}

const ProjectEditDialog: React.FC<{
    project: ProjectDetailsDto;
    isOpen: boolean;
    onClose: () => void;
}> = (props) => {
    const queryClient = useQueryClient();

    const mutation = useMutation(
        async (data: TokenAuthCreateDto) => updateProjectDetails(props.project.id, { auth: data }),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['projects', props.project.id]);
            },
        }
    );
    const onSubmit = async (data: TokenAuthCreateDto) => {
        await mutation.mutateAsync(data);
        props.onClose();
    };
    return (
        <Modal isOpen={props.isOpen} onClose={props.onClose} size="3xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Editing {props.project.title}</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <TokenAuthForm onSubmit={onSubmit} defaultValues={props.project.auth || {}} />
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

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
