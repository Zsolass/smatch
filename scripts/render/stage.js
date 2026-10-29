// Shared three.js studio: renderer, environment lighting, soft ground shadow.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export function createStage({ width, height, fov = 30, exposure = 0.85, envIntensity = 0.55 }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = envIntensity;

  const camera = new THREE.PerspectiveCamera(fov, width / height, 1, 2000);

  const key = new THREE.DirectionalLight(0xfff4e8, 2.6);
  key.position.set(-40, 80, 60);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 12;
  key.shadow.blurSamples = 20;
  key.shadow.bias = -0.0005;
  const cam = key.shadow.camera;
  cam.left = -80; cam.right = 80; cam.top = 80; cam.bottom = -80; cam.near = 1; cam.far = 400;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xd8f1f2, 1.4);
  rim.position.set(60, 40, -70);
  scene.add(rim);

  const fill = new THREE.HemisphereLight(0xffffff, 0x8a979c, 0.25);
  scene.add(fill);

  function ground(y = 0, opacity = 0.18, size = 400) {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.ShadowMaterial({ opacity }));
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = y;
    plane.receiveShadow = true;
    scene.add(plane);
    return plane;
  }

  function render() {
    renderer.render(scene, camera);
    return renderer.domElement.toDataURL("image/png");
  }

  return { THREE, renderer, scene, camera, key, rim, fill, ground, render };
}

export function ceramicMaterial(THREE, extra = {}) {
  return new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.34,
    clearcoat: 0.55,
    clearcoatRoughness: 0.22,
    sheen: 0.35,
    sheenColor: new THREE.Color(0xfff6ea),
    sheenRoughness: 0.5,
    specularIntensity: 0.6,
    ...extra,
  });
}
