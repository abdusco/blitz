import React, { useMemo, useRef, useState } from 'react';
import DefaultLayout, { Clamp } from '../layout/layout';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Button,
    Checkbox,
    Divider,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Progress,
    useDisclosure,
    UseDisclosureReturn,
} from '@chakra-ui/react';
import { fetchProjects, fetchRoles, fetchUserClaims, fetchUserRoles, updateUserClaims, UserClaimsUpdateRequest, UserListDto, UserOverview } from '../api';
import DataTable from '../components/DataTable';
import { Column } from 'react-table';
import { fetchUsers } from '../api';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { QueryProgress } from '../components/feedback';
import { useUserProfile } from '../lib/auth';
import { useForm } from 'react-hook-form';
import Head from '../components/head';
import Hero from '../components/hero';

export default function Users() {
    // useCheckAuth()
    const query = useQuery('users', fetchUsers);
    const { data, isLoading } = query;

    return (
        <DefaultLayout>
            <Head>
                <title>Users</title>
            </Head>
            <Hero>
                <Hero.Title>Users</Hero.Title>
                <Hero.Summary>
                    Users registered in <b>blitz</b> is listed here.
                </Hero.Summary>
            </Hero>

            <Clamp>
                <QueryProgress query={query} />
                {data && <UsersList data={data} />}
            </Clamp>
        </DefaultLayout>
    );
}

const UsersList: React.FC<{ data: UserListDto[] }> = ({ data }) => {
    const [user, setUser] = useState<UserListDto | undefined>();
    const claimsPopup = useDisclosure();
    const rolesPopup = useDisclosure();
    const confirmDeleteDialog = useDisclosure();
    const authUser = useUserProfile();

    const openRolesPopup = (user: UserListDto) => {
        setUser(user);
        rolesPopup.onOpen();
    };

    const openClaimsPopup = (user: UserListDto) => {
        setUser(user);
        claimsPopup.onOpen();
    };

    const openDeletePopup = (user: UserListDto) => {
        setUser(user);
        confirmDeleteDialog.onOpen();
    };

    const columns = useMemo(
        () =>
            [
                { Header: 'Name', accessor: 'name' },
                {
                    Header: '',
                    id: 'actions',
                    props: {
                        isNumeric: true,
                    },
                    Cell: ({ row }) => {
                        const user = row.original as UserListDto;
                        return (
                            <>
                                <Menu>
                                    <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                                        Actions
                                    </MenuButton>
                                    <MenuList>
                                        <MenuItem onClick={() => openRolesPopup(user)}>Update roles</MenuItem>
                                        <MenuItem onClick={() => openClaimsPopup(user)}>Update claims</MenuItem>
                                        <Divider />
                                        <MenuItem onClick={() => openDeletePopup(user)}>Delete</MenuItem>
                                    </MenuList>
                                </Menu>
                            </>
                        );
                    },
                },
            ] as Column<UserListDto>[],
        []
    );
    return (
        <>
            <DataTable data={data} columns={columns} />

            {user && <UserClaimsPopup {...claimsPopup} user={user} />}

            {/* {rolesPopup.isOpen && user && <UserRolesPopup {...rolesPopup} user={user} />} */}

            {/* {confirmDeleteDialog.isOpen && user && <UserDeleteDialog {...confirmDeleteDialog} user={user} />} */}
        </>
    );
};

const UserClaimsPopup: React.FC<{ user: UserListDto } & UseDisclosureReturn> = (props) => {
    const { user } = props;
    const claimsQuery = useQuery(['users', user.id, 'claims'], () => fetchUserClaims(user.id));
    const projectsQuery = useQuery('projects', fetchProjects);
    const queryClient = useQueryClient();
    const mutation = useMutation((req: UserClaimsUpdateRequest) => updateUserClaims(user.id, req), { onSettled: () => queryClient.invalidateQueries('users') });
    const form = useForm();

    const onSubmit = async (data) => {
        console.log(data);
        // await mutation.mutateAsync(data);
    }

    return (
        <Modal isOpen={props.isOpen} onClose={props.onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Update claims for </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <form onSubmit={form.handleSubmit(onSubmit)} id='userclaimsForm'>
                        <QueryProgress query={projectsQuery} />
                        {projectsQuery.data && (
                            projectsQuery.data.map(p => <Checkbox name='projects' ref={form.register} value={p.id} key={p.id}>{p.title}</Checkbox>)
                        )}
                        {projectsQuery.data && (
                            projectsQuery.data.map(p => <Checkbox name='projects' ref={form.register} value={p.id} key={p.id}>{p.title}</Checkbox>)
                        )}
                    </form>
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme="blue" mr={3} form='userclaimsForm' isLoading={mutation.isLoading} type='submit'>
                        Save
                    </Button>
                    <Button variant="ghost" onClick={props.onClose}>
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

const UserRolesPopup: React.FC<{ user: UserListDto } & UseDisclosureReturn> = (props) => {
    const { user, isOpen, onClose } = props;
    const query = useQuery(['users', 'roles'], fetchRoles);

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Update roles for</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    {user.id}
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Earum, impedit.
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme="blue" mr={3} onClick={onClose}>
                        Save
                    </Button>
                    <Button variant="ghost">Close</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

const UserDeleteDialog: React.FC<{ userId: string } & UseDisclosureReturn> = (props) => {
    const { userId } = props;
    const cancelRef = useRef();
    return (
        <AlertDialog isOpen={props.isOpen} leastDestructiveRef={cancelRef as any} onClose={props.onClose}>
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                        Delete Customer
                    </AlertDialogHeader>

                    <AlertDialogBody>
                        {userId}
                        Are you sure? You can't undo this action afterwards.
                    </AlertDialogBody>

                    <AlertDialogFooter>
                        <Button ref={cancelRef as any} onClick={props.onClose}>
                            Cancel
                        </Button>
                        <Button colorScheme="red" onClick={props.onClose} ml={3}>
                            Delete
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
};
