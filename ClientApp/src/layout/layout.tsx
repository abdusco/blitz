import React from "react";
import {useAuth, useUser} from "../lib/auth";
import {useLocation} from "react-router-dom";
import styles from './layout.module.scss'
import {Button, CircularProgress, Typography} from "@material-ui/core";
import {useIsFetching} from "react-query";
import clsx from "clsx";
import Nav from "./nav";

export default function DefaultLayout(props) {
    return (<div>
        <TopBar/>
        <GlobalSpinner/>
        {props.children}
    </div>)
}

export function Clamp(props: { type?: string, children?: any; className?: string; width?: 'narrow' | 'wide' }) {
    const {width = 'narrow', type = 'div', children, className, ...otherProps} = props;
    return React.createElement(type, {
        className: clsx(width === 'narrow' && styles.narrow, width === 'wide' && styles.wide, className),
        children
    })
}

function TopBar() {
    return <Clamp className={clsx(styles.topbar, styles.centerVertically)}>
        <Nav/>
        <Spacer/>
        <LoginInfo/>
    </Clamp>
}

function GlobalSpinner() {
    const isFetching = useIsFetching()
    return <CircularProgress
        size={'2rem'}
        title={`Fetching ${isFetching} requests`}
        variant="indeterminate"
        className={clsx(styles.spinner, !isFetching && styles.hidden)}
    />
}

function LoginInfo() {
    const auth = useAuth();
    const user = useUser();
    const location = useLocation();

    return <div className={styles.centerVertically}>
        <Typography variant={'button'}
                    className={styles.username}>
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
