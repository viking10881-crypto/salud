/* eslint-disable react/no-unknown-property -- props de three.js en elementos de React Three Fiber */
import { camaraPara, type Encuadre, geometriaDoctora } from '@/lib/avatar/geometria';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { useIsFocused } from 'expo-router';
import { Component, type ReactNode, useMemo, useRef } from 'react';
import { View } from 'react-native';
import type { Group } from 'three';

type Props = { size: number; encuadre: Encuadre; respaldo: ReactNode };

/** Si el 3D falla (GL no disponible, etc.) muestra el avatar 2D. */
class SiFalla extends Component<{ respaldo: ReactNode; children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? this.props.respaldo : this.props.children;
  }
}

function Doctora() {
  const grupo = useRef<Group>(null);
  const geometria = geometriaDoctora(); // decodificada una vez y en caché

  // Balanceo suave de lado a lado y una leve "respiración"
  useFrame(({ clock }) => {
    const g = grupo.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    g.rotation.y = Math.sin(t * 0.5) * 0.45;
    g.position.y = Math.sin(t * 1.4) * 0.012;
  });

  return (
    <group ref={grupo}>
      <mesh geometry={geometria}>
        <meshStandardMaterial color="#FBF8FF" roughness={0.55} metalness={0.05} />
      </mesh>
    </group>
  );
}

/** Doctora virtual en 3D (React Three Fiber + expo-gl). */
export function Avatar3D({ size, encuadre, respaldo }: Props) {
  const enFoco = useIsFocused();
  const camara = useMemo(() => camaraPara(encuadre), [encuadre]);

  return (
    <SiFalla respaldo={respaldo}>
      <View style={{ width: size, height: size }}>
        <Canvas
          camera={camara}
          frameloop={enFoco ? 'always' : 'never'}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}>
          {/* Luz lavanda desde abajo, blanca desde arriba y un contraluz rosado */}
          <hemisphereLight args={['#FFFFFF', '#7C3AED', 0.9]} />
          <directionalLight position={[2, 3, 4]} intensity={1.5} />
          <directionalLight position={[-3, 1.5, -2]} intensity={0.9} color="#EC4899" />
          <Doctora />
        </Canvas>
      </View>
    </SiFalla>
  );
}
