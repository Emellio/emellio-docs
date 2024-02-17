interface Error {
    name: string;
    message: string;
    stack?: string;
}

/**
 * 
### Emellio Device
In Emellio, a “Device” is a computer capable of performing some work in the system. These are:
 
- Input/output devices (sensors and actuators)
- Compute devices (Runs AI and other compute heavy tasks)
- Controller devices (Runs Node RED)

A single device can perform one or multiple of these tasks. A device capable of input/output is called an “Input/output device”, a device capable of executing compute workloads is called a “Compute device”, and a device running Node-RED is called a “Controller device”.
*/
class Device {
    /**
Each device has a hardware-specific device ID. It is randomly generated once and stored on disk inside the device. This ensures that a single device can continue operating after an outage or if it is moved. The device ID cannot be modified.
     */
    id = '5fec7270-ca92-4fb9-aef1-8620cab507c6'
    /**
Along with the device ID, it also has a name, which also is stored on the device itself. This name can be modified. In general, the device ID is not visible in the user interface, but the device name is.     */
    name = ''
    /** @event Something bad just happened */
    error(error: Error) {

    }
}

/** */
class Sensor extends Device {
}

/** */
class Actuator extends Sensor {
}

/**
## Overview

A device which is capable of sensing or actuating is called an “Input/output device”, or “I/O devices“. These are responsible for interactions with the outside world. Sensors such as cameras and microphones provide data to Node RED, while actuators such as lights, speakers, alarms and machines allow for task automation.

Sensors and actuators are combined into a single class called input/output devices. Some input/output devices only allow sensing, while others allow both sensing and acting.

In strict terms, an “Input/Output” device is different from a “Sensor/actuator”, in that an input/output device can have one or many sensors/actuators.

(Would be nice with a term for “sensor/actuator”)

In general, code for input/output devices needs to be written for each different type of sensor. We should probably have an SDK of sorts, which makes it easy to write the code for a new type of device.

## I/O configuration

### “I/O capabilities”

In general, an input/output device is configured outside of Node-RED, in a custom user interface. In some special cases, it is possible to do minor configuration in Node RED. All devices have a list called “I/O capabilities”, which can be fetched by other devices over a standardized protocol. The capabilities can change at any time, so other devices should be able to subscribe to changes in capabilities and react accordingly. Changes in capabilities can for example occur if a connected USB microphone is unplugged from a Raspberry PI.

An “Input/output device” is defined as a device that has non-empty capabilities.

Example capabilites:

[{ “id”: “123“, “type”: “camera“ }, { “id: 456“, “type”: “speaker” }] }

### “Sensor/actuator ID” (lack a better term for sensor/actuator)

This is the “id” field in the JSON above.

Each I/O device can have multiple ways to sense and actuate. Each of these methods has an associated identifier. These are unique - it can only have the same ID if it is certain that it is the same sensor/actuator. The device will to the best to keep track of these IDs, but it may not always be possible. For example, if a USB microphone is moved from one USB port to another, it may be impossible for the device to know that it is the same physical microphone. In this case, it must create a new identifier for it. The sensor/actuator IDs are part of the list of capabilities.

### “Sensor/actuator type”

Each sensor/actuator on an input/output device has a specified “type”. This type is reported by the device, and cannot be changed manually.

Types include:

- Camera
- Microphone
- Light
- Button
- Analog (scalar value)
- Generic

## Connection to Node-RED

Each of the “sensor/actuator types” have an associated node in Node-RED.

The generic node allows for very little configuration, but allows for the device to send any binary data to Node RED.

## Sensors are both read on request and event-based

Sensors can be read using a request (similar to GET). On read, they can either return a value, block until a value is ready and return it then, or not return a value and say that there is none. It is also possible to tell a sensor to “start a measurement”, and the sensor will output an event when the measurement is done. This makes sense for microphones.

A sensor can also publish events even though a measurement has not been started, for example for physical buttons or for motion detection.

## I/O devices that are not capable of generic computations

Some I/O sensors and actuators, such as FLIR cameras, are not capable of running generic computations. They therefore cannot communicate with the rest of Emellio in a standardized way. Instead, it must be connected to a device which is capable of generic computations and can communicate with a controller device (Node RED). In this situation, the sensor/actuator is not referred to as a “device”. It is instead referred to as a “sensor connected to a device”. An “Emellio device”, in its strict definition, is one that is capable of operating with data to and from controller devices (Node RED).

When you think about it, this is actually true for all sensors and actuators. For example, take a smartphone camera. The camera itself is not a device - it is just a sensor that is connected to a device. The difference is that the camera is attached to the device, but from Emellios perspective, it does not matter if the sensor is separate from the device or not.
 */
class IODevice extends Device {
    /**
     * An input/output device can have one or many sensors/actuators
     */
    public io: Sensor[] = []
}

/** 
“Compute devices” are designated devices for running compute workloads, such as AI, in Emellio.

Any device can be a compute device. By default, a device will not be compute devices. If they were, the default would be to run on underpowered devices such as cameras and microphones, when you intend it to run on more powerful hardware somewhere else in your system.

## Compute workloads

A compute workload is a single “compute” or “AI” node in Node-RED. Each compute workload has an algorithm to execute, and settings for how it should be executed (scheduling). The algorithm to execute can be any code or AI.

The algorithm to execute is configured outside of Node-RED, in a custom user interface. Inside Node-RED, the node is placed and the algorithm is simply selected from the list of configured algorithms.

## Executables

For a compute workload to run the compute device must have the code or model to execute. This information can be specified in the user interface, for example by uploading code (Python, Javascript, etc.), uploading a precompiled binary, uploading an AI model in a supported format, or selecting a Decthings model.

Executables are stored in the controller device. For example, when a Decthings model is selected, the controller device downloads the necessary information required to execute it and stores it on disk. It also sends this information to all compute devices that may execute the workload in the future, so that all preparations are made when the workload is triggered.

## Scheduling of compute workloads

In a complex system there may be different levels of compute devices. For example, certain tasks might require GPUs, while others only require CPUs. Different tasks might require different amount of CPU and memory, and a compute device should not accept a workload if it will run out of resources.

Kubernetes has a concept of nodeSelectors, and nodeAffinity. Node selectors allow you to specify a specific node (compute device) where a workload should execute. Node affinity is more complex, where you can specify labels that the node (compute device) must have in order to run there. This could for example be labels for which datacenter the node is located in.

We should have a system where a compute device reports the number of CPUs, amount of memory, and number of GPUs it has. For each compute workload, the user specifies what resources it should be given, such as 1 CPU core, 512 MiB of memory, and 1 GPU. When the workload is executed, controller devices (Node RED) will select among the available compute devices and pick the one that has the most free resources. Controller devices will not give compute workloads to a device if this workload will cause the total amount resources to overflow. Instead, there is a queue system that allows workloads to be executed once there is available compute resources. Each compute workload is given

We could also have an “automatic mode”, where the required compute resources for a workload is automatically estimated. Many workloads will always require the same amount of resources, such as an AI that does the same thing every time.
*/
class ComputeDevice extends Device {
}

/** 
“Controller devices” run Node-RED. Depending on the nodes placed in Node-RED, the controller devices will communicate with other devices.
*/
class ControllerDevice extends Device {
}

/** 
## Capabilities

Cameras have different color frequency ranges, number of channels, available resolutions, and available frames per second (FPS).
*/
class CameraDevice extends Device {
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

type CameraCapabilities = {
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

type CameraConfiguration = {
    motionDetection?: {
        // A 2D grid of cells spanning the image.
        // Sensitivity 1 is highest, 0 is never trigger
        cells: { sensitivity: number }[][]
    }
}

type CameraEvent = undefined | {
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
