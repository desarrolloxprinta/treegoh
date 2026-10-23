import React from 'react';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Circle,
  Ellipse,
  Path,
} from 'react-native-svg';

export interface TreegohCharacterProps {
  size?: number;
  mood?: 'neutral' | 'happy' | 'thirsty' | 'warning' | 'listening';
  statusOrbColor?: string; // Verde #84A98C, Ámbar #E29578, Púrpura #9C8EB9
  showStatusOrb?: boolean;
}

export const TreegohCharacter: React.FC<TreegohCharacterProps> = ({
  size = 120,
  mood = 'neutral',
  statusOrbColor = '#84A98C',
  showStatusOrb = true,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#141C19" stopOpacity={0.15} />
          <Stop offset="100%" stopColor="#141C19" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="coreGrad" cx="45%" cy="45%" r="55%">
          <Stop offset="0%" stopColor="#EBFFEB" stopOpacity={0.95} />
          <Stop offset="30%" stopColor="#96E1A5" stopOpacity={0.9} />
          <Stop offset="65%" stopColor="#52796F" stopOpacity={0.85} />
          <Stop offset="100%" stopColor="#354F52" stopOpacity={0.95} />
        </RadialGradient>
        <LinearGradient id="glassRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.85} />
          <Stop offset="40%" stopColor="#FFFFFF" stopOpacity={0.15} />
          <Stop offset="80%" stopColor="#84A98C" stopOpacity={0.2} />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.6} />
        </LinearGradient>
      </Defs>

      {/* Sombra proyectada */}
      <Ellipse cx={50} cy={92} rx={24} ry={5} fill="url(#shadowGrad)" />

      {/* Halo verde exterior */}
      <Circle cx={50} cy={48} r={38} fill="#84A98C" opacity={0.18} />

      {/* Núcleo biofílico vivo */}
      <Circle cx={50} cy={48} r={34} fill="url(#coreGrad)" />

      {/* Partículas de polen */}
      <Circle cx={42} cy={38} r={1.5} fill="#EBFFEB" opacity={0.8} />
      <Circle cx={58} cy={36} r={1.2} fill="#EBFFEB" opacity={0.7} />
      <Circle cx={36} cy={52} r={1.0} fill="#96E1A5" opacity={0.6} />
      <Circle cx={64} cy={54} r={1.3} fill="#96E1A5" opacity={0.65} />
      <Circle cx={50} cy={28} r={1.0} fill="#EBFFEB" opacity={0.75} />

      {/* Cejas en Ciruela #5B1636 */}
      <Path
        d={mood === 'thirsty' ? 'M37 41 Q41 38 45 39' : 'M37 39 Q41 37 45 40'}
        stroke="#5B1636"
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={mood === 'thirsty' ? 'M55 39 Q59 38 63 41' : 'M55 40 Q59 37 63 39'}
        stroke="#5B1636"
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />

      {/* Ojo izquierdo kawaii con pupila y doble brillo */}
      <Ellipse cx={41} cy={48} rx={4.5} ry={6} fill="#5B1636" />
      <Ellipse cx={41} cy={48} rx={3.2} ry={4.5} fill="#7A2348" />
      <Ellipse cx={39.5} cy={45.5} rx={2.2} ry={2} fill="#FFFFFF" />
      <Circle cx={42.5} cy={50.5} r={0.9} fill="#FFFFFF" />

      {/* Ojo derecho kawaii con pupila y doble brillo */}
      <Ellipse cx={59} cy={48} rx={4.5} ry={6} fill="#5B1636" />
      <Ellipse cx={59} cy={48} rx={3.2} ry={4.5} fill="#7A2348" />
      <Ellipse cx={57.5} cy={45.5} rx={2.2} ry={2} fill="#FFFFFF" />
      <Circle cx={60.5} cy={50.5} r={0.9} fill="#FFFFFF" />

      {/* Coloretes suaves en Rosa #F4A0B2 */}
      <Ellipse cx={34} cy={54} rx={4} ry={2.5} fill="#F4A0B2" opacity={0.85} />
      <Ellipse cx={66} cy={54} rx={4} ry={2.5} fill="#F4A0B2" opacity={0.85} />

      {/* Boca orgánica */}
      <Path
        d={mood === 'happy' ? 'M46 53 Q50 59 54 53' : 'M47 54 Q50 58 53 54'}
        stroke="#5B1636"
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />

      {/* Cúpula de cristal líquido satinado con reflejo curvo a las 10h */}
      <Circle cx={50} cy={48} r={36} fill="none" stroke="url(#glassRim)" strokeWidth={2} />
      <Path
        d="M24 36 A 32 32 0 0 1 48 18"
        stroke="#FFFFFF"
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
        opacity={0.75}
      />
      <Circle cx={68} cy={28} r={1.8} fill="#FFFFFF" opacity={0.8} />

      {/* Status Orb fisiológico (a las 4 en punto) */}
      {showStatusOrb && (
        <>
          <Circle cx={74} cy={74} r={8} fill={statusOrbColor} />
          <Circle cx={74} cy={74} r={8} fill="none" stroke="#FFFFFF" strokeWidth={1.8} />
        </>
      )}
    </Svg>
  );
};
