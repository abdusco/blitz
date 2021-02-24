import React from "react";
import DefaultLayout from "../layout/layout";
import Head from "../components/head";
import {Button, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField} from "@material-ui/core";
import {Add} from "@material-ui/icons";
import {useForm} from "react-hook-form";
import {useMutation} from "react-query";
import axios from "axios";
import {SpinnerButton} from "../components/buttons";
import {Debug} from "../components/debug";

export default function Cronjobs() {
    // useCheckAuth()

    return <DefaultLayout>
        <Head>
            <title>Cronjobs</title>
        </Head>

        <h1>cronjobs</h1>
        <Button color="primary"
                variant="contained"
                startIcon={<Add/>}>Add</Button>
    </DefaultLayout>
}

interface CronjobForm {
    projectId: string;
    name: string;
    url: string;
    cron: string;
    httpMethod: string;
}

const sleep = async (duration: number = 5000) => new Promise((resolve) => setTimeout(resolve, duration));


export function CreateCronjob() {
    const {handleSubmit, register, formState} = useForm()
    const mutation = useMutation((payload) => axios.post('https://httpbin.org/post', payload))
    const {data, error} = mutation;
    const onSubmit = async (data) => {
        await mutation.mutateAsync(data);
    }

    const {errors, isSubmitting} = formState;

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
                required
                label="Name"
                error={!!errors?.name}
                helperText={errors?.name?.message}
                inputRef={register}
                name="name"/>
            <TextField
                required
                label="URL"
                type={'url'}
                error={!!errors?.url}
                helperText={errors?.url?.message}
                inputRef={register}
                name="url"/>
            <TextField
                required
                label="Schedule"
                error={!!errors?.cron}
                helperText={errors?.cron?.message}
                inputRef={register({pattern: {value: /(\S ){4}(\S+)/, message: 'Invalid cron expression'}})}
                name="cron"/>
            <FormControl>
                <FormLabel>HTTP Method</FormLabel>
                <RadioGroup name="httpMethod"
                            defaultValue={'POST'}
                            row>
                    <FormControlLabel value="POST"
                                      control={<Radio/>}
                                      label="POST"
                                      inputRef={register}/>
                    <FormControlLabel value="GET"
                                      control={<Radio/>}
                                      label="GET"
                                      inputRef={register}/>
                </RadioGroup>
            </FormControl>
            <SpinnerButton loading={mutation.isLoading}
                           variant="contained"
                           color="primary"
                           type="submit">Save</SpinnerButton>
            <Debug value={data}/>
        </form>
    )
}