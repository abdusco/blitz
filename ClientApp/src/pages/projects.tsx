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
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { Column } from 'react-table';
import { fetchProjects } from '../api';
import { ApiError, ProjectListDto } from '../api';
import { useTranslateApiError } from '../api/utils';
import DataTable from '../components/DataTable';
import { QueryProgress } from '../components/feedback';
import Head from '../components/Head';
import Hero from '../components/Hero';
import DefaultLayout, { Clamp } from '../layout/layout';

export default function Projects() {
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <DefaultLayout>
            <Head>
                <title>Projects</title>
            </Head>

            <Hero>
                <Hero.Title>Projects</Hero.Title>
                <Hero.Summary>
                    Cronjobs are filed under a project. You need to have a project before creating a cronjob.
                </Hero.Summary>
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
    return (
        <Modal isOpen={props.isOpen} onClose={props.onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Create a new project</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <FormControl>
                        <FormLabel>Title</FormLabel>
                        <Input placeholder="project title" />
                    </FormControl>
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme="blue" onClick={props.onClose} mr={3}>
                        Save
                    </Button>
                    <Button onClick={props.onClose}>Cancel</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

const ProjectList: React.FC = () => {
    const query = useQuery<ProjectListDto[], ApiError>('projects', fetchProjects);
    const { data, error } = query;

    const columns = React.useMemo(
        () =>
            [
                {
                    Header: 'Title',
                    accessor: 'title',
                    Cell: ({ row, value }) => (
                        <Link to={{ pathname: `/projects/${(row as any).original.id}`, state: { title: value } }}>
                            {value}
                        </Link>
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
