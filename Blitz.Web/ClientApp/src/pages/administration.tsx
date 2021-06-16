import { Button } from "@chakra-ui/button";
import { useDisclosure } from "@chakra-ui/hooks";
import { Heading } from "@chakra-ui/layout";
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/modal";
import React, { useMemo } from "react";
import { Column } from "react-table";
import DataTable from "../components/DataTable";
import Head from "../components/Head";
import Hero from "../components/Hero";
import TokenAuthForm from "../components/TokenAuthForm";
import DefaultLayout, { Clamp } from "../layout/layout";
import { useRequireAuth } from "../lib/useRequireAuth";


export default function Administration() {
    // useRequireAuth('pm');

    const {isOpen, onOpen, onClose} = useDisclosure();

    const onSubmit = (data) => {
        console.log(data);
        onClose();
    }

    const columns = useMemo(() => [
        {accessor: 'title',Header: 'Title'},
    ] as Column[], []);
    const data = [
        {title: 'devauth'}
    ];

    return <DefaultLayout>
            <Head>
                <title>Administration</title>
            </Head>

            <Hero showBackground={false}>
                <Hero.Title>Authentication presets</Hero.Title>
            </Hero>

            <Clamp>
                <DataTable columns={columns} data={data} />
                <Modal isOpen={isOpen} onClose={onClose} size='3xl'>
                    <ModalOverlay/>
                    <ModalContent>
                        <ModalHeader></ModalHeader>
                        <ModalCloseButton/>
                        <ModalBody p='8'>
                            <TokenAuthForm onSubmit={onSubmit} />
                        </ModalBody>
                    </ModalContent>
                </Modal>

                <Button onClick={onOpen}>New preset</Button>
            </Clamp>
    </DefaultLayout>
}