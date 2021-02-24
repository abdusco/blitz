import React from "react";
import {useCheckAuth} from "../lib/useCheckAuth";
import DefaultLayout from "../layout/layout";
import Head from "../components/head";

export default function Projects() {
    // useCheckAuth()

    return <DefaultLayout>
        <Head>
            <title>Projects</title>
        </Head>

        <div>Projects</div>
    </DefaultLayout>
}