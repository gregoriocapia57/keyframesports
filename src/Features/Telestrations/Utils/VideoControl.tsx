export const updatePreview = async (time: number, video: any) => {
    if (video && video.paused) {
        const currentVolume = video.volume;
        video.volume = 0;
        await video.play();
        await video.pause();
        video.currentTime = time;
        video.volume = currentVolume;
    }
};