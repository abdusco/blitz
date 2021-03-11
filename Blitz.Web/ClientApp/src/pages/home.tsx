import { Heading } from '@chakra-ui/react';
import styled from '@emotion/styled';
import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../lib/JwtAuthProvider';
import styles from './home.module.scss';

export default function Home() {
    const { user } = useAuth();

    const links = [
        { text: 'Projects', pathname: '/projects', icon: <ProjectsIcon />, roles: ['pm'] },
        { text: 'Cronjobs', pathname: '/cronjobs', icon: <CronjobsIcon />, roles: ['pm'] },
        { text: 'Executions', pathname: '/executions', icon: <ExecutionsIcon /> },
        { text: 'Users', pathname: '/users', icon: <UsersIcon />, roles: ['admin'] },
    ].filter((it) => it.roles ? user?.hasRole('admin', ...(it.roles || [])): true);

    return (
        <div className={styles.home}>
            <div className={styles.homeContent}>
                <Heading size={'xl'} fontWeight="bold" className={styles.homeTitle} color="purple.500">
                    <Logo />
                </Heading>
                {links.length > 0 && (
                    <ul className={styles.grid}>
                        {links.map((link, i) => (
                            <li key={link.pathname}>
                                <Link to={link.pathname} className={styles.cardLink}>
                                    <HomeCard>
                                        <div className="cardIcon">{link.icon}</div>
                                        <Heading size={'md'} className="cardTitle">
                                            {link.text}
                                        </Heading>
                                    </HomeCard>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

const HomeCard = styled.article`
    box-shadow: 0 0.25rem 2rem -0.25rem rgba(0, 0, 0, 0.15);
    padding: 4rem 2rem 2rem;
    border-radius: 2rem;
    transition: 0.2s;
    background-image: linear-gradient(120deg, rgba(255, 255, 255, 0), rgba(0, 0, 0, 0.01));

    &:hover {
        color: var(--c-primary);
        transform: translateY(-3px);
        box-shadow: 0 0.75rem 2.5rem -0.2rem rgba(0, 0, 0, 0.1);

        svg {
            fill: currentColor;
        }
    }

    svg {
        opacity: 0.2;
    }

    .cardIcon {
        width: 3rem;
        height: 3rem;
        margin-bottom: 1.5rem;
    }

    .cardTitle {
        margin: 0;
        font-weight: 600;
    }
`;

const ProjectsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 768">
        <path d="M576 415.5q52.5 0 90 38.3t37.5 90.7-37.5 90-90 37.5-90-37.5-37.5-90 37.5-90.8 90-38.2zM384 96q52.5 0 90 37.5t37.5 90-37.5 90.8-90 38.2-90-38.3-37.5-90.7 37.5-90T384 96zM192 415.5q52.5 0 90 38.3t37.5 90.7-37.5 90-90 37.5-90-37.5-37.5-90 37.5-90.8 90-38.2z" />
    </svg>
);

const CronjobsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 768">
        <path d="M384 640.5q93 0 158.3-66t65.2-159-65.3-158.3T384 192t-158.3 65.3-65.2 158.2 65.3 159 158.2 66zM609 237q25.5 33 44.3 84.8t18.7 93.7q0 118.5-84 203.3t-204 84.7-204-84.8-84-203.2 84-203.3 204-84.7q40.5 0 93.8 19.5t86.2 45l45-46.5q24 19.5 45 45zM352.5 448.5v-192h63v192h-63zM480 31.5V96H288V31.5h192z" />
    </svg>
);

const ExecutionsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M18 7l-1.4-1.4-6.4 6.3 1.5 1.4L18 7zm4.2-1.4L11.7 16.2 7.5 12 6 13.4l5.6 5.6 12-12-1.5-1.4zM.4 13.4L6 19l1.4-1.4L1.8 12 .4 13.4z" />
    </svg>
);

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 768">
        <path d="M288 415.5q33 0 76.5 9-76.5 42-76.5 111v72H64.5V528q0-34.5 41.25-61.5t90.75-39 91.5-12zm240 33q55.5 0 115.5 24t60 63v72h-351v-72q0-39 60-63t115.5-24zm-240-96q-39 0-67.5-28.5T192 256.5t28.5-67.5 67.5-28.5 67.5 28.5 28.5 67.5-28.5 67.5-67.5 28.5zM528 384q-33 0-56.25-23.25T448.5 304.5t23.25-57 56.25-24 56.25 24 23.25 57-23.25 56.25T528 384z" />
    </svg>
);
