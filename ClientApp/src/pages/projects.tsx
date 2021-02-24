import React, {useState} from "react";
import DefaultLayout, {Clamp} from "../layout/layout";
import Head from "../components/head";
import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField} from "@material-ui/core";
import {Add} from '@material-ui/icons';
import Hero from "../components/hero";
import {useForm} from "react-hook-form";
import {ColDef, DataGrid} from "@material-ui/data-grid";

export default function Projects() {
    // useCheckAuth()
    const [open, setOpen] = useState(false);
    const form = useForm()

    const onSubmit = (data) => {
        console.log('submitted', {data});
        setOpen(false);
    }

    return <DefaultLayout>
        <Head>
            <title>Projects</title>
        </Head>

        <Hero>
            <Hero.Title>Projects</Hero.Title>
            <Hero.Summary>
                Cronjobs are filed under a project. You need to have a project before creating a cronjob.
            </Hero.Summary>
            <Hero.Body>
                <Button color="primary"
                        size="large"
                        variant="contained"
                        onClick={() => setOpen(true)}
                        startIcon={<Add/>}>Create Project</Button>
            </Hero.Body>
        </Hero>


        <Dialog open={open}
                onClose={() => setOpen(false)}
                aria-labelledby="form-dialog-title">
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogTitle id="form-dialog-title">New Project</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please type in the project title
                    </DialogContentText>
                    <TextField
                        label="Title"
                        autoFocus
                        name="title"
                        required
                        inputRef={form.register}
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}
                            color="primary">
                        Cancel
                    </Button>
                    <Button type="submit"
                            variant="contained"
                            color="primary">
                        Save
                    </Button>
                </DialogActions>
            </form>
        </Dialog>

        <Clamp width={'narrow'}>
            <ProjectsTable/>
        </Clamp>
    </DefaultLayout>
}

const rows = [
    {id: 1, lastName: 'Snow', firstName: 'Jon', age: 35},
    {id: 2, lastName: 'Lannister', firstName: 'Cersei', age: 42},
    {id: 2, lastName: 'Lannister', firstName: 'Cersei', age: 42},
    {id: 2, lastName: 'Lannister', firstName: 'Cersei', age: 42},
    {id: 2, lastName: 'Lannister', firstName: 'Cersei', age: 42},
    {id: 3, lastName: 'Lannister', firstName: 'Jaime', age: 45},
    {id: 4, lastName: 'Stark', firstName: 'Arya', age: 16},
    {id: 5, lastName: 'Targaryen', firstName: 'Daenerys', age: null},
    {id: 6, lastName: 'Melisandre', firstName: null, age: 150},
    {id: 7, lastName: 'Clifford', firstName: 'Ferrara', age: 44},
    {id: 8, lastName: 'Frances', firstName: 'Rossini', age: 36},
    {id: 9, lastName: 'Roxie', firstName: 'Harvey', age: 65},
];

const columns: ColDef[] = [
    {field: 'id', headerName: 'ID', flex: 1},
    {field: 'firstName', headerName: 'First name', flex: 1},
    {field: 'lastName', headerName: 'Last name', flex: 1},
    {
        field: 'age',
        headerName: 'Age',
        type: 'number',
        flex: 1,
    },
    {
        field: 'fullName',
        headerName: 'Full name',
        description: 'This column has a value getter and is not sortable.',
        sortable: false,
        flex: 1,
        renderCell: params => {
          return <div>1</div>
        },
        valueGetter: (params) =>
            `${params.getValue('firstName') || ''} ${params.getValue('lastName') || ''}`,
    },
];

const ProjectsTable = () => {
    return (
        <div>
            <DataGrid rows={rows}
                      autoHeight
                      disableColumnMenu
                      columns={columns}
                      pageSize={30}
            />
        </div>
    )
}
