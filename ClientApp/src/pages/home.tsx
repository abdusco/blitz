import React from "react";
import DefaultLayout from "../layout/default";
import Head from "../components/head";
import {useCheckAuth} from "../lib/useCheckAuth";

export default function Home() {
    useCheckAuth()

    return (
        <DefaultLayout>
            <Head>
                <title>Home</title>
            </Head>

            <div>home</div>
        </DefaultLayout>
    )
}