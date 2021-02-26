import {NavLink as RouterNavLink} from "react-router-dom";
import React from "react";
import styles from './nav.module.scss'

export default function Nav() {
    return <nav className={styles.nav}>
        <NavLink to="/">dashboard</NavLink>
        <NavLink to="/projects">projects</NavLink>
        <NavLink to="/cronjobs">cronjobs</NavLink>
        <NavLink to="/executions">executions</NavLink>
        <NavLink to="/users">users</NavLink>
    </nav>;
}

const NavLink = (props) => {
    return <RouterNavLink activeClassName={styles.active} className={styles.navLink} {...props}/>
}