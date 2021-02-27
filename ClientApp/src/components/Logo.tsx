import styled from '@emotion/styled';
import React from "react";

const SvgWrapper = styled.div`
    display: inline-block;
    width: 1.3em;
    height: 1.3em;
    
    svg {
        fill: currentColor;
    }
`

const LogoWrapper = styled.div`
    display: inline-flex;
    align-items: center;
`;

export default function Logo() {
    return <LogoWrapper>
        <SvgWrapper>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 768"><path d="M352.5 672h-33l33-223.5H240q-24 0-12-21 4.5-7.5 1.5-4.5 76.5-133.5 186-327h33l-33 223.5H528q21 0 13.5 21z" /></svg>
        </SvgWrapper>
        <span>blitz</span>
    </LogoWrapper>
}