import React from "react";
import {useQuery} from "react-query";
import axios from "axios";
import styles from './home.module.scss'
import {Link} from "react-router-dom";
import {Box, Heading } from "@chakra-ui/react";

export default function Home() {
    // useCheckAuth()
    const {data} = useQuery('home', () => axios.post('https://httpbin.org/delay/1'));
    useQuery('home2', () => axios.post('https://httpbin.org/delay/3'))

    const links = [
        {text: 'Projects', pathname: '/projects'},
        {text: 'Cronjobs', pathname: '/cronjobs'},
        {text: 'Executions', pathname: '/executions'},
        {text: 'Users', pathname: '/users'},
    ]

    return (
        <div className={styles.home}>
            <div className={styles.homeContent}>
                <Heading size={'xl'} className={styles.homeTitle}>blitz</Heading>
                <ul className={styles.grid}>
                    {links.map((it, i) => (<li key={i}>
                        <Link to={it.pathname}
                              className={styles.cardLink}>
                            <article className={styles.card}>
                                <Heading size={'md'} className={styles.cardTitle}>{it.text}</Heading>
                            </article>
                        </Link>
                    </li>))}
                </ul>
            </div>
        </div>
    )
}