import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GLView } from 'expo-gl';
import { Asset } from 'expo-asset';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const MODEL_ASSET = require('../assets/models/dark_spy_with_black__gold_detailed_mask.glb');

export default function Suit360(): React.JSX.Element {
  const rafRef = useRef<number | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const onContextCreate = async (gl: any) => {
    try {
      const renderer = new Renderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setPixelRatio?.(1);
      renderer.setClearColor(new THREE.Color('#F7F8FC'), 1);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#F7F8FC');

      const camera = new THREE.PerspectiveCamera(
        35,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        100
      );
      camera.position.set(0, 0.7, 5.2);

      const ambient = new THREE.AmbientLight(0xffffff, 2.2);
      scene.add(ambient);

      const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
      keyLight.position.set(4, 5, 5);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x7dd3fc, 1.2);
      fillLight.position.set(-4, 1.5, 2.5);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xffd166, 0.9);
      rimLight.position.set(0, 2, -4);
      scene.add(rimLight);

      const asset = Asset.fromModule(MODEL_ASSET);
      await asset.downloadAsync();

      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(asset.localUri ?? asset.uri);
      const model = gltf.scene;

      const bounds = new THREE.Box3().setFromObject(model);
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      const maxSize = Math.max(size.x, size.y, size.z);
      const scale = maxSize > 0 ? 2.7 / maxSize : 1;

      model.position.sub(center);
      model.scale.setScalar(scale);
      model.rotation.x = -0.05;
      model.rotation.y = Math.PI * 0.85;
      model.position.y = -0.15;

      model.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = false;
          mesh.receiveShadow = false;
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material) => {
              if ('metalness' in material) {
                (material as THREE.MeshStandardMaterial).metalness = 0.7;
                (material as THREE.MeshStandardMaterial).roughness = 0.35;
              }
            });
          } else if (mesh.material && 'metalness' in mesh.material) {
            const material = mesh.material as THREE.MeshStandardMaterial;
            material.metalness = 0.7;
            material.roughness = 0.35;
          }
        }
      });

      scene.add(model);
      setStatus('ready');

      const render = () => {
        model.rotation.y += 0.0075;
        renderer.render(scene, camera);
        gl.endFrameEXP();
        rafRef.current = requestAnimationFrame(render);
      };

      render();
    } catch (error) {
      console.error('Failed to load 3D model:', error);
      setStatus('error');
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />

        {status !== 'ready' && (
          <View style={styles.overlay}>
            {status === 'loading' ? (
              <>
                <ActivityIndicator size="small" color="#0052CC" />
                <Text style={styles.overlayText}>Loading model</Text>
              </>
            ) : (
              <Text style={styles.overlayText}>Model preview unavailable</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  card: {
    width: 170,
    height: 218,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F7F8FC',
    borderWidth: 1,
    borderColor: 'rgba(10,10,20,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(247,248,252,0.25)',
    gap: 8,
  },
  overlayText: {
    fontSize: 12,
    color: '#3D4560',
    fontWeight: '600',
  },
});
