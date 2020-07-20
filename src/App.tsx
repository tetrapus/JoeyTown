import React from "react";
import {
  Scene,
  WebGLRenderer,
  OrthographicCamera,
  HemisphereLight,
  DirectionalLight,
  Color,
  Fog,
  MeshStandardMaterial,
  MeshPhysicalMaterial,
  BoxGeometry,
  TextureLoader,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import "./App.scss";
import grassTextureImg from "./textures/grass.jpg";
import { Mesh } from "three/src/objects/Mesh";

const TileDiameter = 3;
const TileGap = 0.2;
const TilePadding = 0.4;
const BuildingHeight = 1 / 30;

const mapDistanceToInternal = (distance: number) => {
  return (TileDiameter + TileGap) * distance;
};

const grassTexture = new TextureLoader().load(grassTextureImg);

class App extends React.Component<{}> {
  townCanvas: React.RefObject<HTMLCanvasElement>;
  animationToken?: number;
  camera: any;
  controls: any;
  scene: Scene;
  renderer: any;

  constructor(props: {}) {
    super(props);
    this.townCanvas = React.createRef();
    this.scene = new Scene();
  }

  componentDidMount() {
    const canvas = this.townCanvas.current;
    const context = canvas?.getContext("webgl2");
    if (!canvas || !context) {
      return;
    }
    const canvasBoundingRect = canvas.getBoundingClientRect();
    const aspect = canvasBoundingRect.width / canvasBoundingRect.height;
    const d = 20;

    this.renderer = this.setUpRenderer(
      canvas,
      context,
      canvasBoundingRect
    ).renderer;
    document.body.appendChild(VRButton.createButton(this.renderer));
    const res = this.setupCamera(aspect, d, this.scene, this.renderer);
    this.camera = res.camera;
    this.controls = res.controls;
    this.setupLighting(this.scene);
    this.scene.background = new Color("#87CEEB");
    this.scene.fog = new Fog(0xffffff, 0, 200);
    this.scene.scale.set(0.5, 0.5, 0.5);

    this.setRegion({
      tiles: [...Array(16 * 16).keys()].map((num) => ({
        coordinates: {
          x: (num % 16) - 16 / 2,
          y: Math.floor(num / 16) - 16 / 2,
        },
      })),
    });
    this.renderer.setAnimationLoop(() => this.animate());
  }

  componentWillUnmount() {
    if (this.animationToken) {
      cancelAnimationFrame(this.animationToken);
    }
  }

  setRegion(region: any) {
    region.tiles.forEach((tile: any, idx: number) => {
      const material = new MeshStandardMaterial({
        color: "#eeeeee",
      });
      /*
      if (tile.population) {
        const height = mapPopulationToDensity(tile.population, tile.zone);
        let cube;
        let geometry;
        if (tile.zone == Zone.Commercial && height > 5) {
          let heightCut = (0.5 + Math.random() / 2) * height;
          geometry = new BoxGeometry(
            TileDiameter - TilePadding * 2,
            heightCut + 0.1,
            TileDiameter - TilePadding * 2
          );
          cube = new Mesh(geometry, material);
          let geometryC = new BoxGeometry(
            TileDiameter - TilePadding * 4,
            height - heightCut + 0.1,
            TileDiameter - TilePadding * 4,
          );
          let cubeC = new Mesh(geometryC, material);
          scene.add(cubeC);
          active.push(cubeC);
          cubeC.translateX(mapDistanceToInternal(tile.coordinates.x));
          cubeC.translateZ(mapDistanceToInternal(tile.coordinates.y));
          cubeC.translateY((height - heightCut) / 2 + heightCut);
  
          scene.add(cube);
          active.push(cube);
          cube.translateX(mapDistanceToInternal(tile.coordinates.x));
          cube.translateZ(mapDistanceToInternal(tile.coordinates.y));
          cube.translateY(heightCut / 2);
        } else {
          const geometry = new BoxGeometry(
            TileDiameter - TilePadding * 2,
            height + 0.1,
            TileDiameter - TilePadding * 2
          );
          cube = new Mesh(geometry, material);
  
          scene.add(cube);
          active.push(cube);
          cube.translateX(mapDistanceToInternal(tile.coordinates.x));
          cube.translateZ(mapDistanceToInternal(tile.coordinates.y));
          cube.translateY(height / 2);
        }
      } */
      // Add the base for the tile
      const baseMeshMaterial = new MeshPhysicalMaterial({
        map: grassTexture,
      });
      const base = new Mesh(
        new BoxGeometry(TileDiameter, 0.1, TileDiameter),
        baseMeshMaterial
      );
      this.scene.add(base);
      // active.push(base);
      base.translateX(mapDistanceToInternal(tile.coordinates.x));
      base.translateZ(mapDistanceToInternal(tile.coordinates.y));
    });
  }

  animate(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  setupCamera(
    aspect: number,
    d: number,
    scene: Scene,
    renderer: any
  ): { camera: any; controls: any } {
    const camera = new OrthographicCamera(
      -d * aspect,
      d * aspect,
      d,
      -d,
      1,
      1000
    );
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.005;
    controls.screenSpacePanning = false;
    controls.minDistance = 100;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 2;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    camera.position.set(50, 50, 50);
    camera.lookAt(scene.position);
    controls.update();

    return {
      camera,
      controls,
    };
  }

  setUpRenderer(
    canvas: HTMLCanvasElement,
    context: WebGL2RenderingContext,
    canvasBoundingRect: DOMRect
  ): { renderer: any } {
    const renderer = new WebGLRenderer({
      canvas,
      context,
    });

    // Fix for retina
    renderer.setPixelRatio(2);

    renderer.setSize(canvasBoundingRect.width, canvasBoundingRect.height);
    renderer.xr.enabled = true;

    return {
      renderer,
    };
  }

  setupLighting(scene: Scene) {
    const sunlight = 0xffffff;
    var light = new HemisphereLight(sunlight, sunlight, 1);
    scene.add(light);

    var dirLight = new DirectionalLight(sunlight, 0.5);
    dirLight.position.multiplyScalar(500);
    dirLight.position.setX(150);
    scene.add(dirLight);
  }

  render() {
    return <canvas ref={this.townCanvas} className="TownCanvas"></canvas>;
  }
}

export default App;
