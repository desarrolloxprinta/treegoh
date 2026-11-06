/**
 * TypewriterText — Revelación Letra a Letra 2026
 * 
 * Anima la aparición progresiva del mensaje o pensamiento botánico
 * transmitiendo calma, presencia y tecnología refinada estilo TIDE 2026.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';

interface TypewriterTextProps {
  text: string;
  speed?: number; // ms por carácter (por defecto 28ms)
  style?: StyleProp<TextStyle>;
  cursorColor?: string;
  onComplete?: () => void;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 28,
  style,
  cursorColor = 'rgba(255, 255, 255, 0.85)',
  onComplete,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    if (!text) return;

    let index = 0;
    const total = text.length;

    timerRef.current = setInterval(() => {
      index++;
      if (index <= total) {
        setDisplayedText(text.slice(0, index));
      } else {
        setIsTyping(false);
        clearInterval(timerRef.current);
        onComplete?.();
      }
    }, speed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [text, speed]);

  return (
    <Text style={style}>
      {displayedText}
      {isTyping && <Text style={{ color: cursorColor, opacity: 0.85 }}>▎</Text>}
    </Text>
  );
};

