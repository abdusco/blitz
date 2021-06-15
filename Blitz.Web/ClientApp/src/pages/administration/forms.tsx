import { Button } from '@chakra-ui/button';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { Input } from '@chakra-ui/input';
import { HStack, Stack } from '@chakra-ui/layout';
import React from 'react';

export const ConfigForm = () => {
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
