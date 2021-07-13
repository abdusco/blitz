import {
    Button,
    FormControl,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    useDisclosure,
} from '@chakra-ui/react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { Link, useHistory } from 'react-router-dom';
import { Column } from 'react-table';
import { createProject, fetchProjects, ProjectCreateInput } from '../api';
import { ProjectListDto } from '../api';
import DataTable from '../components/DataTable';
import { QueryProgress } from '../components/QueryProgress';
import Head from '../components/Head';
import Hero from '../components/Hero';
import LinkWithState from '../components/LinkWithState';
import DefaultLayout, { Clamp } from '../layout/layout';
import { useRequireAuth } from '../lib/useRequireAuth';

export default function Projects() {
    useRequireAuth('pm');
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <DefaultLayout>
            <Head>
                <title>Projects</title>
            </Head>

            <Hero>
                <Hero.Title>Projects</Hero.Title>
                <Hero.Summary>Cronjobs are filed under a project.</Hero.Summary>
                <Hero.Body>
                    <Button onClick={onOpen}>New Project</Button>
                </Hero.Body>
            </Hero>

            <CreateProjectDialog isOpen={isOpen} onClose={onClose} />
            <ProjectList />
        </DefaultLayout>
    );
}

const CreateProjectDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
}> = (props) => {
    const form = useForm();
    const queryClient = useQueryClient();
    const history = useHistory();
    const mutation = useMutation((data: ProjectCreateInput) => createProject(data), {
        onSuccess: (id: string) => {
            queryClient.invalidateQueries('projects');
            history.push(`/projects/${id}`);
        },
    });

    const onSubmit = async (data: ProjectCreateInput) => {
        await mutation.mutateAsync(data);
    };
    
    const {isValid, isDirty} = form.formState

    return (
        <Modal isOpen={props.isOpen} onClose={props.onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Create a new project</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <form onSubmit={form.handleSubmit(onSubmit)} id="createProjectForm">
                        <FormControl isRequired>
                            <FormLabel>Title</FormLabel>
                            <Input name="title" ref={form.register} placeholder="project title" required />
                        </FormControl>
                    </form>
                </ModalBody>

                <ModalFooter>
                    <Button
                        form="createProjectForm"
                        disabled={isDirty && !isValid}
                        isLoading={mutation.isLoading}
                        colorScheme="blue"
                        type="submit"
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

const ProjectList: React.FC = () => {
    const query = useQuery<ProjectListDto[]>('projects', fetchProjects);
    const { data, error } = query;

    const columns = React.useMemo(
        () =>
            [
                {
                    Header: 'Title',
                    accessor: 'title',
                    Cell: ({ row, value }) => (
                        <LinkWithState
                            isEmphasized={true}
                            pathname={`/projects/${(row as any).original.id}`}
                            state={{ title: value }}
                        >
                            {value}
                        </LinkWithState>
                    ),
                },
                {
                    Header: 'Total Cronjobs',
                    accessor: (row) => row.cronjobsCount,
                    props: {
                        isNumeric: true,
                    },
                },
            ] as Column<ProjectListDto>[],
        []
    );

    return (
        <Clamp>
            <QueryProgress query={query} />
            {data && <DataTable columns={columns} data={data} />}
        </Clamp>
    );
};
