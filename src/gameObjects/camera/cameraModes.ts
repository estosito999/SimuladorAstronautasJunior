export type CameraAction = 'reset' | 'left' | 'right' | 'in' | 'out';
export type CameraMode = 'overview' | 'follow' | 'control' | 'iss';

export interface CameraCommand {
  id: number;
  action: CameraAction;
}

export const CAMERA_PRESETS = {
  overview: {
    position: [21, 18, 26] as [number, number, number],
    target: [0, 0.6, 1] as [number, number, number],
  },
  control: {
    position: [16, 12, -1] as [number, number, number],
    target: [0, 3.5, -9.2] as [number, number, number],
  },
  iss: {
    position: [-22, 24, -36] as [number, number, number],
    target: [-28, 22, -50] as [number, number, number],
  },
};
