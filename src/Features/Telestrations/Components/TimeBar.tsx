import * as React from 'react';
import {
    Slider,
    makeStyles,
    createStyles,
    Theme as ITheme,
} from '@material-ui/core';

import { useEffect, useState, useRef } from 'react';
import { withStyles } from '@material-ui/core/styles';
import VideoTime from './VideoTime';

const TimeSlider = withStyles({
    root: {
        left: '0.2%',
        height: '35px',
        width: '87.8%',
        padding: '0px',
    },
    track: {
        opacity: 0,
        height: '35px',
    },
    rail: {
        height: '35px',
        background: 'black',
    },
})(Slider);

let needPlay = false;

const useStyles = makeStyles((theme: ITheme) =>
    createStyles({
        thumbLine: {
            backgroundColor: '#fff',
            minWidth: '1px',
            minHeight: '150px',
            borderRadius: '0px',
        },
        thumbTriangle: {
            marginTop: '5px',
            fontSize: '0px',
            lineHeight: '0%',
            width: '0px',
            borderTop: '10px solid #fff',
            borderLeft: '7px solid rgba(0, 0, 0, 0)',
            borderRight: '7px solid rgba(0, 0, 0, 0)',
        },
    })
);

const Thumb = (props: any) => {
    const classes = useStyles();

    const style = {
        ...props.style,
        marginLeft: '0px',
        marginRight: '0px',
        display: 'flex',
        flexDirection: 'column' as 'column',
        width: '0px',
        height: 'auto',
        // boxShadow: '#ebebeb 0 2px 2px',
        '&:focus, &:hover, &$active': {
            // boxShadow: '#ccc 0 2px 3px 1px',
        },
    };

    return (
        <div {...props} style={style}>
            <div className={classes.thumbTriangle} />
            <div className={classes.thumbLine} />
        </div>
    );
};

const styles = (theme: ITheme) => ({
    container: {
        display: 'flex',
        alignItems: 'center',
    },
    controlButtons: {
        minWidth: '70px',
        maxWidth: '70px',
        textAlign: 'center' as 'center',
        '& > svg': {
            cursor: 'pointer',
        },
    },
});
const convertTime = (second: number) => {
    if (!second) {
        return '0';
    }
    const padString = second.toString().padStart(2, '0');
    return `00:${padString}:00`;
};

const secondDiv = (t: any) => {
    const { key, left, string } = t;
    return (
        <div
            style={{
                position: 'absolute',
                left: `${left}px`,

                display: 'flex',
                flexDirection: 'column',
                top: '-15px',
            }}
            key={key}
        >
            <div style={{ transform: 'translateX(-40%)' }}>{string}</div>
            <div>|</div>
        </div>
    );
};
const timeBar = ({ videoRef, updatePreview, classes }: any) => {
    const [progressState, setProgressState]: [any, any] = useState(0);
    const [timeArray, setTimeArray]: [[], any] = useState([]);
    const timeRef = useRef<HTMLDivElement>(null);

    const updatePercentFinished = () => {
        const { current: video } = videoRef;
        if (video) {
            const onTick = () => {
                const { duration, currentTime } = video;
                const percentFinished = (currentTime / duration) * 100;
                return setProgressState(percentFinished);
            };
            video.addEventListener('timeupdate', onTick);
            return () => video.removeEventListener('timeupdate', onTick);
        }
        return undefined;
    };

    const videoLoaded = () => {
        const { current: video } = videoRef;

        if (video) {
            const onLoaded = () => {
                const { duration } = video;

                if (timeRef.current) {
                    const totalwidth = timeRef.current.offsetWidth;

                    const secondWidth = (totalwidth * 0.88 - 1) / duration;
                    const secondArray = [];
                    for (let i = 0; i < Math.floor(duration) + 1; i++) {
                        secondArray.push({
                            key: i,
                            left: i * secondWidth,
                            string: convertTime(i),
                        });
                    }
                    setTimeArray(secondArray);
                }
            };
            video.addEventListener('loadeddata', onLoaded);
            return () => video.removeEventListener('loadeddata', onLoaded);
        }
        return undefined;
    };

    const onChange = (event: any, value: number) => {
        const { current: video } = videoRef;
        if (video) {
            if (!video.paused) {
                video.pause();
                needPlay = true;
            }
            setTimeout(() => setProgressState(value), 0);
        }
    };

    const onChangeCommitted = (event: any, value: number) => {
        const { current: video } = videoRef;
        if (video) {
            if (needPlay) {
                video.play();
                needPlay = false;
            }
            const time = (video.duration * value) / 100;
            video.currentTime = time;
            setProgressState(value);
            updatePreview(time);
        }
    };

    useEffect(updatePercentFinished, []);
    useEffect(videoLoaded, []);
    return (
        <div
            className={classes.container}
            style={{
                position: 'relative',
                backgroundColor: '#363636',
                height: '35px',
                marginTop: '10px',
            }}
        >
            <div style={{ width: '12%', paddingLeft: '10px' }}>
                <VideoTime videoRef={videoRef} />
            </div>

            <TimeSlider
                value={progressState}
                ThumbComponent={Thumb}
                onChangeCommitted={onChangeCommitted}
                onChange={onChange}
                step={0.1}
            ></TimeSlider>
            <div
                style={{
                    display: 'flex',
                    position: 'absolute',
                    width: '88%',
                    left: '12%',
                    backgroundColor: 'red',
                    fontSize: '12px',
                    pointerEvents: 'none',
                }}
                ref={timeRef}
            >
                {timeArray && timeArray.map(secondDiv)}
            </div>
        </div>
    );
};

export const TimeBar = withStyles(styles)(timeBar);
