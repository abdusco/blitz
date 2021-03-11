import { Button, Heading } from '@chakra-ui/react';
import styled from '@emotion/styled';
import React from 'react';
import { useHistory } from 'react-router-dom';
import Logo from '../components/Logo';
import { CenteredFullScreen } from '../layout/layout';

const Centered = styled.div`
    text-align: center;
    display: grid;
    gap: 1rem;
`;

export default function Forbidden() {
    const history = useHistory();

    return (
        <CenteredFullScreen>
            <Centered>
                <Heading size={'xl'} textAlign={'center'} fontWeight="bold" color="purple.500">
                    <Logo />
                </Heading>

                <p>You are not authorized to access this page.</p>

                <div>
                    <Button onClick={() => history.push('/')}>Go home</Button>
                </div>
            </Centered>
        </CenteredFullScreen>
    );
}
