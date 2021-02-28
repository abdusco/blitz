import clsx from 'clsx';
import React from 'react';
import { PropsWithChildren } from 'react';
import { Link, LinkProps } from 'react-router-dom';
import styles from './components.module.scss';

function LinkWithState(
    props: PropsWithChildren<{ pathname: string; state?: any; isEmphasized?: boolean } & Omit<LinkProps, 'to'>>
) {
    const { pathname, state, className, ...remaining } = props;
    return (
        <Link
            className={clsx(className, props.isEmphasized && styles.emphasizedLink)}
            to={{ pathname, state }}
            {...remaining}
        >
            {props.children}
        </Link>
    );
}
export default LinkWithState;

