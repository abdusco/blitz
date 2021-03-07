import { Button, SpinnerProps, Switch, SwitchProps } from '@chakra-ui/react';
import React from 'react';

export default function SpinnerSwitch(props: SwitchProps & { isLoading?: boolean }) {
    const { isLoading, ...switchProps } = props;
    return (
        <Button variant="link" isLoading={isLoading}>
            <Switch id="email-alerts" {...switchProps} />
        </Button>
    );
}
