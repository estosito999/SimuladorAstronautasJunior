import type { Group, Mesh, Object3D, SpotLight, MeshPhongMaterial, Texture } from 'three';
export interface LunarERoverModel {
  group: Group;
  wheels: Mesh[];
  panels: { leftPanelPivot: Group; rightPanelPivot: Group };
  antennaPivot: Group;
  arm: {
    shoulder: Group; elbow: Group; wrist: Group;
    leftFingerPivot: Group; rightFingerPivot: Group;
    targets: Record<string, number>;
  };
  headlights: {
    leftHeadlight: SpotLight; rightHeadlight: SpotLight;
    leftLensMaterial: MeshPhongMaterial; rightLensMaterial: MeshPhongMaterial;
  };
}
export function createRover(scene: Object3D, textures?: { metalTexture?: Texture; wheelTexture?: Texture; wheelBumpMap?: Texture }): LunarERoverModel;
export function updateRover(model: LunarERoverModel, state: { panelsOpen: boolean; gripperOpen: boolean; keys: Record<string, boolean> }, dt: number): void;
