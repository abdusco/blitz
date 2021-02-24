import React from "react";
import {useCheckAuth} from "../lib/useCheckAuth";
import DefaultLayout from "../layout/layout";
import Head from "../components/head";

export default function Executions() {
    // useCheckAuth()

    return <DefaultLayout>
        <Head>
            <title>Executions</title>
        </Head>

        <div>executions</div>
    </DefaultLayout>
}