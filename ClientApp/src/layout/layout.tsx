import React from "react";
import {useAuth, useUser} from "../lib/auth";
import {Link, useLocation} from "react-router-dom";
import styles from './layout.module.scss'
import {Button, CircularProgress, Typography} from "@material-ui/core";
import {useIsFetching} from "react-query";
import clsx from "clsx";

export default function DefaultLayout(props) {
    return (<>
        <TopBar/>
        <GlobalSpinner/>
        {props.children}
    </>)
}

function TopBar() {
    return <header className={styles.topbar}>
        <Nav/>
        <Spacer/>
        <LoginInfo/>
    </header>
}

function Nav() {
    return <nav>
        <Link to='/'>home</Link>
        <Link to='/users'>users</Link>
    </nav>;
}

function GlobalSpinner() {
    const isFetching = useIsFetching()
    return <CircularProgress
        size={'2rem'}
        title={`Fetching ${isFetching} requests`}
        variant='indeterminate'
        className={clsx(styles.spinner, !isFetching && styles.hidden)}
    />
}

function LoginInfo() {
    const auth = useAuth();
    const user = useUser();
    const location = useLocation();

    return <div>
        <Typography variant={'button'} className={styles.username}>
            {user && user.email}
        </Typography>
        {!auth.user && <Button onClick={() => auth.signIn(location.pathname)}>login</Button>}
        {auth.user && <Button onClick={() => auth.signOut()}>logout</Button>}
    </div>;
}

export function Centered({children}) {
    return <div className={styles.centered}>
        <div>
            {children}
        </div>
    </div>
}

const Spacer = () => <div className={styles.spacer}/>;
