# Lunar-E

**Marco Nicoletti - 1707993**  

Lunar E is a Three.js scene where you can drive a rover on the Moon. You can move its arm, open the solar panels, turn on the headlights and use a free camera to look around the solar system.

## Online demo

**GitHub Pages URL:**
https://ilnicolmarco.github.io/final-project-Lunar-E/

## Using the scene

In the main menu you can choose the graphics quality, the planets to display, music and whether to show the controls, then start exploring. The settings button reopens the menu.

### Keyboard controls

| Key | Action |
| --- | --- |
| W / S | Drive forward / backward |
| A / D | Steer left / right |
| L | Turn the headlights on or off |
| P | Open or close the solar panels |
| O | Open or close the gripper |
| Q / E | Rotate the arm base |
| R / F | Raise or lower the shoulder |
| T / G | Bend or extend the elbow |
| J / K | Rotate the wrist in yaw |
| U / I | Rotate the wrist in pitch |
| X | Reset the arm pose |
| C | Toggle the follow camera |
| M | Toggle background music |
| H | Show or hide the controls legend |


Select **Free camera** to explore the scene. Left-drag rotates, right-drag pans and the wheel zooms. The on-screen arrows move the camera and its target along world X and Y. **Return to rover** leaves this mode.

Hold **PLANET TIME -10 / +10** to reverse or speed up planetary motion. This includes the Moon's orbit and rotation, but not driving or arm movement. Release the button to return to normal speed.

**Capture JPG** saves the scene as `rover-[date].jpg`, without the menu or buttons.

## Quality settings

| Setting | Low | Medium | High |
| --- | --- | --- | --- |
| Pixel ratio | 0.5 | 1 | Device pixel ratio, up to 2 |
| Local shadow map | Off | 1024 × 1024 | 2048 × 2048 |
| Earth shadow on the Moon | Off | On | On |
| Earth and Moon shadows on the rover | Off | Off | On |
| Star opacity | 0.35 | 0.7 | 1 |

Try Low if the scene runs slowly. All three settings load the same textures and models, so Low does not reduce the download size. The Moon texture and music file can make the first load slower. Music may need a click or key press before playback starts.

## Implementation

The rover is built from simple shapes. Its arm uses nested groups: moving the shoulder also moves the elbow, wrist and gripper. The animations are written in JavaScript, they are not imported.

Driving uses geometry. The rover stays at a fixed distance from the Moon's centre and turns to follow the surface. There is no physics engine. The Moon and rover share a rotation group, so the rover is carried along when the Moon spins.

The scene uses Phong materials, sunlight, ambient light and two headlights. A local shadow map draws the rover's shadows. A shader treats Earth and the Moon as spheres to approximate their shadows. This calculation also reduces direct light from the headlights.

The Moon texture and Earth map are 8K; Other planets maps are 2K. The Sun has a uniform colour without an image texture. I adjusted sizes, distances and orbital speeds to make the scene easier to explore.

## Project structure

| Path | Contents |
| --- | --- |
| `index.html` | Page and interface |
| `src/main.js` | Scene setup and animation loop |
| `src/models/` | Rover, arm and driving |
| `src/solarSystem/` | Sun, planets and Moon |
| `src/scene/` | Renderer, camera and stars |
| `src/rendering/` | Textures, lights, shadows and quality |
| `src/controls/` | Keyboard and interface controls |
| `src/styles/` | CSS |
| `assets/` | Images |
| `vendor/` | Local libraries and licence |

## External resources

- **Three.js 0.160.0 and OrbitControls:** included locally in `vendor/three/`. The MIT licence is included in `vendor/three/LICENSE`.
- **Planetary textures:** [Solar System Scope](https://edu.solarsystemscope.com/textures/), licensed under **CC BY 4.0**. The maps are used on the celestial bodies, with sizes and visual proportions adapted to the scene.
- **Mermaid:** used to prepare the documentation diagrams; it is not a runtime dependency.
- **3D models and animations:** built directly in JavaScript from geometric primitives.