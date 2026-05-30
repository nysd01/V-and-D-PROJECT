import React from 'react';
import { View, StyleSheet } from 'react-native';

// Web build — expo-gl / GLView not supported in static export.
// Show a clean animated placeholder card instead.
export default function Suit360() {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <style>{`
          @keyframes spin3d {
            0%   { transform: rotateY(0deg); }
            100% { transform: rotateY(360deg); }
          }
          .suit-icon {
            font-size: 64px;
            display: block;
            animation: spin3d 4s linear infinite;
            transform-style: preserve-3d;
          }
        `}</style>
        {/* @ts-ignore — dangerouslySetInnerHTML is web-only */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span className="suit-icon">🕵️</span>
          <span style={{ fontSize: 11, color: '#3D4560', fontWeight: '600', fontFamily: 'sans-serif' }}>
            InternConnect 3D
          </span>
        </div>
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
});
