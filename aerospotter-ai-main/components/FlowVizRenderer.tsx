
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { SimulationVizData } from '../types';
import { motion } from 'framer-motion';

// Simple car body model data
const carBodyGeometry = () => {
    const shape = new THREE.Shape();
    // car shape
    shape.moveTo(-2, -0.5);
    shape.lineTo(-2.5, 0);
    shape.lineTo(-2, 0.5);
    shape.lineTo(2, 0.5);
    shape.lineTo(2.5, 0.2);
    shape.lineTo(2.5, -0.2);
    shape.lineTo(2, -0.5);
    shape.lineTo(-2, -0.5);
    const extrudeSettings = { depth: 0.8, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 0.1, bevelThickness: 0.1 };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
};

const FlowVizRenderer: React.FC<{ data: SimulationVizData }> = ({ data }) => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current || !data.imageUrl) return;

        const mount = mountRef.current;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
        camera.position.set(0, 2, 5);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(mount.clientWidth, mount.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        mount.appendChild(renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);
        
        // Car Body with Prototype Texture
        const textureLoader = new THREE.TextureLoader();
        const prototypeTexture = textureLoader.load(data.imageUrl);
        const carMaterial = new THREE.MeshStandardMaterial({ map: prototypeTexture, metalness: 0.8, roughness: 0.2 });
        const carBody = new THREE.Mesh(carBodyGeometry(), carMaterial);
        carBody.position.y = 0.5;
        scene.add(carBody);

        // Ground
        const groundGeometry = new THREE.PlaneGeometry(10, 10);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.4 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        scene.add(ground);
        
        // Streamlines
        const streamlines: THREE.Line[] = [];
        const streamlineCount = 30;
        for (let i = 0; i < streamlineCount; i++) {
            const material = new THREE.LineBasicMaterial({ color: i % 2 === 0 ? 0x00f5d4 : 0xff00ff, transparent: true, opacity: 0.5 });
            const points = [];
            for (let j = 0; j < 50; j++) {
                points.push(new THREE.Vector3(-5 + (j * 0.2), Math.random() * 1.5, (Math.random() - 0.5) * 3));
            }
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, material);
            line.userData.originalPoints = points.map(p => p.clone());
            streamlines.push(line);
            scene.add(line);
        }

        const clock = new THREE.Clock();

        const animate = () => {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();
            
            carBody.rotation.y += 0.2 * delta;
            
            // Animate streamlines
            streamlines.forEach(line => {
                const positions = line.geometry.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i] += 4 * delta; // Move along x-axis
                    if (positions[i] > 5) {
                        positions[i] = -5; // Reset
                    }
                    // Add some turbulence
                    positions[i+1] += (Math.sin(positions[i] + clock.getElapsedTime()) * 0.01);
                }
                line.geometry.attributes.position.needsUpdate = true;
            });
            
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            if (!mountRef.current) return;
            camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (mount.contains(renderer.domElement)) {
              mount.removeChild(renderer.domElement);
            }
            renderer.dispose();
            scene.traverse(object => {
                if (object instanceof THREE.Mesh) {
                    object.geometry.dispose();
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        };
    }, [data.imageUrl]);

    return (
        <div className="relative w-full h-full">
            <div ref={mountRef} className="absolute inset-0" />
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-4 left-4 right-4 bg-black/60 p-3 rounded-lg backdrop-blur-sm border border-gray-700 text-xs text-f1-text"
            >
                <p className="font-bold text-f1-accent-magenta">Aero Shourya's Debrief:</p>
                <p>{data.description}</p>
            </motion.div>
        </div>
    );
};

export default FlowVizRenderer;