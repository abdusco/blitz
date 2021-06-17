import React from 'react';
import { Button } from '@chakra-ui/button';
import { FormControl, FormHelperText, FormLabel } from '@chakra-ui/form-control';
import { Input } from '@chakra-ui/input';
import { Box, HStack, Stack } from '@chakra-ui/layout';

import { PropsWithChildren } from 'react';
import { useForm } from 'react-hook-form';
import { TokenAuthCreateDto } from '../api';

interface Props {
    defaultValues?: Partial<TokenAuthCreateDto>;
    onSubmit: (data: TokenAuthCreateDto) => Promise<void> | void;
    isLoading?: boolean;
}

export default function TokenAuthForm(props: PropsWithChildren<Props>) {
    const form = useForm<TokenAuthCreateDto>({ defaultValues: props.defaultValues });

    return (
        <form onSubmit={form.handleSubmit(props.onSubmit)}>
            <Stack spacing={2}>
                {props.children}
                <FormControl id="tokenEndpoint" isRequired>
                    <FormLabel>Token Endpoint</FormLabel>
                    <Input
                        name="tokenEndpoint"
                        ref={form.register}
                        required
                        type="url"
                        placeholder="https://id.server/connect/token"
                    />
                    <FormHelperText>
                        An endpoint that issues tokens for <code>client_credentials</code> grant requests
                    </FormHelperText>
                </FormControl>
                <HStack spacing={2}>
                    <FormControl id="clientId" isRequired>
                        <FormLabel>Client ID</FormLabel>
                        <Input
                            name="clientId"
                            ref={form.register}
                            required
                            type="text"
                            placeholder="my_server_client"
                        />
                    </FormControl>
                    <FormControl id="clientSecret" isRequired>
                        <FormLabel>Client Secret</FormLabel>
                        <Input
                            name="clientSecret"
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
                        <Input name="scope" ref={form.register} type="text" placeholder="scope1 scope2" />
                    </FormControl>
                    <FormControl id="grantType">
                        <FormLabel>Grant Type</FormLabel>
                        <Input type="text" readOnly value="client_credentials" disabled />
                    </FormControl>
                </HStack>

                <HStack pt="4">
                    <Button colorScheme="blue" isLoading={props.isLoading} type="submit">
                        Save
                    </Button>
                </HStack>
            </Stack>
        </form>
    );
}
