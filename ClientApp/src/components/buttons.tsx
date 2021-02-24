import {Button, ButtonProps, CircularProgress, useTheme} from "@material-ui/core";
import React from "react";
import styles from './buttons.module.scss'
import clsx from "clsx";

export function SpinnerButton(props: ButtonProps & { loading?: boolean }) {
    const theme = useTheme();
    const {loading, children, ...buttonProps} = props;
    const spinner = <CircularProgress size={theme.typography.button.fontSize}
                                      thickness={5}
                                      color="inherit"/>
    return <Button {...buttonProps} className={styles.spinnerButton}>
        <div className={clsx(styles.spinner, !loading && styles.hidden)}>{spinner}</div>
        <span className={clsx(styles.contents, loading && styles.hidden)}>{children}</span>
    </Button>
}