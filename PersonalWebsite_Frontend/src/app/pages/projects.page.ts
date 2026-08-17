import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import * as THREE from 'three';

@Component({
  selector: 'app-projects-page',
  imports: [RouterLink],
  template: `
    <main class="projects-page projects-sun-page">
      <section class="vehicle-tracker project-sun-tracker" aria-label="Vehicle tracker">
        <div class="vehicle-copy">
          <h2>portfolio</h2>
        </div>

        <div class="vehicle-stage sun-stage">
          <canvas #sunCanvas aria-label="Rotating 3D sun"></canvas>
        </div>

        <div class="vehicle-controls" aria-label="Vehicle tracker controls">
          <button type="button" routerLink="/portfolio/costume-design" (mouseenter)="focusVehicle('project1')" (focus)="focusVehicle('project1')">Costume Design</button>
          <button type="button" routerLink="/portfolio/fashion-design" (mouseenter)="focusVehicle('project2')" (focus)="focusVehicle('project2')">Fashion Design</button>
          <button type="button" routerLink="/portfolio/teachings" (mouseenter)="focusVehicle('project3')" (focus)="focusVehicle('project3')">Teachings</button>
        </div>
      </section>
    </main>
  `,
  styles: [`
    main.projects-sun-page {
      min-height: calc(100svh - 72px);
      padding-top: 72px;
      overflow: hidden;
      background: #070707;
      color: #f7f5f0;
    }

    .project-sun-tracker {
      min-height: calc(100svh - 72px);
      padding: 34px;
      background: #070707;
    }

    .project-sun-tracker .vehicle-copy h2 {
      color: #D91259;
      font-size: clamp(46px, 7.2vw, 112px);
    }

    .sun-stage {
      min-height: clamp(380px, 68svh, 720px);
    }

    .sun-stage:before,
    .sun-stage:after {
      border-radius: 50%;
      pointer-events: none;
    }

    .sun-stage canvas {
      width: 100%;
      height: clamp(380px, 68svh, 720px);
    }

    .sun-stage:before {
      inset: 4%;
      border-color: rgba(255, 193, 91, 0.06);
      box-shadow: none;
    }

    .sun-stage:after {
      inset: 16%;
      border-color: rgba(255, 236, 177, 0.04);
    }

    .project-sun-tracker .vehicle-controls {
      justify-items: center;
      gap: 18px;
      margin-top: clamp(18px, 3vh, 34px);
      transform: translateX(-54px);
    }

    .project-sun-tracker .vehicle-controls button {
      width: min(280px, 100%);
      min-height: 66px;
      border-radius: 12px;
      border-color: #D91259;
      background: transparent;
      color: #D91259;
      padding: 22px 32px;
      font-family: "911 Porscha", Arial, Helvetica, sans-serif;
      font-weight: 400;
      font-size: 20px;
    }

    .project-sun-tracker .vehicle-controls button:hover,
    .project-sun-tracker .vehicle-controls button:focus-visible {
      border-color: #D91259;
      background: transparent;
      color: #D91259;
    }

    @media (max-width: 900px) {
      main.projects-sun-page {
        padding-top: 106px;
      }

      .project-sun-tracker {
        min-height: calc(100svh - 106px);
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: auto auto auto;
        align-content: center;
        justify-items: center;
        gap: clamp(12px, 2.6vh, 22px);
        padding: 22px 20px 34px;
        text-align: center;
      }

      .project-sun-tracker .vehicle-copy h2 {
        width: 100%;
        max-width: 100%;
        font-size: clamp(20px, 7vw, 30px);
        line-height: 1.12;
        overflow-wrap: anywhere;
      }

      .project-sun-tracker .vehicle-copy {
        width: 100%;
        text-align: center;
      }

      .sun-stage {
        width: min(100%, 360px);
        min-height: clamp(220px, 36vh, 320px);
      }

      .sun-stage canvas {
        height: clamp(220px, 36vh, 320px);
      }

      .project-sun-tracker .vehicle-controls {
        grid-template-columns: 1fr;
        justify-items: center;
        width: 100%;
        margin-top: clamp(34px, 7vh, 72px);
        transform: none;
      }

      .project-sun-tracker .vehicle-controls button {
        width: min(280px, calc(100vw - 40px));
        min-height: 58px;
        padding: 14px 16px;
        font-size: clamp(15px, 4.8vw, 18px);
        overflow-wrap: anywhere;
      }
    }
  `]
})
export class ProjectsPage implements AfterViewInit, OnDestroy {
  @ViewChild('sunCanvas') private sunCanvas?: ElementRef<HTMLCanvasElement>;

  private sunFrame = 0;
  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private sun?: THREE.Group;
  private lavaJets?: THREE.Group;
  private surface?: THREE.Mesh;
  private corona?: THREE.Group;
  private sunMaterial?: THREE.ShaderMaterial;
  private readonly clock = new THREE.Clock();
  private targetRotation = new THREE.Euler(0.12, 0, 0.06);
  private readonly resizeSun = (): void => this.resizeSunRenderer();

  ngAfterViewInit(): void {
    window.addEventListener('resize', this.resizeSun, { passive: true });
    this.initSun();
  }

  protected focusVehicle(vehicle: 'project1' | 'project2' | 'project3'): void {
    const rotations = {
      project1: new THREE.Euler(0.1, 0.08, 0.04),
      project2: new THREE.Euler(-0.2, 0.68, -0.1),
      project3: new THREE.Euler(0.32, -0.68, 0.16)
    };

    this.targetRotation = rotations[vehicle];
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeSun);
    cancelAnimationFrame(this.sunFrame);
    this.renderer?.dispose();
  }

  private initSun(): void {
    const canvas = this.sunCanvas?.nativeElement;

    if (!canvas) {
      return;
    }

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    this.camera.position.set(0, 0, 5.35);

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.45;

    this.sun = new THREE.Group();
    const realSunTexture = new THREE.TextureLoader().load('/assets/sun/real-sun-4096.jpg');
    realSunTexture.colorSpace = THREE.SRGBColorSpace;
    realSunTexture.wrapS = THREE.RepeatWrapping;
    realSunTexture.wrapT = THREE.RepeatWrapping;
    realSunTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    realSunTexture.minFilter = THREE.LinearMipmapLinearFilter;
    realSunTexture.magFilter = THREE.LinearFilter;

    const sunMaterial = this.createSunMaterial(realSunTexture);
    this.sunMaterial = sunMaterial;
    this.surface = new THREE.Mesh(new THREE.SphereGeometry(1.58, 320, 320), sunMaterial);
    this.corona = this.createCorona();
    this.lavaJets = this.createLavaJets();

    this.sun.add(this.corona, this.surface, this.lavaJets);
    this.scene.add(this.sun);

    const coreLight = new THREE.PointLight(0xffb347, 5.5, 10);
    coreLight.position.set(0, 0, 1.1);
    const fill = new THREE.AmbientLight(0xffd8a3, 0.55);
    this.scene.add(coreLight, fill);

    this.resizeSunRenderer();
    requestAnimationFrame(() => this.resizeSunRenderer());
    this.animateSun();
  }

  private animateSun(): void {
    if (!this.renderer || !this.scene || !this.camera || !this.sun) {
      return;
    }

    this.sun.rotation.x += (this.targetRotation.x - this.sun.rotation.x) * 0.025;
    this.sun.rotation.y += (this.targetRotation.y - this.sun.rotation.y) * 0.025;
    this.sun.rotation.z += (this.targetRotation.z - this.sun.rotation.z) * 0.025;

    if (this.surface) {
      this.surface.rotation.y += 0.00038;
    }

    const elapsed = this.clock.getElapsedTime();
    if (this.sunMaterial) {
      this.sunMaterial.uniforms['uTime'].value = elapsed;
    }

    if (this.corona) {
      this.corona.rotation.z = Math.sin(elapsed * 0.11) * 0.035;
      this.corona.children.forEach((layer, index) => {
        const pulse = 1 + Math.sin(elapsed * (0.42 + index * 0.11)) * 0.012;
        layer.scale.setScalar(pulse);
      });
    }

    if (this.lavaJets) {
      this.lavaJets.children.forEach((jet, index) => {
        const pulse = 0.88 + Math.sin(elapsed * 1.7 + index * 0.71) * 0.1;
        jet.scale.setScalar(pulse);
      });
    }

    this.renderer.render(this.scene, this.camera);
    this.sunFrame = requestAnimationFrame(() => this.animateSun());
  }

  private createSunMaterial(realSunTexture: THREE.Texture): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: realSunTexture },
        uTime: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vUv = uv;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        void main() {
          vec3 textureColor = texture2D(uTexture, vUv).rgb;
          vec3 viewDir = normalize(vViewPosition);
          float facing = clamp(dot(normalize(vNormal), viewDir), 0.0, 1.0);
          float limb = pow(1.0 - facing, 2.15);
          vec2 flowUv = vec2(vUv.x + uTime * 0.006, vUv.y + sin(vUv.x * 16.0 + uTime * 0.18) * 0.006);
          float cells = noise(flowUv * 54.0) * 0.55 + noise(flowUv * 126.0 + uTime * 0.04) * 0.45;
          float filaments = smoothstep(0.36, 0.88, sin((vUv.x * 21.0 + vUv.y * 8.0 + cells * 3.2 + uTime * 0.08)) * 0.5 + 0.5);
          float heat = clamp(cells * 0.55 + filaments * 0.45, 0.0, 1.0);
          vec3 ember = mix(vec3(0.95, 0.21, 0.02), vec3(1.0, 0.86, 0.38), heat);
          vec3 color = mix(textureColor * vec3(1.28, 0.82, 0.52), ember, 0.32);
          color *= 1.16 + heat * 0.38;
          color = mix(color, vec3(0.9, 0.18, 0.02), limb * 0.48);
          color += vec3(1.0, 0.46, 0.08) * pow(1.0 - facing, 5.0) * 1.35;
          color = pow(color, vec3(0.82));
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });
  }

  private createCorona(): THREE.Group {
    const corona = new THREE.Group();
    const softCorona = this.createCoronaTexture();
    const hotCorona = this.createCoronaTexture(true);
    const layers = [
      { texture: softCorona, color: 0xff7a18, opacity: 0.42, scale: 3.75, rotation: 0 },
      { texture: hotCorona, color: 0xffe7a0, opacity: 0.26, scale: 3.18, rotation: Math.PI / 8 },
      { texture: softCorona, color: 0xff3b00, opacity: 0.16, scale: 4.35, rotation: Math.PI / 5 }
    ];

    layers.forEach((layer) => {
      const material = new THREE.SpriteMaterial({
        map: layer.texture,
        color: layer.color,
        transparent: true,
        opacity: layer.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.setScalar(layer.scale);
      sprite.material.rotation = layer.rotation;
      corona.add(sprite);
    });

    return corona;
  }

  private resizeSunRenderer(): void {
    const canvas = this.sunCanvas?.nativeElement;

    if (!canvas || !this.renderer || !this.camera) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private createLavaJets(): THREE.Group {
    const jets = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({
      color: 0xffb13b,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const hotMaterial = new THREE.MeshBasicMaterial({
      color: 0xfff0a0,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const configs = [
      { angle: -2.35, lift: 0.22, height: 0.22, tilt: 0.18 },
      { angle: -1.38, lift: -0.06, height: 0.16, tilt: -0.16 },
      { angle: -0.64, lift: 0.18, height: 0.2, tilt: 0.1 },
      { angle: 0.92, lift: -0.14, height: 0.18, tilt: -0.12 },
      { angle: 1.86, lift: 0.08, height: 0.24, tilt: 0.14 },
      { angle: 2.64, lift: -0.18, height: 0.15, tilt: -0.1 }
    ];

    configs.forEach((config, index) => {
      const root = new THREE.Vector3(
        Math.cos(config.angle) * 1.58,
        Math.sin(config.angle) * 1.58,
        config.lift
      );
      const normal = root.clone().normalize();
      const tangent = new THREE.Vector3(-normal.y, normal.x, 0).normalize();
      const tip = root.clone()
        .add(normal.clone().multiplyScalar(config.height))
        .add(tangent.clone().multiplyScalar(config.tilt));
      const control = root.clone()
        .add(normal.clone().multiplyScalar(config.height * 1.2))
        .add(tangent.clone().multiplyScalar(config.tilt * 0.42));
      const curve = new THREE.QuadraticBezierCurve3(root, control, tip);
      const geometry = new THREE.TubeGeometry(curve, 28, index % 2 === 0 ? 0.009 : 0.006, 8, false);
      const jet = new THREE.Mesh(geometry, index % 2 === 0 ? material : hotMaterial);

      jets.add(jet);
    });

    return jets;
  }

  private createSunTexture(isBump = false): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 4096;
    canvas.height = 2048;
    const context = canvas.getContext('2d');

    if (!context) {
      return new THREE.CanvasTexture(canvas);
    }

    const base = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    base.addColorStop(0, isBump ? '#9a9a9a' : '#ffea8a');
    base.addColorStop(0.35, isBump ? '#707070' : '#ff9d1f');
    base.addColorStop(0.72, isBump ? '#b8b8b8' : '#ff5c00');
    base.addColorStop(1, isBump ? '#858585' : '#ffe08a');
    context.fillStyle = base;
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < canvas.height; y += 18) {
      context.beginPath();
      context.moveTo(0, y);

      for (let x = 0; x <= canvas.width; x += 22) {
        const wave = Math.sin(x * 0.009 + y * 0.022) * 28 + Math.sin(x * 0.026) * 12;
        context.lineTo(x, y + wave);
      }

      context.lineWidth = 3 + Math.random() * 10;
      context.strokeStyle = isBump ? 'rgba(210, 210, 210, 0.26)' : 'rgba(255, 238, 132, 0.18)';
      context.stroke();
    }

    for (let i = 0; i < 620; i += 1) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = 18 + Math.random() * 118;
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);

      if (isBump) {
        gradient.addColorStop(0, 'rgba(235, 235, 235, 0.36)');
        gradient.addColorStop(0.5, 'rgba(120, 120, 120, 0.28)');
        gradient.addColorStop(1, 'rgba(120, 120, 120, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(255, 246, 170, 0.54)');
        gradient.addColorStop(0.42, 'rgba(255, 130, 20, 0.34)');
        gradient.addColorStop(1, 'rgba(150, 32, 0, 0)');
      }

      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  private createCoronaTexture(isHot = false): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const context = canvas.getContext('2d');

    if (!context) {
      return new THREE.CanvasTexture(canvas);
    }

    const center = canvas.width / 2;
    const gradient = context.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, isHot ? 'rgba(255, 255, 220, 0.72)' : 'rgba(255, 222, 126, 0.52)');
    gradient.addColorStop(0.28, isHot ? 'rgba(255, 150, 26, 0.32)' : 'rgba(255, 104, 0, 0.28)');
    gradient.addColorStop(0.58, isHot ? 'rgba(255, 80, 0, 0.12)' : 'rgba(255, 72, 0, 0.16)');
    gradient.addColorStop(1, 'rgba(255, 72, 0, 0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 180; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const inner = center * (0.3 + Math.random() * 0.1);
      const outer = center * (0.64 + Math.random() * 0.34);
      const width = 2 + Math.random() * (isHot ? 5 : 12);

      context.beginPath();
      context.moveTo(center + Math.cos(angle) * inner, center + Math.sin(angle) * inner);
      context.lineTo(center + Math.cos(angle) * outer, center + Math.sin(angle) * outer);
      context.lineWidth = width;
      context.strokeStyle = isHot ? 'rgba(255, 246, 190, 0.18)' : 'rgba(255, 105, 0, 0.12)';
      context.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    return texture;
  }
}
