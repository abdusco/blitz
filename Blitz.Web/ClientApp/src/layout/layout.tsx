import { ChevronDownIcon } from '@chakra-ui/icons';
import { Button, Menu, MenuButton, MenuItem, MenuList, Progress, useToast } from '@chakra-ui/react';
import styled from '@emotion/styled';
import clsx from 'clsx';
import React from 'react';
import { useIsFetching } from 'react-query';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth, useUserProfile } from '../lib/auth';
import styles from './layout.module.scss';
import Nav from './nav';

const PaddedLayout = styled.div`
    padding-bottom: 4rem;
`;

export default function DefaultLayout(props) {
    return (
        <PaddedLayout>
            <GlobalSpinner />
            <TopBar />
            {props.children}
        </PaddedLayout>
    );
}

export function Clamp(props: { type?: string; children?: any; className?: string; width?: 'narrow' | 'wide' }) {
    const { width = 'narrow', type = 'div', children, className } = props;
    return React.createElement(type, {
        className: clsx(width === 'narrow' && styles.narrow, width === 'wide' && styles.wide, className),
        children,
    });
}

function TopBar() {
    return (
        <Clamp className={clsx(styles.topbar, styles.centerVertically)}>
            <Nav />
            <Spacer />
            <LoginInfo />
        </Clamp>
    );
}

function GlobalSpinner() {
    const isFetching = useIsFetching();
    return <Progress size="xs" colorScheme="purple" isIndeterminate className={clsx(!isFetching && styles.hidden)} />;
}

function LoginInfo() {
    const auth = useAuth();
    const user = useUserProfile();
    const location = useLocation();
    const history = useHistory();
    const toast = useToast();

    const signOut = async () => {
        await auth.signOut();
        history.push('/unauthenticated', { next: location.pathname });
        toast({
            title: 'Signed out',
            description: `You've been signed out successfully.`,
            duration: 2000,
            position: 'top',
        });
    };

    if (!auth.user) {
        return <Button onClick={() => auth.signIn(location.pathname)}>Log in</Button>;
    }

    return (
        <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                {user && user.name}
            </MenuButton>
            <MenuList>
                <MenuItem onClick={signOut}>Log out</MenuItem>
            </MenuList>
        </Menu>
    );
}

const Spacer = () => <div className={styles.spacer} />;

export const CenteredFullScreen = styled.div`
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;
