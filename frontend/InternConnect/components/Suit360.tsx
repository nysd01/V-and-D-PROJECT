import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';

function createFallbackModel(): THREE.Group {
  const group = new THREE.Group();

  const head = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.95, 1),
    new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.5, roughness: 0.45 })
  );
  group.add(head);

  const goldStrip = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.055, 16, 48),
    new THREE.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.9, roughness: 0.2 })
  );
  goldStrip.rotation.x = Math.PI / 2;
  goldStrip.position.z = 0.08;
  group.add(goldStrip);

  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.2, 0.15),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.25 })
  );
  visor.position.set(0, 0.05, 0.78);
  group.add(visor);

  const accentLeft = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0x402400 })
  );
  accentLeft.position.set(-0.35, -0.1, 0.82);
  group.add(accentLeft);

  const accentRight = accentLeft.clone();
  accentRight.position.x = 0.35;
  group.add(accentRight);

  group.position.y = -0.05;
  return group;
}

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

      const model = createFallbackModel();
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
      console.error('Failed to render 3D model:', error);
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
