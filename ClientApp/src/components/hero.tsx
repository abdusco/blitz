import React from 'react'
import styles from './hero.module.scss'
import {Clamp} from "../layout/layout";

export default function Hero({children}) {
    return <div className={styles.hero}>
        <Clamp className={styles.heroInner}>
            <div>
                {children}
            </div>
        </Clamp>
    </div>
}

function HeroTitle({children}) {
    return <h1 className={styles.heroTitle}>{children}</h1>
}

function HeroSummary({children}) {
    return <div className={styles.heroSummary}>{children}</div>
}

function HeroBody({children}) {
    return <div className={styles.heroBody}>{children}</div>
}


Hero.Title = HeroTitle
Hero.Summary = HeroSummary
Hero.Body = HeroBody