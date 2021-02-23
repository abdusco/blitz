import React from "react";
import {useAuth, useUser} from "../lib/auth";
import {Link, useLocation} from "react-router-dom";
import styles from './default.module.scss'
import {CircularProgress} from "@material-ui/core";
import {useIsFetching} from "react-query";

export default function DefaultLayout(props) {
    return (<>
        <Nav/>
        {props.children}
    </>)
}

function Nav() {
    const auth = useAuth();
    const user = useUser();
    const location = useLocation();
    const isFetching = useIsFetching()
    return <nav className={styles.nav}>
        <Link to='/'>home</Link>
        <Link to='/users'>users</Link>
        <div className={styles.spacer}/>
        <CircularProgress
        title={`Fetching ${isFetching} requests`}
            variant='indeterminate' className={isFetching ? undefined : styles.invisible}/>
        {user && user.email}
        {!auth.user && <button onClick={() => auth.signIn(location.pathname)}>login</button>}
        {auth.user && <button onClick={() => auth.signOut()}>logout</button>}
    </nav>;
}


export function Centered({children}) {
    return <div className={styles.centered}>
        <div>
            {children}
        </div>
    </div>
}