import { Button, Heading, Stack } from '@chakra-ui/react';
import React from 'react';
import { useLocation } from 'react-router-dom';
import Logo from '../components/Logo';
import { CenteredFullScreen } from '../layout/layout';
import { useAuth } from '../lib/auth';

export default function Unauthorized() {
    const location = useLocation();
    const justSignedOut = !!location.state?.signedOut;
    const { signIn } = useAuth();

    return (
        <CenteredFullScreen>
            <Stack spacing={4}>
                <Heading size={'xl'} textAlign={'center'} fontWeight="bold" color="purple.500">
                    <Logo />
                </Heading>

                {!justSignedOut && <p>You need to sign in to use the app.</p>}

                <Button colorScheme="purple" onClick={() => signIn({ next: location.state?.next })}>
                    Sign in
                </Button>
            </Stack>
        </CenteredFullScreen>
    );
}
