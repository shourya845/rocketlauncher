import * as THREE from 'three';
import { OrbitControls } from '/vendor/OrbitControls.js';

export function createFlightScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#a17884', 85, 220);
  const camera = new THREE.PerspectiveCamera(43, 1, .1, 700);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.enablePan = false;
  controls.minDistance = 11; controls.maxDistance = 65;
  controls.minPolarAngle = .08; controls.maxPolarAngle = Math.PI * .475;
  const material = (color, metalness = 0, roughness = .6) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const white = new THREE.MeshPhysicalMaterial({ color: '#f4f0e7', metalness: .3, roughness: .24, clearcoat: .55 });
  const metal = material('#b1b9be', .8, .26), navy = material('#10172b', .45, .32), gold = material('#eeb658', .65, .3);
  const yellow = material('#f7c846', .15, .48), cream = material('#f1e8d0', .1, .6);
  const lamp = new THREE.MeshBasicMaterial({ color: '#fff1b4' });
  function mesh(geometry, mat, parent = scene, x = 0, y = 0, z = 0) {
    const object = new THREE.Mesh(geometry, mat); object.position.set(x, y, z);
    object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
  }
  const box = (w, h, d, mat, parent, x = 0, y = 0, z = 0) => mesh(new THREE.BoxGeometry(w, h, d), mat, parent, x, y, z);
  function ring(radius, thickness, mat, parent, y) {
    const object = mesh(new THREE.TorusGeometry(radius, thickness, 10, 100), mat, parent, 0, y);
    object.rotation.x = Math.PI / 2; return object;
  }
  function strut(a, b, radius, mat, parent) {
    const object = mesh(new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 12), mat, parent);
    object.position.copy(a).add(b).multiplyScalar(.5);
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); return object;
  }
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vPosition; void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'varying vec3 vPosition; void main(){float h=normalize(vPosition).y;vec3 low=vec3(.87,.47,.32);vec3 mid=vec3(.34,.23,.46);vec3 high=vec3(.075,.09,.26);vec3 color=mix(low,mid,smoothstep(-.03,.24,h));color=mix(color,high,smoothstep(.18,.8,h));gl_FragColor=vec4(color,1.);}',
  });
  const sky = mesh(new THREE.SphereGeometry(290, 40, 24), skyMaterial);
  sky.castShadow = sky.receiveShadow = false;
  const environmentScene = new THREE.Scene(); environmentScene.add(new THREE.Mesh(sky.geometry, skyMaterial));
  const environment = new THREE.PMREMGenerator(renderer);
  scene.environment = environment.fromScene(environmentScene, .1).texture;
  scene.environmentIntensity = .55; environment.dispose();
  scene.add(new THREE.HemisphereLight('#bfc4e8', '#66503a', 1.5));
  const sun = new THREE.DirectionalLight('#ffd4a0', 3.6); sun.position.set(-24, 26, 18); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 95 });
  sun.shadow.normalBias = .025; scene.add(sun);
  const fill = new THREE.DirectionalLight('#8194ff', 2.3); fill.position.set(15, 20, -20); scene.add(fill);
  const frontLight = new THREE.DirectionalLight('#fff6e8', 1.8); frontLight.position.set(5, 14, 22); scene.add(frontLight);
  // Deterministic concrete texture keeps the interactive scene self-contained.
  const pixels = new Uint8Array(128 * 128 * 4); let seed = 17;
  for (let i = 0; i < pixels.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const shade = 180 + (seed >>> 24) * .06;
    pixels[i] = shade; pixels[i + 1] = shade; pixels[i + 2] = shade; pixels[i + 3] = 255;
  }
  const concrete = new THREE.DataTexture(pixels, 128, 128);
  concrete.wrapS = concrete.wrapT = THREE.RepeatWrapping; concrete.repeat.set(32, 32); concrete.needsUpdate = true;
  const ground = material('#827c72', .05, .95); ground.map = concrete; ground.bumpMap = concrete; ground.bumpScale = .018;
  mesh(new THREE.PlaneGeometry(420, 420), ground, scene, 0, -.38).rotation.x = -Math.PI / 2;
  for (let layer = 0; layer < 3; layer++) {
    const geometry = new THREE.PlaneGeometry(460, 1, 90, 1), positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i); positions.setZ(i, 0);
      positions.setY(i, i < 91 ? 6 + layer * 2 + Math.sin(x * .036 + layer) * 5 + Math.sin(x * .09 + layer * 2) * 2.4 : -4);
    }
    geometry.computeVertexNormals();
    mesh(geometry, new THREE.MeshBasicMaterial({ color: ['#342c48', '#4e3a55', '#775269'][layer], side: THREE.DoubleSide }), scene, 0, 0, -92 - layer * 28).castShadow = false;
  }
  const hangarWall = material('#625b60', .15, .82), roof = material('#202536', .35, .7), yellowTrim = material('#cf9c3d', .35, .5);
  function hangar(x, z, w, h) {
    const building = new THREE.Group(); building.position.set(x, -.38, z); scene.add(building);
    box(w, h, 9, hangarWall, building, 0, h / 2); box(w + .4, .35, 9.5, roof, building, 0, h + .15);
    box(w * .58, h * .76, .18, navy, building, 0, h * .38, 4.61);
    for (const side of [-1, 1]) box(.18, h * .77, .3, yellowTrim, building, side * w * .3, h * .385, 4.8);
    box(w * .62, .2, .3, yellowTrim, building, 0, h * .77, 4.8);
    for (let i = 0; i < 5; i++) box(w * .58, .035, .2, roof, building, 0, .6 + i * h * .12, 4.76);
    for (const side of [-1, 1]) {
      box(w * .13, h * .19, .1, lamp, building, side * w * .41, h * .49, 4.58);
      box(.06, h * .2, .12, roof, building, side * w * .41, h * .49, 4.65);
    }
    box(1.4, .17, .3, lamp, building, 0, h * .87, 4.8);
  }
  hangar(-12, -15, 13, 6.5); hangar(5, -20, 15, 8.5); hangar(24, -25, 15, 6);
  for (let i = 0; i < 13; i++) box(1.6, .018, .2, yellow, scene, -14 + i * 2.3, -.35, -6.5);
  for (const x of [-13, 14]) {
    mesh(new THREE.CylinderGeometry(.06, .11, 10, 12), metal, scene, x, 4.6, -8);
    box(2.4, .18, .15, metal, scene, x, 9.5, -8);
    for (const dx of [-.8, .8]) { box(.65, .4, .35, navy, scene, x + dx, 9.5, -8); box(.55, .3, .04, lamp, scene, x + dx, 9.48, -7.8); }
  }
  const coneMaterial = material('#e66c30', .1, .5);
  for (let i = 0; i < 4; i++) {
    const x = [-6.7, 6.7, -5.5, 5.5][i], z = [-3, -3, 4, 4][i];
    box(.65, .1, .65, navy, scene, x, -.28, z);
    mesh(new THREE.ConeGeometry(.24, .8, 20), coneMaterial, scene, x, .14, z);
    mesh(new THREE.CylinderGeometry(.13, .18, .17, 20), cream, scene, x, .15, z);
  }
  for (let i = 0; i < 5; i++) {
    const barrel = mesh(new THREE.CylinderGeometry(.37, .37, 1, 24), material(i % 2 ? '#a14e38' : '#344c68', .5, .55), scene, 11 + i * .9, .13, -9);
    ring(.38, .025, metal, barrel, .33); ring(.38, .025, metal, barrel, -.33);
  }
  const pad = new THREE.Group(); scene.add(pad);
  mesh(new THREE.CylinderGeometry(4.8, 5, .32, 96), metal, pad, 0, -.19);
  mesh(new THREE.CylinderGeometry(4.63, 4.63, .1, 96), material('#484c50', .45, .6), pad, 0, -.045);
  ring(4.48, .045, cream, pad, .02); ring(4.76, .035, metal, pad, .02); ring(2.25, .055, cream, pad, .02);
  box(2.4, .025, .16, cream, pad, 0, .02); box(.16, .025, 2.4, cream, pad, 0, .02);
  for (let i = 0; i < 32; i++) {
    const angle = i / 32 * Math.PI * 2;
    box(.36, .025, .6, yellow, pad, Math.cos(angle) * 4.04, .025, Math.sin(angle) * 4.04).rotation.y = -angle + Math.PI / 2;
    if (i % 2 === 0) mesh(new THREE.SphereGeometry(.095, 12, 8), lamp, pad, Math.cos(angle) * 4.76, -.06, Math.sin(angle) * 4.76);
  }
  const rocket = new THREE.Group(); scene.add(rocket);
  const silhouette = [[0,1.1],[.54,1.1],[.71,1.32],[.83,1.9],[.86,3.8],[.82,4.7],[.7,5.4],[.5,5.95],[.27,6.3],[0,6.45]];
  mesh(new THREE.LatheGeometry(silhouette.map(([r, y]) => new THREE.Vector2(r, y)), 64), white, rocket);
  mesh(new THREE.CylinderGeometry(.84, .72, .38, 48), navy, rocket, 0, 1.42);
  ring(.79, .045, gold, rocket, 1.64); ring(.84, .035, gold, rocket, 4.6);
  mesh(new THREE.CylinderGeometry(.86, .86, .16, 48), navy, rocket, 0, 4.5);
  for (let i = 0; i < 24; i++) {
    const angle = i / 24 * Math.PI * 2;
    box(.11, .13, .018, navy, rocket, Math.sin(angle) * .84, 4.82 + (i % 2) * .13, Math.cos(angle) * .84).rotation.y = angle;
  }
  const porthole = new THREE.Group(); porthole.position.set(.18, 3.65, .78); porthole.rotation.y = .2; rocket.add(porthole);
  mesh(new THREE.TorusGeometry(.3, .065, 12, 48), metal, porthole);
  const glass = mesh(new THREE.SphereGeometry(.28, 32, 20), new THREE.MeshPhysicalMaterial({ color:'#071323', metalness:.85, roughness:.1, clearcoat:1 }), porthole, 0, 0, .015); glass.scale.z = .35;
  mesh(new THREE.SphereGeometry(.075, 16, 12), new THREE.MeshBasicMaterial({color:'#9ac5ed'}), porthole, -.08, .11, .1).scale.z = .15;
  for (let i = 0; i < 4; i++) {
    const angle = i * Math.PI / 2 + Math.PI / 4;
    const a = new THREE.Vector3(Math.sin(angle) * .72, 2.05, Math.cos(angle) * .72), b = new THREE.Vector3(Math.sin(angle) * 1.6, .14, Math.cos(angle) * 1.6);
    mesh(new THREE.SphereGeometry(.16, 20, 14), metal, rocket, a.x, a.y, a.z);
    strut(a, b, .09, white, rocket); strut(a.clone().lerp(b, .55), b, .052, metal, rocket);
    strut(new THREE.Vector3(Math.sin(angle) * .67, 1.2, Math.cos(angle) * .67), b, .045, metal, rocket);
    mesh(new THREE.CylinderGeometry(.28, .35, .13, 24), navy, rocket, b.x, .08, b.z);
  }
  mesh(new THREE.CylinderGeometry(.24, .52, .62, 40, 1, true), metal, rocket, 0, .86); ring(.49, .05, gold, rocket, .56);
  mesh(new THREE.CylinderGeometry(.16, .39, .35, 32), navy, rocket, 0, 1);
  for (const side of [-1, 1]) {
    mesh(new THREE.CylinderGeometry(.18, .18, .4, 24), metal, rocket, side * .94, 4.6).rotation.z = Math.PI / 2;
    box(.17, .5, .3, navy, rocket, side * .81, 4.6);
  }
  const flame = new THREE.Group(); rocket.add(flame);
  for (const [radius, length, color, opacity] of [[.39,2.8,'#ff8b21',.35],[.27,2.2,'#ffc354',.75],[.15,1.45,'#fff4cb',1]]) {
    mesh(new THREE.ConeGeometry(radius, length, 32), new THREE.MeshBasicMaterial({ color, transparent:true, opacity, depthWrite:false }), flame, 0, .55 - length/2).rotation.z = Math.PI;
  }
  const engineLight = new THREE.PointLight('#ffb74b', 0, 13, 2); engineLight.position.set(0, -.1, 0); rocket.add(engineLight);
  const sideFlames = [-1, 1].map(side => {
    const jet = mesh(new THREE.ConeGeometry(.12, .75, 20), new THREE.MeshBasicMaterial({color:'#ffe7a6',transparent:true,opacity:.8}), rocket, side * 1.5, 4.6);
    jet.rotation.z = side * -Math.PI / 2; return jet;
  });
  const dust = new THREE.Group(); scene.add(dust);
  const dustMaterial = new THREE.MeshBasicMaterial({ color:'#d9b17b', transparent:true, opacity:.16, depthWrite:false });
  const dustGeometry = new THREE.SphereGeometry(1, 10, 6);
  for(let i=0;i<24;i++) { const puff = mesh(dustGeometry, dustMaterial, dust); puff.castShadow = puff.receiveShadow = false; }
  const shadow = mesh(new THREE.CircleGeometry(1.25, 48), new THREE.MeshBasicMaterial({color:'#201c25',transparent:true,opacity:.2,depthWrite:false}), scene, 0, .045); shadow.rotation.x = -Math.PI / 2;
  let view = 'overview', width = 0, height = 0, previousAngle = 0;
  const target = new THREE.Vector3(), movement = new THREE.Vector3();
  function setView(next) {
    view = next; const distance = canvas.clientWidth < 500 ? 1.16 : 1;
    if (view === 'follow') { controls.target.copy(rocket.position).add(new THREE.Vector3(0, 3.1, 0)); camera.position.copy(controls.target).add(new THREE.Vector3(8, 3, 13).multiplyScalar(distance)); }
    else if (view === 'top') { controls.target.set(0, 0, 0); camera.position.set(0, 34 * distance, .1); }
    else { controls.target.set(-.5, 7.8, 0); camera.position.copy(controls.target).add(new THREE.Vector3(11, 5, 25).multiplyScalar(distance)); }
    controls.update();
  }
  setView('overview');
  return { setView, render(state) {
    if (canvas.clientWidth !== width || canvas.clientHeight !== height) {
      width = canvas.clientWidth; height = canvas.clientHeight; renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = width < 760 ? 53 : 43;
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
    }
    rocket.position.set(state.x * .035, state.y * .035, 0); rocket.rotation.z = -state.angle;
    const firing = state.thrust && state.status === 'flying'; flame.visible = firing;
    flame.scale.y = .9 + Math.sin(state.time * 57) * .13; engineLight.intensity = firing ? 85 : 0;
    white.color.set(state.status === 'crashed' ? '#a98c7c' : '#f4f0e7');
    const turn = state.angle - previousAngle;
    sideFlames[0].visible = state.status === 'flying' && turn > .001; sideFlames[1].visible = state.status === 'flying' && turn < -.001; previousAngle = state.angle;
    shadow.position.x = rocket.position.x; shadow.scale.setScalar(1 + state.y * .001); shadow.material.opacity = .32 / (1 + state.y * .02);
    dust.visible = firing && state.y < 65; dust.position.x = rocket.position.x;
    dust.children.forEach((puff, i) => {
      const progress = (state.time * .7 + i / 24) % 1, angle = i * 2.39996;
      puff.position.set(Math.cos(angle) * progress * 4.5, .1 + Math.sin(progress * Math.PI) * .25, Math.sin(angle) * progress * 4.5);
      puff.scale.set(.2 + progress * .8, .07 + progress * .12, .2 + progress * .8);
    });
    if (view === 'follow') { target.copy(rocket.position).add(new THREE.Vector3(0, 3.1, 0)); movement.copy(target).sub(controls.target); camera.position.add(movement); controls.target.copy(target); }
    controls.update(); renderer.render(scene, camera);
  }};
}
