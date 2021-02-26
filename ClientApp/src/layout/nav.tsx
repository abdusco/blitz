import clsx from 'clsx';
import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './nav.module.scss';

export default function Nav() {
    const linkProps = {
        activeClassName: styles.active,
        className: styles.navLink,
    };

    const links = {
        '/projects': 'Projects',
        '/cronjobs': 'Cronjobs',
        '/executions': 'Executions',
        '/users': '/users',
    };

    return (
        <nav className={styles.nav}>
            <NavLink className={clsx(styles.navLink, styles.logoLink)} exact to="/">
                🗲 blitz!
            </NavLink>
            {Object.entries(links).map(([to, text], _) => (
                <NavLink key={to} {...linkProps} to={to}>
                    {text}
                </NavLink>
            ))}
        </nav>
    );
}
