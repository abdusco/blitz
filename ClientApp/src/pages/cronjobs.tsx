import React from "react";
import {useCheckAuth} from "../lib/useCheckAuth";
import DefaultLayout from "../layout/layout";
import Head from "../components/head";

export default function Cronjobs() {
    // useCheckAuth()

    return <DefaultLayout>
        <Head>
            <title>Cronjobs</title>
        </Head>

        <div>cronjobs</div>
    </DefaultLayout>
}