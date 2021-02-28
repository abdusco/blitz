import { Button, Heading, Stack } from '@chakra-ui/react';
import styled from '@emotion/styled';
import React from 'react';
import { useHistory } from 'react-router-dom';
import Logo from '../components/Logo';
import { CenteredFullScreen } from '../layout/layout';

const Centered = styled.div`
    text-align: center;
    display: grid;
    gap: 2rem;
`;

export default function Forbidden() {
    const history = useHistory();

    return (
        <CenteredFullScreen>
            <Centered>
                <Heading size={'xl'} textAlign={'center'} fontWeight="bold" color="purple.500">
                    <Logo />
                </Heading>

                <p>You are not allowed to access this page.</p>

                <div>
                    {/* Redirect user to the page before the one that caused him to come here */}
                    <Button colorScheme="purple" onClick={() => history.go(-2)} mr={2}>
                        Go back
                    </Button>{' '}
                    <Button onClick={() => history.push('/')}>Go home</Button>
                </div>
            </Centered>
        </CenteredFullScreen>
    );
}
