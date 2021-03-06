import clsx from 'clsx';
import React from 'react';
import { NavLink } from 'react-router-dom';
import Logo from '../components/Logo';
import { useUserProfile } from '../lib/auth';
import styles from './nav.module.scss';

export default function Nav() {
    const user = useUserProfile();
    const linkProps = {
        activeClassName: styles.active,
        className: styles.navLink,
    };
    const isAdmin = user?.roles?.includes('admin');
    const links = [
        { pathname: '/projects', text: 'Projects', roles: ['pm'] },
        { pathname: '/cronjobs', text: 'Cronjobs', roles: ['pm'] },
        { pathname: '/executions', text: 'Executions', roles: ['pm'] },
        { pathname: '/users', text: 'Users', roles: ['admin'] },
    ].filter((it) => isAdmin || (it.roles ? it.roles.some((r) => (user ? user.roles?.includes(r) : true)) : true));

    return (
        <nav className={styles.nav}>
            <NavLink className={clsx(styles.navLink, styles.logoLink)} exact to="/">
                <Logo />
            </NavLink>
            {links.map((link) => (
                <NavLink key={link.pathname} {...linkProps} to={link.pathname}>
                    {link.text}
                </NavLink>
            ))}
        </nav>
    );
}
