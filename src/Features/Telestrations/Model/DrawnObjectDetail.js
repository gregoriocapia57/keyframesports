export class DrawnObjectDetail {
    constructor(object, currentVideoTime, id) {
        this.type = id;
        this.object = object;
        this.videoPauseDuration = {
            startTime: currentVideoTime - 1 < 0 ? 0 : currentVideoTime - 1,
            endTime: currentVideoTime + 4,
        };
        this.objectDuration = {
            startTime: currentVideoTime,
            endTime: currentVideoTime + 3,
        };
    }
    setObjectDuration = function (startT, endT) {
        this.objectDuration.startTime = startT;
        this.objectDuration.endTime = endT;
    };

    setVideoPauseDuration = function (startT, endT) {
        this.videoPauseDuration.startTime = startT;
        this.videoPauseDuration.endTime = endT;
    };
}
