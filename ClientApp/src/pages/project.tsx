import {
    Button,
    FormControl,
    FormHelperText,
    FormLabel,
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
import React, { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { Link, useHistory, useLocation, useRouteMatch } from 'react-router-dom';
import { Column } from 'react-table';
import { createCronjob, CronJobOverviewDto, fetchProject, sleep } from '../api';
import { CronjobCreateDto, ProjectDetailsDto } from '../api';
import { CronjobEnabledSwitch } from '../components/CronjobEnabledSwitch';
import DataTable from '../components/DataTable';
import { CronPopup, QueryProgress } from '../components/QueryProgress';
import Head from '../components/Head';
import Hero from '../components/Hero';
import LinkWithState from '../components/LinkWithState';
import DefaultLayout, { Clamp } from '../layout/layout';

export default function Project() {
    const location = useLocation();
    const {
        params: { id },
    } = useRouteMatch<{ id: string }>();
    const { state: { title = 'Project' } = {} } = location;

    const placeholderData: ProjectDetailsDto = {
        id,
        title,
        cronjobs: [],
    };
    const query = useQuery(['projects', id], () => fetchProject(id), { placeholderData });

    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <DefaultLayout>
            <Head>
                <title>{query.data?.title}</title>
            </Head>

            <Hero>
                <Hero.Title>{query.data?.title}</Hero.Title>
                <Hero.Body>
                    <Button onClick={onOpen}>New Cronjob</Button>
                </Hero.Body>
            </Hero>

            <Clamp>
                {query.data && <CreateCronjobDialog projectId={query.data?.id} isOpen={isOpen} onClose={onClose} />}

                <QueryProgress query={query} />
                {!query.isPlaceholderData && query.data && <ProjectDetail project={query.data} />}
                {!query.isPlaceholderData && query.data && <CronjobList data={query.data} />}
            </Clamp>
        </DefaultLayout>
    );
}

export const CreateCronjobDialog: React.FC<{
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
    // onSubmit: (input: CronjobCreateDto) => Promise<void>;
}> = (props) => {
    const form = useForm<CronjobCreateDto>({
        defaultValues: {
            httpMethod: 'POST',
        },
    });
    const queryClient = useQueryClient();
    const history = useHistory();
    const mutation = useMutation((payload: CronjobCreateDto) => createCronjob(payload), {
        onSuccess(data) {
            queryClient.invalidateQueries('cronjobs', { exact: true });
            queryClient.invalidateQueries(['projects', data.projectId]);
            history.push(`/cronjobs/${data.id}`, data);
            props.onClose();
        }
    });
    const onSubmit = async (form: CronjobCreateDto) => {
        await mutation.mutateAsync(form);
    }

    const currentCron = form.watch('cron');
    return (
        <Modal isOpen={props.isOpen} onClose={props.onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Create a new cronjob</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <form onSubmit={form.handleSubmit(onSubmit)} id={'createCronjob'}>
                        <Stack spacing={4}>
                            <input type="hidden" ref={form.register} name='projectId' value={props.projectId} />
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
                </ModalBody>
                <ModalFooter>
                    <Button colorScheme="blue" form={'createCronjob'} type={'submit'} isLoading={mutation.isLoading} mr={3}>
                        Save
                    </Button>
                    <Button onClick={props.onClose}>Cancel</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

const ProjectDetail: React.FC<{ project: ProjectDetailsDto }> = ({ }) => {
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
                        <LinkWithState emphasize pathname={`/cronjobs/${(row as any).original.id}`} state={{ title: value }}>
                            {value}
                        </LinkWithState>
                    ),
                },
                {
                    Header: 'Schedule',
                    accessor: 'cron',
                    Cell: ({ value }) => <code>{value}</code>,
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
