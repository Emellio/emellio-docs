import { Device, IODevice } from "./device"

/** 
    ## Capabilities

    Cameras have different color frequency ranges, number of channels, available resolutions, and available frames per second (FPS).
*/
export class CameraDevice extends Device {
    cameraCapabilities: CameraCapabilities | undefined
    constructor(public cameraConfiguration: CameraConfiguration) {
        super()
    }
    // GetImage should always return an image, unless
    // something went unexpectedly wrong. It blocks for
    // the tiny amount of time it takes to capture.
    getImage(
        channels: 'bw' | 'rgb',
        resolution: { w: number, h: number }
    ): {
        error?:
        // Error when a request was made which is not
        // permitted in the given camera capabilities.
        | { code: 'notCapable', reason: string }
        // Generic error
        | { code: 'unknown', reason: string },
        result?: {
            format: 'png' | 'jpg'
            data: Buffer
        }
    } {
        return {}
    }

    // StartVideo begins the recording of a video.
    // It will later publish an event "videoRecorded"
    // with the given eventId.
    startVideo(
        eventId: string,
        channels: 'bw' | 'rgb',
        resolution: { w: number, h: number },
        fps: number,
        durationSeconds: number
    ): {
        error?: { code: 'unknown', reason: string },
        result?: {}
    } {
        return {}
    }
    event(eventData: CameraEvent) {
    }
}

export type CameraCapabilities = {
    channels: 'bw' | 'rgb'
    imageResolutions: {
        w: number | { min: number, max: number }
        h: number | { min: number, max: number }
    }[]
    videoResolutions: {
        w: number | { min: number, max: number }
        h: number | { min: number, max: number }
    }[]
    videoFps: (number | { min: number, max: number })[]
}

export type CameraConfiguration = {
    motionDetection?: {
        // A 2D grid of cells spanning the image.
        // Sensitivity 1 is highest, 0 is never trigger
        cells: { sensitivity: number }[][]
    }
}

export type CameraEvent = undefined
    | {
        event: 'motionDetected'
        // Which cell triggered
        cell: { x: number, y: number }
        // How strong was the motion, between 0 and 1
        strength: number
        image: {
            format: 'png' | 'jpg'
            data: Buffer
        }
    }
    | {
        event: 'videoRecorded'
        startTimestamp: number
        durationSeconds: number
        format: 'mp4'
        data: Buffer
    }

