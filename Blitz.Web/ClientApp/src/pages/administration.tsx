import { Button } from '@chakra-ui/button';
import { useDisclosure } from '@chakra-ui/hooks';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalOverlay } from '@chakra-ui/modal';
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
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
    UseDisclosureReturn,
} from '@chakra-ui/react';
import React, { PropsWithChildren, useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { Column, Row } from 'react-table';
import { ConfigTemplateCreateDto, ConfigTemplateDto, createTemplate, deleteTemplate, fetchTemplates } from '../api';
import DataTable from '../components/DataTable';
import Head from '../components/Head';
import Hero from '../components/Hero';
import { QueryProgress } from '../components/QueryProgress';
import DefaultLayout, { Clamp } from '../layout/layout';

export default function Administration() {
    // useRequireAuth('pm');

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
        <DefaultLayout>
            <Head>
                <title>Administration</title>
            </Head>

            <Hero showBackground={false}>
                <Hero.Title>Templates</Hero.Title>
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
                    {newTemplateDialog.isOpen && <NewTemplateDialog
                        isOpen={newTemplateDialog.isOpen}
                        onSubmit={onSubmit}
                        onClose={newTemplateDialog.onClose}
                    />}
                </Stack>
            </Clamp>
        </DefaultLayout>
    );
}

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
                                    When checked, requests will be authenticated with a bearer token using client credentials grant.
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
