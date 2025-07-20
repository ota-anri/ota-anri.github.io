

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class ThreeJSContainer {
    private scene: THREE.Scene;
    private planets: THREE.Mesh[] = [];
    private moon: THREE.Mesh;
    private meteors: THREE.Points[] = [];

    private planetData = [
        { name: "水星", color: 0xaaaaaa, radius: 10, speed: 0.002 },
        { name: "金星", color: 0xffcc99, radius: 14, speed: 0.0018 },
        { name: "地球", color: 0x3399ff, radius: 18, speed: 0.0016 },
        { name: "火星", color: 0xff5533, radius: 22, speed: 0.0014 },
        { name: "木星", color: 0xffaa33, radius: 26, speed: 0.0012 },
        { name: "土星", color: 0xccaa77, radius: 30, speed: 0.001 },
        { name: "天王星", color: 0x66ccff, radius: 34, speed: 0.0009 },
        { name: "海王星", color: 0x3366cc, radius: 38, speed: 0.0008 }
    ];

    constructor() {

    }

    
    // 画面部分の作成(表示する枠ごとに)*
    public createRendererDOM = (width: number, height: number, cameraPos: THREE.Vector3) => {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setClearColor(new THREE.Color(0x000000));

        //カメラの設定
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.copy(cameraPos);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        const controls = new OrbitControls(camera, renderer.domElement);
        //カメラ操作をぬるっとさせる
        controls.enableDamping = true;

        this.createScene();

        const render: FrameRequestCallback = (time) => {
            controls.update();
            this.update(time);
            renderer.render(this.scene, camera);
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);

        renderer.domElement.style.cssFloat = "left";
        renderer.domElement.style.margin = "10px";
        return renderer.domElement;
    };

    // シーンの作成
    private createScene = () => {
        this.scene = new THREE.Scene();

        // 太陽(光源)  
        const light = new THREE.PointLight(0xffffcc, 2, 200);
        light.position.set(0, 0, 0);
        this.scene.add(light);

        const textureLoader = new THREE.TextureLoader();
        const sunTexture = textureLoader.load('sun.jpeg');
        const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
        const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(5, 32, 32), sunMaterial);
        this.scene.add(sunMesh);

        // 太陽の周りの輝き
        const auraGeometry = new THREE.SphereGeometry(6.5, 32, 32);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
        });
        const auraMesh = new THREE.Mesh(auraGeometry, auraMaterial);
        auraMesh.position.copy(sunMesh.position);
        this.scene.add(auraMesh);

        // 惑星と月
        this.planetData.forEach(data => {
            const geom = new THREE.SphereGeometry(2, 16, 16);
            const mat = new THREE.MeshStandardMaterial({ color: data.color });
            const planet = new THREE.Mesh(geom, mat);
            this.scene.add(planet);
            this.planets.push(planet);

            if (data.name === "地球") {
                const moonGeom = new THREE.SphereGeometry(0.7, 12, 12);
                const moonMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
                this.moon = new THREE.Mesh(moonGeom, moonMat);
                this.scene.add(this.moon);
            }
        });

        // 星パーティクル
        const starPositions: number[] = [];
        for (let i = 0; i < 1500; i++) {
            starPositions.push((Math.random() - 0.5) * 500);
            starPositions.push((Math.random() - 0.5) * 500);
            starPositions.push((Math.random() - 0.5) * 500);
        }
        const starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
        this.scene.add(new THREE.Points(starGeometry, starMaterial));

        //JavaScript
        const generateSprite = (colors: string[]): THREE.Texture => {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 16;
            const ctx = canvas.getContext('2d')!;
            const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
            g.addColorStop(0, 'rgba(255,255,255,1)');
            g.addColorStop(0.2, colors[0]);
            g.addColorStop(0.4, colors[1]);
            g.addColorStop(1, 'rgba(0,0,0,1)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 16, 16);
            const texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            return texture;
        };

        const spriteTextures = [
            generateSprite(['rgba(255,255,0,1)', 'rgba(128,128,0,1)']),
            generateSprite(['rgba(0,0,255,1)', 'rgba(0,0,64,1)']),
            generateSprite(['rgba(255,0,0,1)', 'rgba(64,0,0,1)']),
        ];

        // 流れ星
        for (let i = 0; i < 50; i++) {
            const geom = new THREE.BufferGeometry();
            const x = (Math.random() - 0.5) * 300;
            const y = Math.random() * 80 + 20;
            const z = (Math.random() - 0.5) * 300;
            geom.setAttribute('position', new THREE.Float32BufferAttribute([x, y, z], 3));

            const texture = spriteTextures[Math.floor(Math.random() * spriteTextures.length)];
            const mat = new THREE.PointsMaterial({
                size: 4,
                map: texture,
                transparent: true,
                depthWrite: false
            });
            const particle = new THREE.Points(geom, mat);
            this.scene.add(particle);
            this.meteors.push(particle);
        }
    };

    private update = (time: number) => {
        this.planets.forEach((planet, i) => {
            const data = this.planetData[i];
            const angle = time * data.speed;
            const x = Math.cos(angle) * data.radius;
            const z = Math.sin(angle) * data.radius;
            planet.position.set(x, 0, z);

            if (data.name === "地球" && this.moon) {
                const moonAngle = angle * 5;
                const mx = x + Math.cos(moonAngle) * 4;
                const mz = z + Math.sin(moonAngle) * 4;
                this.moon.position.set(mx, 0, mz);
            }
        });

        this.meteors.forEach(meteor => {
            const posAttr = meteor.geometry.getAttribute('position');
            const x = posAttr.getX(0) - 2.0;
            const y = posAttr.getY(0) - 1.2;
            const z = posAttr.getZ(0) - 0.8;
            posAttr.setXYZ(0, x, y, z);
            posAttr.needsUpdate = true;

            if (y < -20) {
                posAttr.setXYZ(0,
                    (Math.random() - 0.5) * 300,
                    Math.random() * 80 + 20,
                    (Math.random() - 0.5) * 300
                );
            }
        });
    };
}

window.addEventListener("DOMContentLoaded", init);

function init() {
    const container = new ThreeJSContainer();
    const viewport = container.createRendererDOM(window.innerWidth, window.innerHeight, new THREE.Vector3(0, 40, 70));
    document.body.appendChild(viewport);
}
