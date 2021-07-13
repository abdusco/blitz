import { Button } from '@chakra-ui/button';
import { Editable, EditableInput, EditablePreview } from '@chakra-ui/editable';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { Input, InputGroup, InputRightElement } from '@chakra-ui/input';
import { Box, Flex, Heading, HStack, Stack } from '@chakra-ui/layout';
import { StatUpArrow } from '@chakra-ui/stat';
import React, { useMemo } from 'react';
import { Column } from 'react-table';
import { CronjobListDto } from '../api';
import DataTable from '../components/DataTable';
import Head from '../components/Head';
import Hero from '../components/Hero';
import DefaultLayout, { Clamp } from '../layout/layout';
import { useRequireAuth } from '../lib/useRequireAuth';

const ConfigForm = () => {
    return (
        <Stack spacing={2}>
            <FormControl id="tokenEndpoint">
                <FormLabel>Token Endpoint</FormLabel>
                <Input type="url" placeholder="https://id.server/connect/token" />
            </FormControl>
            <HStack spacing={2}>
                <FormControl id="clientId">
                    <FormLabel>Client ID</FormLabel>
                    <Input type="text" placeholder="my_server_client" />
                </FormControl>
                <FormControl id="clientSecret">
                    <FormLabel>Client Secret</FormLabel>
                    <Input type="text" />
                </FormControl>
            </HStack>

            <HStack spacing={2}>
                <FormControl id="scopes">
                    <FormLabel>Scopes to request</FormLabel>
                    <Input type="text" placeholder="myapi" />
                </FormControl>
                <FormControl id="grantType">
                    <FormLabel>Grant Type</FormLabel>
                    <Input type="text" readOnly value="client_credentials" disabled />
                </FormControl>
            </HStack>

            <div>
            <Button
                mt={4}
                // size="sm"
                colorScheme="blue"
                isLoading={false}
                onClick={() => {}}
            >
                Edit
            </Button>
            </div>
        </Stack>
    );
};

const CronjobListUsingConfig = () => {
    const columns = useMemo(
        () =>
            [
                { accessor: 'project', Header: 'Project' },
                { accessor: 'title', Header: 'Title' },
            ] as Column<Partial<CronjobListDto>>[],
        []
    );
    const data = [
        {
            project: 'FYM',
            title: 'MyCronjob',
        },
        {
            project: 'LST',
            title: 'Another Job',
        },
    ];
    return <DataTable columns={columns} data={data} />;
};

export default function ConfigTemplate() {
    // useRequireAuth('pm');

    return (
        <DefaultLayout>
            <Head>
                <title>Configuration Template</title>
            </Head>

            <Hero showBackground={false}>
                <Hero.Title>Configuration template</Hero.Title>
            </Hero>

            <Stack as={Clamp} spacing={8}>
                <ConfigForm />
                <Stack spacing={4}>
                    <h2>Used by</h2>
                    <CronjobListUsingConfig />
                </Stack>
            </Stack>
        </DefaultLayout>
    );
}
