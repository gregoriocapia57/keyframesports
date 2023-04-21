import * as React from 'react';
import { compose } from 'fp-ts/lib/function';
import { Theme as ITheme } from '@material-ui/core';
import { useRef } from 'react';
import { withStyles } from '@material-ui/core/styles';

import { ITelestrationStateMgr } from '../Types';
import { withTelestrationState } from '../State';
import { ShapeRow } from './ShapeRow';

const styles = (theme: ITheme) => ({
    shapeRowsDiv: {
        height: '130px',
        scrollbarColor: '#aaaaaa',
        scrollbarWidth: '6px',
        gap: '2px',
        display: 'flex',
        // scrollBehavior: 'auto',
        // overflowX: 'auto',
        // flexDirection: 'column',
    },
});

interface IShapeRowsProps {
    classes: any;
    telestrationStateMgr: ITelestrationStateMgr;
}

const shapeRows = ({ classes, telestrationStateMgr }: IShapeRowsProps) => {
    const { state } = telestrationStateMgr;
    const { telestrationManager } = state;
    const rowRef = useRef<HTMLDivElement>(null);

    return (
        <div
            className={classes.shapeRowsDiv}
            style={{
                scrollBehavior: 'auto',
                overflowX: 'auto',
                flexDirection: 'column',
            }}
            ref={rowRef}
        >
            {telestrationManager.addedShapes.map(
                (shape: any, index: number) => (
                    <ShapeRow
                        key={index}
                        title={`Circle ${index + 1}`}
                        shapeDetail={shape}
                        totalTelestrationDuration={
                            state.totalTelestrationDuration
                        }
                    />
                )
            )}
        </div>
    );
};

export const ShapeRows = compose(
    withTelestrationState,
    withStyles(styles)
)(shapeRows);
