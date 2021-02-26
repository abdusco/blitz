import React, { useMemo, useRef, useState } from 'react';
import DefaultLayout, { Clamp } from '../layout/layout';
import Head from '../components/Head';
import Hero from '../components/Hero';
import { useQuery, useQueryClient } from 'react-query';
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Button,
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
import { fetchUserGrants, UserOverview } from '../api';
import DataTable from '../components/DataTable';
import { Column } from 'react-table';
import { fetchUsers } from '../api';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { Debug } from '../components/Debug';
import { QueryProgress } from '../components/feedback';

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

const UsersList: React.FC<{ data: UserOverview[] }> = ({ data }) => {
    const [userId, setUserId] = useState<string | undefined>();
    const permissionsPopup = useDisclosure();
    const rolesPopup = useDisclosure();
    const confirmDeleteDialog = useDisclosure();

    const openRolesPopup = (id: string) => {
        setUserId(id);
        rolesPopup.onOpen();
    };

    const openPermissionsPopup = (id: string) => {
        setUserId(id);
        permissionsPopup.onOpen();
    };

    const openDeletePopup = (id: string) => {
        setUserId(id);
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
                        const userId = row.original.id;
                        return (
                            <>
                                <Menu>
                                    <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                                        Actions
                                    </MenuButton>
                                    <MenuList>
                                        <MenuItem onClick={() => openRolesPopup(userId)}>Update roles</MenuItem>
                                        <MenuItem onClick={() => openPermissionsPopup(userId)}>
                                            Update permissions
                                        </MenuItem>
                                        <Divider />
                                        <MenuItem onClick={() => openDeletePopup(userId)}>Delete</MenuItem>
                                    </MenuList>
                                </Menu>
                            </>
                        );
                    },
                },
            ] as Column<UserOverview>[],
        []
    );
    return (
        <>
            <DataTable data={data} columns={columns} />

            <Modal isOpen={permissionsPopup.isOpen} onClose={permissionsPopup.onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Modal Title</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>Lorem ipsum dolor sit amet consectetur adipisicing elit. Earum, impedit.</ModalBody>

                    <ModalFooter>
                        <Button colorScheme="blue" mr={3} onClick={permissionsPopup.onClose}>
                            Save
                        </Button>
                        <Button variant="ghost">Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {permissionsPopup.isOpen && userId && <UserPermissionsPopup {...permissionsPopup} userId={userId} />}

            {rolesPopup.isOpen && userId && <UserRolesPopup {...rolesPopup} userId={userId} />}

            {confirmDeleteDialog.isOpen && userId && <UserDeleteDialog {...confirmDeleteDialog} userId={userId} />}
        </>
    );
};

const UserPermissionsPopup: React.FC<{ userId: string } & UseDisclosureReturn> = (props) => {
    const { userId } = props;
    const grantsQuery = useQuery(['users', userId, 'grants'], () => fetchUserGrants(userId));
    // const mutation = useMutation((req) => updateUserGrants(userId, ), {onSettled: () => queryClient.invalidateQueries()})

    return (
        <Modal isOpen={props.isOpen} onClose={props.onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Update permissions for </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <QueryProgress query={grantsQuery}>
                        {userId}
                        <Debug value={grantsQuery.data} />
                    </QueryProgress>
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme="blue" mr={3} onClick={props.onClose}>
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

const UserRolesPopup: React.FC<{ userId: string } & UseDisclosureReturn> = (props) => {
    const { userId, isOpen, onClose } = props;
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Update roles for</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    {userId}
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
