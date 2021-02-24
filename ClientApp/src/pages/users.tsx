import React from "react";
import {useCheckAuth} from "../lib/useCheckAuth";
import DefaultLayout from "../layout/layout";
import Head from "../components/head";

export default function Users() {
    // useCheckAuth()

    return <DefaultLayout>
        <Head>
            <title>Users</title>
        </Head>

        <div>users</div>
    </DefaultLayout>
}