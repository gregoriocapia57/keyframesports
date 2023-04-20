import * as React from 'react';
import clsx from 'clsx';
import {
    Box,
    withStyles,
    WithStyles as IWithStyles,
    Theme as ITheme,
} from '@material-ui/core';
import { compose } from 'fp-ts/lib/function';
import { useEffect } from 'react';
import {
    canvasClickHandler,
    canvasMouseDownUpHandler,
    clearCanvas,
    drawImgToCanvas,
} from '../Utils/Canvas';
import {
    withTelestrationState,
    setModeAction,
    setVideoLoadError,
    setVideoLoaded,
    clickVideoBox,
    // VideoPlayAction,
    // VideoStopAction,
    VideoTickAction,
} from '../State';
import { ILocalStateMgr, withLocalState } from '../../../App/LocalState';
import { ITelestrationStateMgr } from '../Types';
import { maxRect } from '../Utils/Geometry';
import { RecordingCanvas } from './RecordCanvas';
import { PureVideo } from './PureVideo';
import { PlayControls } from './PlayControls';
import { TelestrationControls } from './TelestrationControls';
// import { telestrationMounted } from 'src/App/UserEvents';
// import { sendUserEvent } from 'src/App/UserEvents/UserEventManager';

const styles = (theme: ITheme) => ({
    container: {
        backgroundColor: theme.palette.common.black,
        display: 'flex',
        flexDirection: 'column' as 'column',
        height: '100%',
        justifyContent: 'flex-start',
    },
    root: {
        display: 'flex',
        justifyContent: 'center',
    },
    canvas: {
        position: 'absolute' as 'absolute',
    },
    canvasPlayMode: {
        zIndex: 0,
    },
    canvasEditMode: {
        zIndex: 1,
    },
    mouseCircle: {
        cursor: 'pointer',
    },
    mouseArrow: {
        cursor: 'crosshair',
    },
    easyChangeSize: {
        transition: 'all 0.5s ease-out',
    },
});

interface IProps extends IWithStyles {
    localStateMgr: ILocalStateMgr;
    videoUrl: string;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    telestrationStateMgr: ITelestrationStateMgr;
    videoTitle: string;
    videoID: string;
}

const editVideo = ({
    videoID,
    classes,
    videoUrl,
    telestrationStateMgr,
    videoTitle,
    localStateMgr,
}: IProps) => {
    // const [previousMode, setPreviousMode] = useState<EditMode>('default');
    const { state, dispatchAction } = telestrationStateMgr;
    const {
        // relativeCurrentVideoTime,
        totalTimeTrackStoped,
    } = state;
    const { state: localState } = localStateMgr;

    const {
        recording: {
            animationCanvasRef,
            cursorCanvasRef,
            recordingCanvasRef,
            videoRef,
        },
    } = state;

    const sizeCanvases = () => {
        if (
            videoRef.current &&
            animationCanvasRef.current &&
            cursorCanvasRef.current &&
            recordingCanvasRef.current &&
            videoRef.current.videoHeight > 0 &&
            videoRef.current.videoWidth > 0
        ) {
            const outerRect = {
                height: window.innerHeight - (40 + 200), // height of controls (telestration + play)
                width:
                    window.innerWidth -
                    (localState.leftSideMenuOpen ? 240 : 72), // width of left side menu
            };

            const innerRect = {
                height: videoRef.current.videoHeight,
                width: videoRef.current.videoWidth,
            };

            const dimensions = maxRect({ outerRect, innerRect });

            animationCanvasRef.current.height = dimensions.height;
            animationCanvasRef.current.width = dimensions.width;
            cursorCanvasRef.current.height = dimensions.height;
            cursorCanvasRef.current.width = dimensions.width;
            recordingCanvasRef.current.height = dimensions.height;
            recordingCanvasRef.current.width = dimensions.width;
            videoRef.current.height = dimensions.height;
            videoRef.current.width = dimensions.width;
            state.overlays.map((overlay) =>
                drawImgToCanvas(animationCanvasRef, overlay)
            );
        }
    };

    const draw = () => {
        clearCanvas(animationCanvasRef);
        state.overlays.map((overlay) =>
            drawImgToCanvas(animationCanvasRef, overlay)
        );
    };

    const handleVideoLoad = () => {
        if (videoRef.current) {
            dispatchAction(setVideoLoaded());
            sizeCanvases();
        }
    };

    const setVideoPlayListener = () => {
        const { current } = videoRef;

        if (current) {
            const setDefaultMode = () => {
                // setPreviousMode(state.editMode);
                // dispatchAction(VideoPlayAction());
            };
            current.addEventListener('play', setDefaultMode);
            return () => current.removeEventListener('play', setDefaultMode);
        }

        return undefined;
    };

    const setVideoPauseListener = () => {
        const { current } = videoRef;

        if (current) {
            const previousModeListener = () => {
                // dispatchAction(VideoStopAction());
            };

            current.addEventListener('pause', previousModeListener);
            return () =>
                current.removeEventListener('pause', previousModeListener);
        }

        return undefined;
    };

    // const clearTelestrationOnExit = () => {
    //     dispatchAction(setModeAction('default'));
    //     // necessary for playing video on iPad
    //     if (videoRef.current) {
    //         const playPromise = videoRef.current.play();
    //         if (playPromise !== undefined) {
    //             playPromise.then((_) => {
    //                 if (videoRef.current) {
    //                     videoRef.current.pause();
    //                     videoRef.current.muted = false;
    //                 }
    //             });
    //         }
    //     }
    //     sendUserEvent(telestrationMounted, window.location.href, videoID);
    // };

    // Set canvas size
    useEffect(draw);
    useEffect(setVideoPlayListener);
    useEffect(setVideoPauseListener);
    // useEffect(clearTelestrationOnExit, []);

    const modeToClasses = {
        circle: classes.mouseCircle,
        arrow: classes.mouseArrow,
    };

    const extraRootClasses =
        (state.editMode && modeToClasses[state.editMode]) || '';

    const canvasClasses = `${classes.canvas} ${
        state.editMode === 'default'
            ? classes.canvasPlayMode
            : classes.canvasEditMode
    }`;

    const handleCanvasClick = canvasClickHandler({
        telestrationStateMgr,
        canvasRef: animationCanvasRef,
        videoRef,
    });

    const onCanvasMouseDrag = (mouseMode: 'down' | 'up') => (
        e: React.MouseEvent<HTMLElement>
    ) => {
        canvasMouseDownUpHandler({
            mouseMode,
            e,
            canvasRef: animationCanvasRef,
            videoRef,
            telestrationStateMgr,
        });
    };

    const keyDownHandler = (event: any) => {
        if (event.key === 'Escape') {
            dispatchAction(setModeAction('save_effect'));
        }
    };

    const clickVideoBoxHandler = (e: any) => {
        dispatchAction(clickVideoBox(e));
    };
    const { videoSize } = state;

    const videoTickListener = (time: number) => {
        dispatchAction(VideoTickAction(time));
    };

    useEffect(() => {
        const { current: video } = videoRef;
        if (video) {
            totalTimeTrackStoped ? video.pause() : video.play();
        }
    }, [totalTimeTrackStoped]);

    return (
        <Box
            className={classes.container}
            tabIndex={0}
            onKeyDown={keyDownHandler}
        >
            <Box
                className={clsx(classes.root, extraRootClasses)}
                style={{ maxHeight: '80%' }}
                onMouseDown={clickVideoBoxHandler}
            >
                <canvas
                    className={clsx(classes.easyChangeSize, canvasClasses)}
                    onMouseDown={onCanvasMouseDrag('down')}
                    onMouseUp={onCanvasMouseDrag('up')}
                    onClick={handleCanvasClick}
                    ref={animationCanvasRef}
                />
                <canvas
                    className={clsx(classes.easyChangeSize, canvasClasses)}
                    ref={cursorCanvasRef}
                />
                <PureVideo
                    className={classes.easyChangeSize}
                    src={videoUrl}
                    videoRef={videoRef}
                    onError={(message: string) =>
                        dispatchAction(setVideoLoadError(message))
                    }
                    handleVideoLoad={handleVideoLoad}
                    videoTickListener={videoTickListener}
                />
                <RecordingCanvas
                    animationCanvasRef={animationCanvasRef}
                    cursorCanvasRef={cursorCanvasRef}
                    recordingCanvasRef={recordingCanvasRef}
                    videoRef={videoRef}
                    height={videoSize.height}
                    width={videoSize.width}
                    telestrationStateMgr={telestrationStateMgr}
                />
            </Box>
            <TelestrationControls videoID={videoID} />
            <PlayControls
                videoRef={videoRef}
                videoTitle={videoTitle}
                state={state}
            />
        </Box>
    );
};

export const EditVideo = compose(
    withLocalState,
    withTelestrationState,
    withStyles(styles)
)(editVideo);
