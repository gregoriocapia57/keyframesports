import * as React from 'react';
import { useState } from 'react';
import { assocPath, lensProp, over, append, path } from 'ramda';
import { Lens } from 'monocle-ts';
import { compose } from 'fp-ts/lib/function';
import { dropEnd } from 'fp-ts/lib/Array';
import {
    EditMode,
    ITelestrationState,
    IAction,
    ICoordinates,
    ISetDragStateAction,
    IAddImageAction,
    IOverlayImg,
} from './Types';
import { startRecorder, stopRecorder } from './Utils/Recording';
import TelestrationManager from './Model/TelestrationManager';
import ArrowImg from './Assets/svg/keyframe_arrows_v2.svg';
import CircleImg from './Assets/svg/keyframe_cursor_v3.svg';

import {
    calculateTotalTime,
    getTeleTimeFromPercentage,
    getTelestrationTimeFromPercentage,
    getVideoTimeFromTelestrationTime,
    isPuaseTime,
} from './Utils/CalculateTime';
import { updatePreview } from './Utils/VideoControl';

const TelestrationContext = React.createContext({});

const modeToSvg = {
    arrow: {
        src: ArrowImg,
    },
    circle: {
        src: CircleImg,
    },
};

const modeToType = {
    arrow: 'overlay/Arrow',
    circle: 'overlay/Circle',
};

// ACTIONS

const SET_EDIT_MODE = 'telestrations/SET_EDIT_MODE';
const CALL_CHROMAKEY_ACTION = 'telestrations/CALL_CHROMAKEY_ACTION';
const CHANGE_TELESTRATION_COLOR = 'telestrations/CHANGE_TELESTRATION_COLOR';
const ADD_OVERLAY_IMG = 'telestrations/ADD_OVERLAY_IMG';
const SET_DRAG_STATE = 'telestrations/SET_DRAG_STATE';
const SET_VIDEO_LOAD_ERROR = 'telestrations/SET_VIDEO_LOAD_ERROR';
const SET_VIDEO_LOADED = 'telestrations/SET_VIDEO_LOADED';
const CHANGE_TEXT = 'telestrations/CHANGE_TEXT';
const CHANGE_FONT_SIZE = 'telestrations/CHANGE_FONT_SIZE';
const CHANGE_TEXT_COLOR = 'telestrations/CHANGE_TEXT_COLOR';
const CHANGE_TEXT_BACKGROUND_COLOR =
    'telestrations/CHANGE_TEXT_BACKGROUND_COLOR';
const SAVE_TEXT_BOX = 'telestrations/SAVE_TEXT_BOX';
const CLICK_VIDEO_BOX = 'telestrations/CLICK_VIDEO_BOX';
const TELESTRATION_PLAY = 'telestrations/TELESTRATION_PLAY';
const TELESTRATION_STOP = 'telestrations/TELESTRATION_STOP';
const RELATIVE_CURRENT_TIME_CHANGE =
    'telestrations/RELATIVE_CURRENT_TIME_CHANGE';
const VIDEI_TIME_ACTION = 'telestrations/VIDEI_TIME_ACTION';
const CHANGE_OBJECT_DURATION_ACTION =
    'telestrations/CHANGE_OBJECT_DURATION_ACTION';
const CHANGE_OBJECT_VIDEO_STOP_DURATION_ACTION =
    'telestrations/CHANGE_OBJECT_VIDEO_STOP_DURATION_ACTION';
const TELESTRATION_PERCENTAGE_CHANGE_ACTION =
    'telestrations/TELESTRATION_PERCENTAGE_CHANGE_ACTION';
const TELESTRATION_PERCENTAGE_COMMITTED_ACTION =
    'telestrations/TELESTRATION_PERCENTAGE_COMMITTED_ACTION';
const TELESTRATION_SIZE_CHANGE_ACTION =
    'telestrations/TELESTRATION_SIZE_CHANGE_ACTION';
const TELESTRATION_PERSPECTIVE_CHANGE_ACTION =
    'telestrations/TELESTRATION_PERSPECTIVE_CHANGE_ACTION';

// ACTION CREATORS

export const setModeAction = (
    editMode: EditMode,
    setHint?: (hint: string) => void
) => ({
    type: SET_EDIT_MODE as 'telestrations/SET_EDIT_MODE',
    editMode,
    setHint,
});

export const callChromakeyAction = (action: string) => ({
    type: CALL_CHROMAKEY_ACTION as 'telestrations/CALL_CHROMAKEY_ACTION',
    action,
});

export const changeTelestrationColor = (color: string) => ({
    type: CHANGE_TELESTRATION_COLOR as 'telestrations/CHANGE_TELESTRATION_COLOR',
    color,
});

export const changeText = (text: string) => ({
    type: CHANGE_TEXT as 'telestrations/CHANGE_TEXT',
    text,
});

export const changeFontSize = (fontSize: number) => ({
    type: CHANGE_FONT_SIZE as 'telestrations/CHANGE_FONT_SIZE',
    fontSize,
});

export const changeTextColor = (textColor: string) => ({
    type: CHANGE_TEXT_COLOR as 'telestrations/CHANGE_TEXT_COLOR',
    textColor,
});

export const changeTextBackgroundColor = (backgroundColor: string) => ({
    type: CHANGE_TEXT_BACKGROUND_COLOR as 'telestrations/CHANGE_TEXT_BACKGROUND_COLOR',
    backgroundColor,
});

export const saveTextBox = () => ({
    type: SAVE_TEXT_BOX as 'telestrations/SAVE_TEXT_BOX',
});

export const addImageAction = (
    coordinates: { x: number; y: number },
    editMode: EditMode,
    videoTime: number
): IAddImageAction => ({
    type: 'telestrations/ADD_OVERLAY_IMG' as 'telestrations/ADD_OVERLAY_IMG',
    overlayImg: {
        svg: modeToSvg[editMode],
        type: modeToType[editMode],
        coordinates,
        createdAt: new Date(),
        video: {
            createdAt: videoTime,
        },
    },
});

export const setDragStateAction = (
    dragState: 'start' | 'end',
    coordinates: ICoordinates,
    editMode: EditMode,
    videoTime: number
): ISetDragStateAction => {
    if (dragState === 'start') {
        return {
            type: SET_DRAG_STATE as 'telestrations/SET_DRAG_STATE',
            coordinates,
            dragMode: 'start' as 'start',
            editMode,
            videoTime,
        };
    } else {
        return {
            type: SET_DRAG_STATE as 'telestrations/SET_DRAG_STATE',
            coordinates,
            dragMode: 'end' as 'end',
            editMode,
            videoTime,
        };
    }
};

export const setVideoLoadError = (message: string) => ({
    type: SET_VIDEO_LOAD_ERROR as 'telestrations/SET_VIDEO_LOAD_ERROR',
    message,
});

export const setVideoLoaded = () => ({
    type: SET_VIDEO_LOADED as 'telestrations/SET_VIDEO_LOADED',
});

export const clickVideoBox = (e: any) => ({
    type: CLICK_VIDEO_BOX as 'telestrations/CLICK_VIDEO_BOX',
    event: e,
});

export const TelestrationPlayAction = () => ({
    type: TELESTRATION_PLAY as 'telestrations/TELESTRATION_PLAY',
});

export const TelestrationStopAction = () => ({
    type: TELESTRATION_STOP as 'telestrations/TELESTRATION_STOP',
});

export const RelativeCurrentTimeChangeAction = (time: number) => ({
    type: RELATIVE_CURRENT_TIME_CHANGE as 'telestrations/RELATIVE_CURRENT_TIME_CHANGE',
    time,
});

export const VideoTickAction = (time: number) => ({
    type: VIDEI_TIME_ACTION as 'telestrations/VIDEI_TIME_ACTION',
    time,
});

export const ChangeObjectDurationAction = (
    object: any,
    timeArray: number[]
) => ({
    type: CHANGE_OBJECT_DURATION_ACTION as 'telestrations/CHANGE_OBJECT_DURATION_ACTION',
    object,
    timeArray,
});

export const IChangeObjectVideoStopDurationAction = (
    object: any,
    timeArray: number[]
) => ({
    type: CHANGE_OBJECT_VIDEO_STOP_DURATION_ACTION as 'telestrations/CHANGE_OBJECT_VIDEO_STOP_DURATION_ACTION',
    object,
    timeArray,
});

export const ITelestrationPercentateChangeAction = (percentage: number) => ({
    type: TELESTRATION_PERCENTAGE_CHANGE_ACTION as 'telestrations/TELESTRATION_PERCENTAGE_CHANGE_ACTION',
    percentage,
});

export const ITelestrationPercentateCommittedAction = (percentage: number) => ({
    type: TELESTRATION_PERCENTAGE_COMMITTED_ACTION as 'telestrations/TELESTRATION_PERCENTAGE_COMMITTED_ACTION',
    percentage,
});

export const ITelestrationSizeChangeAction = (value: number) => ({
    type: TELESTRATION_SIZE_CHANGE_ACTION as 'telestrations/TELESTRATION_SIZE_CHANGE_ACTION',
    value,
});

export const ITelestrationPerspectiveChangeAction = (value: number) => ({
    type: TELESTRATION_PERSPECTIVE_CHANGE_ACTION as 'telestrations/TELESTRATION_PERSPECTIVE_CHANGE_ACTION',
    value,
});

// REDUCER

type ITelestrationStateFn = (x: any) => ITelestrationState;

type ReducerResult = ITelestrationState | ITelestrationStateFn;

const telestrationReducer = (
    state: ITelestrationState,
    action: IAction
): ReducerResult => {
    console.log(action);
    switch (action.type) {
        case SET_VIDEO_LOAD_ERROR: {
            const { message } = action;
            return Lens.fromProp<ITelestrationState>()('videoLoadError').set(
                message
            )(state);
        }
        case SET_EDIT_MODE: {
            const { editMode } = action;
            const newState = {
                ...state,
                editMode,
            };
            switch (editMode) {
                case 'save_effect': {
                    state.telestrationManager.setLiveModeFunction();
                    return newState;
                }
                case 'default': {
                    state.telestrationManager.clearTelestrations();
                    state.telestrationManager.setLiveModeFunction();
                    calculateTotalTime(state);
                    return {
                        ...state,
                        editMode,
                        overlays: [],
                    };
                }
                case 'undo': {
                    state.telestrationManager.triggerUndo();
                    const overlayLens = Lens.fromProp<ITelestrationState>()(
                        'overlays'
                    );
                    calculateTotalTime(state);
                    return overlayLens.modify((a) => dropEnd(1, a))(state);
                }
                case 'record': {
                    if (!state.recording.recordingActive) {
                        state.telestrationManager.setRecordingMode(true);
                        startRecorder(
                            state.recording.recordingCanvasRef,
                            action.setHint
                        );
                        return Lens.fromPath<ITelestrationState>()([
                            'recording',
                            'recordingActive',
                        ]).set(true)(state);
                    }
                }
                case 'stop_recording': {
                    state.telestrationManager.setRecordingMode(false);
                    stopRecorder();
                    /* tslint:disable-next-line */
                    window['STOP_KEY_LISTENERS'] = true;
                    return Lens.fromPath<ITelestrationState>()([
                        'recording',
                        'recordingActive',
                    ]).set(false);
                }
                case 'selectshape': {
                    state.telestrationManager.selectShape();
                    return newState;
                }
                case 'arrow': {
                    state.telestrationManager.setPlaceArrowFunction();
                    return newState;
                }
                case 'circle': {
                    state.telestrationManager.setPlaceCursorFunction();
                    return newState;
                }
                case 'freearrow': {
                    state.telestrationManager.setPlaceFreeArrowFunction();
                    return newState;
                }
                case 'chromakey': {
                    state.telestrationManager.setChromaKeySettingsFunction();
                    return {
                        ...newState,
                        chromakeyApplied: false,
                    };
                }
                case 'lightshaft': {
                    state.telestrationManager.setPlaceLightShaftFunction();
                    return newState;
                }
                case 'polygon_t': {
                    state.telestrationManager.setPlacePolygonFunction();
                    return newState;
                }
                case 'linkedcursor': {
                    state.telestrationManager.setPlaceLinkedCursorFunction();
                    return newState;
                }
                case 'playercutout': {
                    state.telestrationManager.setPlayerCutOutFunction();
                    return newState;
                }
                case 'straightarrow': {
                    state.telestrationManager.setPlaceStraightArrowFunction();
                    return newState;
                }
                case 'textbox': {
                    state.telestrationManager.setPlaceTextBoxFunction();
                    return newState;
                }
                default:
                    return newState;
            }

            throw Error(`Edit mode ${editMode} not handled.`);
        }
        case CALL_CHROMAKEY_ACTION: {
            const { action: act } = action;

            if (act === 'undo') {
                state.telestrationManager.undoChromaKey();
            } else if (act === 'clear') {
                state.telestrationManager.resetChromaKey();
            } else if (act === 'save') {
                // return to regular telestration mode
                state.telestrationManager.setLiveModeFunction();
                return {
                    ...state,
                    chromakeyApplied: true,
                    editMode: 'default' as 'default',
                };
            }
            return state;
        }
        case CHANGE_TELESTRATION_COLOR: {
            const { color } = action;
            state.telestrationManager.setTelestrationColor(color);

            const newState = {
                ...state,
            };

            return newState;
        }
        case CHANGE_TEXT: {
            const { text } = action;
            state.telestrationManager.setTelestrationText(text);
            return state;
        }
        case CHANGE_FONT_SIZE: {
            const { fontSize } = action;
            state.telestrationManager.setTelestrationFontSize(fontSize);
            return state;
        }
        case CHANGE_TEXT_COLOR: {
            const { textColor } = action;
            state.telestrationManager.setTelestrationTextColor(textColor);
            return state;
        }
        case CHANGE_TEXT_BACKGROUND_COLOR: {
            const { backgroundColor } = action;
            state.telestrationManager.setTelestrationBackgroundColor(
                backgroundColor
            );
            return state;
        }
        case SAVE_TEXT_BOX: {
            state.telestrationManager.saveTextBox();
            return state;
        }
        case ADD_OVERLAY_IMG: {
            const { overlayImg } = action;
            const newState = {
                ...state,
                overlays: [...state.overlays, overlayImg],
            };
            return newState;
        }
        case SET_DRAG_STATE: {
            const { dragMode, editMode, coordinates, videoTime } = action;
            if (dragMode === 'start') {
                const newState = compose(
                    assocPath(['dragState', 'mode'], editMode),
                    assocPath(['dragState', 'startCoordinates'], coordinates)
                )(state);

                return newState as ITelestrationState;
            } else if (dragMode === 'end') {
                const start = path(
                    ['dragState', 'startCoordinates'],
                    state
                ) as ICoordinates;
                const arrowDrawing: IOverlayImg = {
                    type: 'overlay/Arrow',
                    createdAt: new Date(),
                    video: {
                        createdAt: videoTime,
                    },
                    coordinates: {
                        start,
                        end: coordinates,
                    },
                } as IOverlayImg;
                const newState = compose(
                    over(lensProp('overlays'), append(arrowDrawing)),
                    assocPath(['dragState', 'mode'], editMode),
                    assocPath(['dragState', 'endCoordinates'], coordinates)
                )(state);

                return newState as ITelestrationState;
            }
        }
        case SET_VIDEO_LOADED: {
            if (videoRef.current) {
                state.totalTelestrationDuration = videoRef.current.duration;
            }
            return Lens.fromProp<ITelestrationState>()('videoLoading').set(
                false
            )(state);
        }
        case CLICK_VIDEO_BOX: {
            state.telestrationManager.onclick(
                action.event,
                state.telestrationTime
            );

            calculateTotalTime(state);

            const newState = {
                ...state,
            };
            return newState;
        }
        case TELESTRATION_PLAY: {
            state.telestrationManager.setLiveModeFunction();

            const newState = {
                ...state,
                telestrationTimeTrackStoped: false,
            };
            return newState;
        }
        case TELESTRATION_STOP: {
            state.telestrationManager.setLiveModeFunction();
            const newState = {
                ...state,
                telestrationTimeTrackStoped: true,
            };
            return newState;
        }
        case RELATIVE_CURRENT_TIME_CHANGE: {
            const newState = {
                ...state,
                telestrationTime: action.time,
            };
            return newState;
        }
        case VIDEI_TIME_ACTION: {
            const {
                videoPauseArray,
                telestrationTime,
                totalTelestrationDuration,
            } = state;
            const { current: video } = videoRef;
            const newTelestrationTime = telestrationTime + 0.2;
            if (newTelestrationTime >= totalTelestrationDuration) {
                if (video) {
                    video.pause();
                    video.currentTime = 0;
                    state.telestrationTimeTrackStoped = true;
                    state.telestrationTime = 0;
                }
            } else {
                if (isPuaseTime(newTelestrationTime, videoPauseArray)) {
                    if (video && !video.paused) {
                        video.pause();
                    }
                } else if (video && video.paused) {
                    video.play();
                }
                state.telestrationTime = newTelestrationTime;
            }

            const newState = {
                ...state,
            };

            return newState;
        }
        case CHANGE_OBJECT_DURATION_ACTION: {
            const { object, timeArray } = action;

            object.setObjectDuration(timeArray[0], timeArray[1]);
            calculateTotalTime(state);
            const newState = {
                ...state,
            };

            return newState;
        }
        case CHANGE_OBJECT_VIDEO_STOP_DURATION_ACTION: {
            const { object, timeArray } = action;

            object.setVideoPauseDuration(timeArray[0], timeArray[1]);
            calculateTotalTime(state);
            const newState = {
                ...state,
            };

            return newState;
        }
        case TELESTRATION_PERCENTAGE_CHANGE_ACTION: {
            const { totalTelestrationDuration } = state;
            const { current: video } = videoRef;

            if (video) {
                if (!video.paused) {
                    video.pause();
                    // needPlay = true;
                }

                // setTimeout(() => setProgressState(value), 0);
            }
            const telestrationTime = getTelestrationTimeFromPercentage(
                action.percentage,
                totalTelestrationDuration
            );
            const newState = {
                ...state,
                telestrationTime,
            };
            return newState;
        }
        case TELESTRATION_PERCENTAGE_COMMITTED_ACTION: {
            const { totalTelestrationDuration, videoPauseArray } = state;
            const { current: video } = videoRef;

            const telestrationTime = getTeleTimeFromPercentage(
                action.percentage,
                totalTelestrationDuration
            );

            const videoTime = getVideoTimeFromTelestrationTime(
                telestrationTime,
                videoPauseArray
            );

            if (video) {
                // if (needPlay) {
                //     video.play();
                //     needPlay = false;
                // }
                video.currentTime = videoTime;
                updatePreview(videoTime, video);
            }

            const newState = {
                ...state,
                telestrationTime,
            };
            return newState;
        }
        case TELESTRATION_SIZE_CHANGE_ACTION: {
            const { telestrationManager } = state;
            telestrationManager.onSliderChangeSize(action.value);

            const newState = {
                ...state,
            };
            return newState;
        }
        case TELESTRATION_PERSPECTIVE_CHANGE_ACTION: {
            const { telestrationManager } = state;
            telestrationManager.changeZAngleSlider(action.value);

            const newState = {
                ...state,
            };
            return newState;
        }
        default: {
            throw Error(`Action not found`);
        }
    }
};

const animationCanvasRef = React.createRef<HTMLCanvasElement>();
const cursorCanvasRef = React.createRef<HTMLCanvasElement>();
const recordingCanvasRef = React.createRef<HTMLCanvasElement>();
const videoRef = React.createRef<HTMLVideoElement>();

const initialTelestrationForm = {
    title: '',
    description: '',
};

const initialTelestrationState = {
    videoPlaying: false,
    videoSize: {
        height: 432,
        width: 728,
    },
    editMode: 'default' as 'default',
    chromakeyApplied: false,
    overlays: [],
    telestrationModal: {
        fileId: '',
        form: initialTelestrationForm,
    },
    uploadQueue: {},
    recording: {
        animationCanvasRef,
        recordingCanvasRef,
        cursorCanvasRef,
        videoRef,
        recordingActive: false,
    },
    telestrationManager: new TelestrationManager(),
    videoLoadError: 'no-errors',
    videoLoading: true,
    videoPauseArray: [],
    totalTelestrationDuration: 0,
    telestrationTime: 0,
    telestrationTimeTrackStoped: true,
};

export const TelestrationStateProvider = ({ children }: any) => {
    const [state, _updateState]: [ITelestrationState, any] = useState(
        initialTelestrationState
    );
    const dispatchAction = (action: IAction) => {
        const newState = telestrationReducer(state, action);
        _updateState(newState);
    };
    const telestrationStateMgr = { state, dispatchAction };
    return (
        <TelestrationContext.Provider value={telestrationStateMgr}>
            {...children}
        </TelestrationContext.Provider>
    );
};

export const withTelestrationState = (Child: React.ComponentType<any>) => (
    props: any
) => (
    <TelestrationContext.Consumer>
        {(value) => <Child telestrationStateMgr={value} {...props} />}
    </TelestrationContext.Consumer>
);
