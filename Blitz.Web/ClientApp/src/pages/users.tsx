import { ChevronDownIcon, StarIcon } from '@chakra-ui/icons';
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Badge,
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
    Tag,
    useDisclosure,
    UseDisclosureReturn,
} from '@chakra-ui/react';
import styled from '@emotion/styled';
import React, { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { Column, Row } from 'react-table';
import {
    deleteUser,
    fetchProjects,
    fetchRoles,
    fetchUser,
    fetchUsers,
    RoleUpdateRequest,
    updateUserClaims,
    updateUserRoles,
    UserClaimsUpdateRequest,
    UserListDto,
} from '../api';
import DataTable from '../components/DataTable';
import { QueryProgress } from '../components/QueryProgress';
import Head from '../components/Head';
import Hero from '../components/Hero';
import DefaultLayout, { Clamp } from '../layout/layout';
import { useRequireAuth } from '../lib/useRequireAuth';
import { useAuth } from '../lib/JwtAuthProvider';

export default function Users() {
    useRequireAuth('admin');
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
                    Users registered in <b>blitz</b> are listed here.
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
    const [user, setUser] = useState<UserListDto | null>();
    const claimsPopup = useDisclosure();
    const rolesPopup = useDisclosure();
    const confirmDeleteDialog = useDisclosure();
    const {user: authUser} = useAuth();

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

    const isSelf = (row: Row<UserListDto>) => row.original.id === authUser?.name;

    const columns = useMemo(
        () =>
            [
                {
                    Header: 'Name',
                    accessor: 'name',
                    Cell: ({ value, row }) => (
                        <>
                            {value} {isSelf(row) && <Badge colorScheme="teal">You</Badge>}
                        </>
                    ),
                },
                { Header: 'Identity Provider', accessor: 'idProvider' },
                {
                    Header: 'Roles',
                    accessor: 'roles',
                    Cell: ({ value }) => (
                        <>
                            {value.map((r) => (
                                <Tag key={r.id} rounded="lg" size="sm" mr={2}>
                                    {r.name === 'admin' && <StarIcon color='orange.300' w={2} h={2} mr={1} />}
                                    {r.title || r.name}
                                </Tag>
                            ))}
                        </>
                    ),
                },
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
                                        {!isSelf(row) && (
                                            <MenuItem onClick={() => openDeletePopup(user)}>Delete</MenuItem>
                                        )}
                                    </MenuList>
                                </Menu>
                            </>
                        );
                    },
                },
            ] as Column<UserListDto>[],
        [user]
    );
    return (
        <>
            <DataTable data={data} columns={columns} />

            {user && <UserClaimsPopup {...claimsPopup} user={user} />}

            {user && <UserRolesPopup {...rolesPopup} user={user} />}

            {user && <UserDeleteDialog {...confirmDeleteDialog} user={user} />}
        </>
    );
};

const UserClaimsPopup: React.FC<{ user: UserListDto } & UseDisclosureReturn> = (props) => {
    const { user } = props;

    const userQuery = useQuery(['users', user.id], () => fetchUser(user.id), {
        // refetchOnMount: true,
        placeholderData: user,
    });
    const projectsQuery = useQuery('projects', fetchProjects);
    const queryClient = useQueryClient();

    const userClaims = userQuery.data?.claims.filter((c) => c.claimType === 'Project').map((c) => c.claimValue);
    const form = useForm<UserClaimsUpdateRequest>();

    const mutation = useMutation((req: UserClaimsUpdateRequest) => updateUserClaims(user.id, req), {
        onSettled: () => {
            queryClient.invalidateQueries('users');
            queryClient.invalidateQueries(['users', user.id]);
        },
        onSuccess: () => props.onClose(),
    });

    const onSubmit = async (data: UserClaimsUpdateRequest) => {
        await mutation.mutateAsync(data);
    };

    return (
        <Modal isOpen={props.isOpen} onClose={props.onClose} size="xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Update claims for {user.name}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <form onSubmit={form.handleSubmit(onSubmit)} id="userclaimsForm">
                        <QueryProgress query={projectsQuery} />
                        <ChoiceGrid>
                            {projectsQuery.data &&
                                projectsQuery.data.map((p) => {
                                    const checked = userClaims?.includes(p.id);
                                    return (
                                        <li key={p.id}>
                                            <Checkbox
                                                defaultChecked={checked}
                                                name="projectIds"
                                                ref={form.register}
                                                value={p.id}
                                            >
                                                {p.title}
                                            </Checkbox>
                                        </li>
                                    );
                                })}
                        </ChoiceGrid>
                    </form>
                </ModalBody>

                <ModalFooter>
                    <Button
                        colorScheme="blue"
                        mr={3}
                        form="userclaimsForm"
                        isLoading={mutation.isLoading}
                        type="submit"
                    >
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

const ChoiceGrid = styled.ol`
    list-style: none;
    margin: 1rem 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
    grid-gap: 1rem 2rem;
`;

const UserRolesPopup: React.FC<{ user: UserListDto } & UseDisclosureReturn> = (props) => {
    const { user } = props;
    const queryClient = useQueryClient();

    const rolesQuery = useQuery(['users', 'roles'], fetchRoles);
    const userQuery = useQuery(['users', user.id], () => fetchUser(user.id), {
        // refetchOnMount: true,
        // refetchOnWindowFocus: true,
        // optimisticResults: false,
        placeholderData: user,
    });
    const mutation = useMutation((req: RoleUpdateRequest) => updateUserRoles(user.id, req), {
        onSettled: () => {
            queryClient.invalidateQueries('users', { exact: true });
            queryClient.invalidateQueries(['users', user.id]);
        },
        onSuccess: () => props.onClose(),
    });

    const form = useForm<RoleUpdateRequest>();

    const onSubmit = async (data: RoleUpdateRequest) => {
        await mutation.mutateAsync(data);
    };

    const roleNames = userQuery.data?.roles.map((r) => r.name);

    return (
        <Modal {...props}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Update roles for {user.name}</ModalHeader>
                <ModalCloseButton />

                <ModalBody>
                    <QueryProgress query={rolesQuery} />
                    <form onSubmit={form.handleSubmit(onSubmit)} id="userRolesForm">
                        {rolesQuery.data && (
                            <ChoiceGrid>
                                {rolesQuery.data.map((r) => {
                                    const checked = roleNames?.includes(r.name);

                                    return (
                                        <Checkbox
                                            ref={form.register}
                                            defaultChecked={checked}
                                            name="roleNames"
                                            value={r.name}
                                            key={r.id}
                                        >
                                            {r.title || r.name}
                                        </Checkbox>
                                    );
                                })}
                            </ChoiceGrid>
                        )}
                    </form>
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme="blue" mr={3} form="userRolesForm" type="submit" isLoading={mutation.isLoading}>
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

const UserDeleteDialog: React.FC<{ user: UserListDto } & UseDisclosureReturn> = (props) => {
    const { user } = props;
    const cancelRef = useRef();
    const queryClient = useQueryClient();
    const mutation = useMutation(() => deleteUser(user.id), {
        onSuccess: () => {
            queryClient.invalidateQueries('users', { exact: true });
        },
    });

    const onDeleteUser = async () => {
        await mutation.mutateAsync();
        props.onClose();
    };

    return (
        <AlertDialog isOpen={props.isOpen} leastDestructiveRef={cancelRef as any} onClose={props.onClose}>
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                        Delete User
                    </AlertDialogHeader>

                    <AlertDialogBody>
                        <b>{user.name}</b> will be deleted. <br />
                        Are you sure? You can't undo this action afterwards.
                    </AlertDialogBody>

                    <AlertDialogFooter>
                        <Button ref={cancelRef as any} onClick={props.onClose}>
                            Cancel
                        </Button>
                        <Button colorScheme="red" onClick={onDeleteUser} ml={3} isLoading={mutation.isLoading}>
                            Delete
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
};
