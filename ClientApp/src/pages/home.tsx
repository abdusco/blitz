import React from "react";
import DefaultLayout from "../layout/default";
import Head from "../components/head";
import {useCheckAuth} from "../lib/useCheckAuth";
import {useQuery} from "react-query";
import axios from "axios";

export default function Home() {
    useCheckAuth()
    const {data} = useQuery('home', () => axios.post('https://httpbin.org/delay/2'));
    useQuery('home2', () => axios.post('https://httpbin.org/delay/4'))

    return (
        <DefaultLayout>
            <Head>
                <title>Home</title>
            </Head>

            <div>home</div>

            <pre>{JSON.stringify(data, null, 2)}</pre>
        </DefaultLayout>
    )
}