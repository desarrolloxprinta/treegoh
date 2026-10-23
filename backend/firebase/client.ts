/**
 * Treegoh - Cliente Modular de Firebase
 * Configuración oficial para el proyecto treegoh-6d95a
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { UserProfile, CharacterStateConfig } from './schema';

export const firebaseConfig = {
  projectId: "treegoh-6d95a",
  appId: "1:68871982875:web:6be331828bab0109a08dbe",
  storageBucket: "treegoh-6d95a.firebasestorage.app",
  apiKey: "AIzaSyDphfR6tnmsKK5EB7malwFDdaZO9JlUchw",
  authDomain: "treegoh-6d95a.firebaseapp.com",
  messagingSenderId: "68871982875",
  measurementId: "G-8X3P0JRVKL",
};

// Singleton App Init
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/**
 * Avatar Resolver Canónico Treegoh (Cero Emojis)
 * Devuelve URL de foto personalizada si existe; de lo contrario null (activando el Character SVG)
 */
export function resolveUserAvatar(profile: Partial<UserProfile> | null | undefined): {
  type: 'custom_photo' | 'treegoh_character';
  url: string | null;
  characterMood: CharacterStateConfig['mood'];
} {
  if (profile?.photoURL && profile.photoURL.trim() !== '' && profile.hasCustomPhoto) {
    return {
      type: 'custom_photo',
      url: profile.photoURL,
      characterMood: profile.characterState?.mood || 'neutral'
    };
  }

  // Fallback Canónico al Personaje Oficial de Treegoh
  return {
    type: 'treegoh_character',
    url: null,
    characterMood: profile?.characterState?.mood || 'neutral'
  };
}

/**
 * Inicializa o recupera el perfil del usuario en Firestore
 */
export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    return snap.data() as UserProfile;
  }

  const newProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || 'Cuidador Botánico',
    photoURL: user.photoURL || null,
    hasCustomPhoto: Boolean(user.photoURL),
    characterState: {
      mood: 'happy',
      customColors: {
        eyesPlum: '#5B1636',
        coreAccent: '#84A98C',
        blush: '#F4A0B2'
      }
    },
    preferences: {
      theme: 'light_luxury',
      hapticFeedback: true,
      voiceAssistantEnabled: true,
      dailyNotificationTime: '09:00'
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await setDoc(userRef, newProfile);
  return newProfile;
}
