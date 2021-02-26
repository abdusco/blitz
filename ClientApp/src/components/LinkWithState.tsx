import React from 'react';
import { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';

export default function ListWithState(props: PropsWithChildren<{ pathname: string; state: any }>) {
    const { pathname, state } = props;
    return <Link to={{ pathname, state }}>{props.children}</Link>;
}
