import { Button, Heading, Stack } from '@chakra-ui/react';
import React, {useEffect} from 'react';
import { useLocation } from 'react-router-dom';
import Logo from '../components/Logo';
import { CenteredFullScreen } from '../layout/layout';
import { useAuth } from '../lib/auth';

export default function Unauthenticated() {
    const location = useLocation();
    const justSignedOut = !!location.state?.signedOut;
    const { signIn } = useAuth();
    const reason = location.state?.reason;
    const next = location.state?.next === location.pathname ? '/': location.state?.next;
    
    return (
        <CenteredFullScreen>
            <Stack spacing={4}>
                <Heading size={'xl'} textAlign={'center'} fontWeight="bold" color="purple.500">
                    <Logo />
                </Heading>

                {reason && <p>{reason}</p>}
                {!justSignedOut && <p>You need to sign in to use the app.</p>}

                <Button colorScheme="purple" onClick={() => signIn({ next })}>
                    Sign in
                </Button>
            </Stack>
        </CenteredFullScreen>
    );
}
