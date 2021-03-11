import { Button, Heading, HStack, Stack } from '@chakra-ui/react';
import React, { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import Logo from '../components/Logo';
import { CenteredFullScreen } from '../layout/layout';
import { useAuth } from '../lib/auth';

export default function Unauthenticated() {
    const location = useLocation();
    const history = useHistory();
    const justSignedOut = !!location.state?.signedOut;
    const { login } = useAuth();
    const reason = location.state?.reason;
    const next = location.state?.next === location.pathname ? '/' : location.state?.next;

    console.log({ justSignedOut });

    return (
        <CenteredFullScreen>
            <Stack spacing={4}>
                <Heading size={'xl'} textAlign={'center'} fontWeight="bold" color="purple.500">
                    <Logo />
                </Heading>

                {reason && <p>{reason}</p>}
                {!justSignedOut && <p>You need to sign in to use the app.</p>}

                <HStack spacing={4} justifyContent="center">
                    {justSignedOut && <Button onClick={() => history.push('/')}>Go home</Button>}
                    <Button colorScheme="purple" onClick={() => login({ next })}>
                        Sign in
                    </Button>
                </HStack>
            </Stack>
        </CenteredFullScreen>
    );
}
