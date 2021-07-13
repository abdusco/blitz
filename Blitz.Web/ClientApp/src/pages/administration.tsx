import { Button } from '@chakra-ui/button';
import { useDisclosure } from '@chakra-ui/hooks';
import { ChevronDownIcon, StarIcon } from '@chakra-ui/icons';
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalOverlay } from '@chakra-ui/modal';
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Badge,
    Checkbox,
    Divider,
    FormControl,
    FormHelperText,
    FormLabel,
    HStack,
    Input,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    ModalFooter,
    ModalHeader,
    Stack,
    Tag,
    UseDisclosureReturn,
} from '@chakra-ui/react';
import styled from '@emotion/styled';
import React, { PropsWithChildren, useCallback, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { Column, Row } from 'react-table';
import { ConfigTemplateCreateDto, ConfigTemplateDto, createTemplate, deleteTemplate, deleteUser, fetchProjects, fetchRoles, fetchTemplates, fetchUser, fetchUsers, RoleUpdateRequest, updateUserClaims, updateUserRoles, UserClaimsUpdateRequest, UserListDto } from '../api';
import DataTable from '../components/DataTable';
import Head from '../components/Head';
import Hero from '../components/Hero';
import { QueryProgress } from '../components/QueryProgress';
import DefaultLayout, { Clamp } from '../layout/layout';
import { useAuth } from '../lib/auth';

export default function Administration() {
    // useRequireAuth('pm');

    return (
        <DefaultLayout>
            <Head>
                <title>Administration</title>
            </Head>

            <UsersSection />
            <TemplatesSection />
        </DefaultLayout>
    );
}

const TemplatesSection = () => {
    const newTemplateDialog = useDisclosure();

    const templatesQuery = useQuery(['templates'], fetchTemplates, { placeholderData: [] });
    const queryClient = useQueryClient();
    const mutation = useMutation(createTemplate, {
        onSuccess: () => queryClient.invalidateQueries(['templates'], { exact: true }),
    });
    const [activeTemplate, setActiveTemplate] = useState<ConfigTemplateDto | null>(null);

    const onSubmit = async (data: ConfigTemplateCreateDto) => {
        await mutation.mutateAsync(data);
        newTemplateDialog.onClose();
    };
    const deleteDialog = useDisclosure();

    const onDeleteAction = React.useCallback(
        (item: ConfigTemplateDto) => {
            setActiveTemplate(item);
            deleteDialog.onOpen();
        },
        [deleteDialog, setActiveTemplate]
    );

    const columns = useMemo(
        () =>
            [
                { accessor: 'key', Header: 'Key' },
                { accessor: 'title', Header: 'Title' },
                {
                    Header: '',
                    id: 'actions',
                    props: {
                        isNumeric: true,
                    },
                    Cell: ({ row }: { row: Row<ConfigTemplateDto> }) => {
                        return (
                            <>
                                <Menu>
                                    <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                                        Actions
                                    </MenuButton>
                                    <MenuList>
                                        <MenuItem onClick={() => onDeleteAction(row.original)}>
                                            Delete template
                                        </MenuItem>
                                    </MenuList>
                                </Menu>
                            </>
                        );
                    },
                },
            ] as Column<ConfigTemplateDto>[],
        [onDeleteAction]
    );

    const deleteMutation = useMutation(deleteTemplate, {
        onSuccess: () => queryClient.invalidateQueries(['templates'], { exact: true }),
    });
    const onDelete = React.useCallback(async () => {
        if (!activeTemplate?.id) {
            return;
        }
        await deleteMutation.mutateAsync(activeTemplate.id);
        deleteDialog.onClose();
    }, [deleteMutation, activeTemplate]);

    return (
        <>
            <Hero showBackground={false}>
                <Hero.Title>Templates</Hero.Title>
                <Hero.Summary>Use configuration templates to simplify cronjob configurations.</Hero.Summary>
            </Hero>
            <Clamp>
                <Stack spacing="4">
                    <QueryProgress query={templatesQuery} />
                    {templatesQuery.data && <DataTable columns={columns} data={templatesQuery.data} />}
                    <DeleteTemplateDialog
                        isOpen={deleteDialog.isOpen}
                        onClose={deleteDialog.onClose}
                        onDelete={onDelete}
                    />
                    <div>
                        <Button onClick={newTemplateDialog.onOpen}>New template</Button>
                    </div>
                    {newTemplateDialog.isOpen && (
                        <NewTemplateDialog
                            isOpen={newTemplateDialog.isOpen}
                            onSubmit={onSubmit}
                            onClose={newTemplateDialog.onClose}
                        />
                    )}
                </Stack>
            </Clamp>
        </>
    );
};

function DeleteTemplateDialog(
    props: PropsWithChildren<{
        isOpen: boolean;
        onClose: () => Promise<void> | void;
        onDelete: () => Promise<void> | void;
    }>
) {
    const cancelRef: any = React.useRef();
    return (
        <>
            <AlertDialog isOpen={props.isOpen} leastDestructiveRef={cancelRef} onClose={props.onClose}>
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Delete template
                        </AlertDialogHeader>

                        <AlertDialogBody>Are you sure? You can't undo this action afterwards.</AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={props.onClose}>
                                Cancel
                            </Button>
                            <Button colorScheme="red" onClick={props.onDelete} ml={3}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </>
    );
}

function NewTemplateDialog(
    props: PropsWithChildren<{
        isOpen: boolean;
        defaultValues?: Partial<ConfigTemplateCreateDto>;
        onSubmit: (data: ConfigTemplateCreateDto) => Promise<void> | void;
        isLoading?: boolean;
        onClose: () => void;
    }>
) {
    const form = useForm<ConfigTemplateCreateDto>({ defaultValues: props.defaultValues });
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const { isDirty, isValid } = form.formState;

    const onCancel = useCallback(() => {
        form.reset({});
        form.clearErrors();
        props.onClose();
    }, [form, props.onClose]);

    return (
        <Modal isOpen={props.isOpen} onClose={onCancel} size="3xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>New template</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <form onSubmit={form.handleSubmit(props.onSubmit)} id="newTemplateForm">
                        <Stack spacing={4}>
                            <HStack spacing={4}>
                                <FormControl id="key" isRequired>
                                    <FormLabel>Key</FormLabel>
                                    <Input name="key" ref={form.register} required type="text" placeholder="default" />
                                    <FormHelperText>A key to identify this template</FormHelperText>
                                </FormControl>

                                <FormControl id="title" isRequired>
                                    <FormLabel>Title</FormLabel>
                                    <Input
                                        name="title"
                                        ref={form.register}
                                        required
                                        type="text"
                                        placeholder="Default template"
                                    />
                                    <FormHelperText>A human-readable title</FormHelperText>
                                </FormControl>
                            </HStack>

                            <FormControl id="template">
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
                                            <Input
                                                name="auth.grantType"
                                                type="text"
                                                readOnly
                                                value="client_credentials"
                                                disabled
                                            />
                                        </FormControl>
                                    </HStack>
                                </>
                            )}
                        </Stack>
                    </form>
                </ModalBody>
                <ModalFooter>
                    <Button
                        disabled={!isDirty || !isValid}
                        colorScheme="blue"
                        isLoading={props.isLoading}
                        mr={4}
                        form="newTemplateForm"
                        type="submit"
                    >
                        Save
                    </Button>
                    <Button onClick={onCancel}>Cancel</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

const UsersSection = () => {
    const query = useQuery('users', fetchUsers);
    const { data } = query;

    return (
        <>
            <Hero showBackground={false}>
                <Hero.Title>Users</Hero.Title>
                <Hero.Summary>
                    Users registered in <b>blitz</b> are listed here.
                </Hero.Summary>
            </Hero>

            <Clamp>
                <QueryProgress query={query} />
                {data && <UsersList data={data} />}
            </Clamp>
        </>
    );
};

const UsersList: React.FC<{ data: UserListDto[] }> = ({ data }) => {
    const [user, setUser] = useState<UserListDto | null>();
    const claimsPopup = useDisclosure();
    const rolesPopup = useDisclosure();
    const confirmDeleteDialog = useDisclosure();
    const { user: authUser } = useAuth();

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
                                    {r.name === 'admin' && <StarIcon color="orange.300" w={2} h={2} mr={1} />}
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
