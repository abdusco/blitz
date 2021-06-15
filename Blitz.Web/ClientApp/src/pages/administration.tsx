import { Button } from "@chakra-ui/button";
import { Heading } from "@chakra-ui/layout";
import React from "react";
import Head from "../components/Head";
import Hero from "../components/Hero";
import DefaultLayout, { Clamp } from "../layout/layout";
import { useRequireAuth } from "../lib/useRequireAuth";

export default function Administration() {
    // useRequireAuth('pm');

    return <DefaultLayout>
            <Head>
                <title>Administration</title>
            </Head>

            <Hero showBackground={false}>
                <Hero.Title>Configuration templates</Hero.Title>
            </Hero>

            <Clamp>
                <Button>New template</Button>
            </Clamp>

            <Hero showBackground={false}>
                <Hero.Title>Users</Hero.Title>
            </Hero>
    </DefaultLayout>
}