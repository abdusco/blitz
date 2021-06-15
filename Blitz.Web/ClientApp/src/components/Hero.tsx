import React, { PropsWithChildren } from 'react';
import styles from './hero.module.scss';
import { Clamp } from '../layout/layout';
import { Heading } from '@chakra-ui/react';

export default function Hero({ children, showBackground }: PropsWithChildren<{ showBackground?: boolean }>) {
    return (
        <div className={showBackground ? styles.hero : undefined}>
            <Clamp className={styles.heroInner}>
                <div>{children}</div>
            </Clamp>
        </div>
    );
}

function HeroTitle({ children }) {
    return <Heading className={styles.heroTitle}>{children}</Heading>;
}

function HeroSummary({ children }) {
    return <div className={styles.heroSummary}>{children}</div>;
}

function HeroBody({ children }) {
    return <div className={styles.heroBody}>{children}</div>;
}

Hero.Title = HeroTitle;
Hero.Summary = HeroSummary;
Hero.Body = HeroBody;
