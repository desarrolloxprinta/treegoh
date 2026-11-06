import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Text, ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TreegohIcon } from './TreegohIcon';
import { Fonts } from '../constants/theme';
import {
  BOTANICAL_IMAGE_HEADERS,
  getRealSpeciesImageSync,
  isGenericStockImageUrl,
  normalizeWikimediaUrl,
  resolveLiveBotanicalPhotoAsync,
} from '../services/botanicalEncyclopediaService';

interface BotanicalImageProps {
  uri?: string;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  commonName?: string;
  scientificName?: string;
  family?: string;
  preferHighRes?: boolean;
  showRepositoryBadge?: boolean;
}

function isLocalUserUri(uri?: string): boolean {
  if (!uri || typeof uri !== 'string') return false;
  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('data:image') ||
    uri.startsWith('ph://') ||
    uri.startsWith('asset://')
  );
}

export const BotanicalImage: React.FC<BotanicalImageProps> = React.memo(({
  uri,
  style,
  containerStyle,
  commonName,
  scientificName,
  preferHighRes = false,
  showRepositoryBadge = false,
}) => {
  const isLocal = isLocalUserUri(uri);

  // Resolver de inmediato la imagen real verificada desde biblia.json (Wikimedia Commons)
  // reemplazando cualquier imagen genérica de Unsplash o Pexels
  const syncResolved = isLocal
    ? { primaryUrl: uri || '', backupUrl: uri || '', sourceLabel: 'Captura Propia' }
    : getRealSpeciesImageSync(scientificName, commonName, uri, preferHighRes);

  const initialUri = isLocal
    ? uri || ''
    : syncResolved.primaryUrl || (!isGenericStockImageUrl(uri) ? normalizeWikimediaUrl(uri, preferHighRes) : '');

  const [activeUri, setActiveUri] = useState<string>(initialUri);
  const [sourceLabel, setSourceLabel] = useState<string>(syncResolved.sourceLabel);
  const [triedBackup, setTriedBackup] = useState<boolean>(false);
  const [triedLiveApi, setTriedLiveApi] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const nextIsLocal = isLocalUserUri(uri);
    const nextSync = nextIsLocal
      ? { primaryUrl: uri || '', backupUrl: uri || '', sourceLabel: 'Captura Propia' }
      : getRealSpeciesImageSync(scientificName, commonName, uri, preferHighRes);

    const nextInitial = nextIsLocal
      ? uri || ''
      : nextSync.primaryUrl || (!isGenericStockImageUrl(uri) ? normalizeWikimediaUrl(uri, preferHighRes) : '');

    setActiveUri(nextInitial);
    setSourceLabel(nextSync.sourceLabel);
    setTriedBackup(false);
    setTriedLiveApi(false);
    setHasError(false);
    setIsLoaded(false);

    // Si no había URL síncrona disponible, consultar en vivo Pl@ntNet/iNat + Wikimedia API
    if (!nextInitial && (scientificName || commonName)) {
      let cancelled = false;
      resolveLiveBotanicalPhotoAsync(scientificName, commonName).then(liveUrl => {
        if (!cancelled && liveUrl) {
          setActiveUri(liveUrl);
          setSourceLabel('Pl@ntNet · iNat');
          setHasError(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }
  }, [uri, scientificName, commonName, preferHighRes]);

  const handleImageError = () => {
    // 1. Intentar URL secundaria de Wikimedia si existe y es distinta
    if (!triedBackup && syncResolved.backupUrl && syncResolved.backupUrl !== activeUri) {
      setTriedBackup(true);
      setActiveUri(syncResolved.backupUrl);
      return;
    }

    // 2. Resolver en vivo en Pl@ntNet / iNaturalist Taxon API o Wikipedia REST Summary API
    if (!triedLiveApi && (scientificName || commonName)) {
      setTriedLiveApi(true);
      resolveLiveBotanicalPhotoAsync(scientificName, commonName).then(liveUrl => {
        if (liveUrl && liveUrl !== activeUri) {
          setActiveUri(liveUrl);
          setSourceLabel('Pl@ntNet · iNat');
          setHasError(false);
        } else {
          setHasError(true);
        }
      });
      return;
    }

    setHasError(true);
  };

  const showFallback = hasError || !activeUri;

  return (
    <View style={[styles.rootContainer, containerStyle]}>
      {/* Respaldo translúcido con gradiente glass mientras carga o si no hay red */}
      {(!isLoaded || showFallback) && (
        <View style={[styles.fallbackFrame, style as any]}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.16)', 'rgba(255, 255, 255, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <TreegohIcon
            name="biblia_plantas"
            size={20}
            color="rgba(255, 255, 255, 0.75)"
            glow={false}
          />
          {typeof commonName === 'string' && commonName.trim().length > 0 ? (
            <Text style={styles.fallbackLabel} numberOfLines={1}>
              {commonName.split(' ')[0]}
            </Text>
          ) : null}
        </View>
      )}

      {typeof activeUri === 'string' && activeUri.trim().length > 0 && !hasError && (
        <Image
          source={
            isLocal
              ? { uri: activeUri }
              : {
                  uri: activeUri,
                  headers: BOTANICAL_IMAGE_HEADERS,
                }
          }
          style={[style, !isLoaded && styles.hiddenWhileLoading]}
          onLoad={() => setIsLoaded(true)}
          onError={handleImageError}
          resizeMode="cover"
        />
      )}

      {showRepositoryBadge && isLoaded && !showFallback && (
        <View style={styles.repoBadgePill} pointerEvents="none">
          <Text style={styles.repoBadgeText} numberOfLines={1}>
            {sourceLabel}
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  rootContainer: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    position: 'relative',
  },
  hiddenWhileLoading: {
    position: 'absolute',
    opacity: 0,
  },
  fallbackFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    gap: 4,
    overflow: 'hidden',
    padding: 4,
  },
  fallbackLabel: {
    fontFamily: Fonts.light,
    fontSize: 9.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
  },
  repoBadgePill: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    right: 5,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 999,
    backgroundColor: 'rgba(8, 12, 18, 0.72)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
  },
  repoBadgeText: {
    fontFamily: Fonts.light,
    fontSize: 8.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.86)',
    letterSpacing: 0.2,
  },
});
