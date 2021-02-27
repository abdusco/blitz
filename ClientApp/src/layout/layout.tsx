import React from 'react';
import { useAuth, useUser } from '../lib/auth';
import { useHistory, useLocation } from 'react-router-dom';
import styles from './layout.module.scss';
import { useIsFetching } from 'react-query';
import clsx from 'clsx';
import Nav from './nav';
import { Button, Menu, MenuButton, MenuItem, MenuList, Progress } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';

export default function DefaultLayout(props) {
    return (
        <div>
            <GlobalSpinner />
            <TopBar />
            {props.children}
        </div>
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
    const user = useUser();
    const location = useLocation();
    const history = useHistory();

    const signOut = () => {
        auth.signOut();
        history.push({ pathname: '/' });
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

export function Centered({ children }) {
    return (
        <div className={styles.centered}>
            <div>{children}</div>
        </div>
    );
}

const Spacer = () => <div className={styles.spacer} />;
