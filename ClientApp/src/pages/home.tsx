import React from "react";
import {useQuery} from "react-query";
import axios from "axios";
import styles from './home.module.scss'
import {Link} from "react-router-dom";

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
            <h1>blitz</h1>

            <ul className={styles.grid}>
                {links.map((it, i) => (<li key={i}>
                    <Link to={it.pathname} className={styles.cardLink}>
                        <article className={styles.card}>
                            <h2 className={styles.cardTitle}>{it.text}</h2>
                        </article>
                    </Link>
                </li>))}
            </ul>
        </div>
    )
}