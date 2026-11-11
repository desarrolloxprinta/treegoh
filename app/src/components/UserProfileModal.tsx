import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Platform,
  Share,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Fonts } from '../constants/theme';
import { TreegohIcon } from './TreegohIcon';
import { GlassCardSheen } from './BlobAnimatedCard';
import { CircadianBackground } from './CircadianBackground';
import { CircadianPhaseId, CircadianThemeConfig } from '../utils/circadianTheme';
import { WeatherConditionType } from '../services/weatherService';
import { OnboardingState, BotanicalExperienceLevel } from '../types/onboarding';
import { persistUserSession } from '../services/storageService';
import {
  BotanicalCameraBubbleModal,
  CapturedBubbleFrame,
} from './BotanicalCameraBubbleModal';
import {
  IOSAlarmConfig,
  getIOSAlarms,
  updateIOSAlarm,
  testTriggerImmediateAlarm,
  requestIOSNotificationPermissions,
} from '../services/iosNotificationAlarmService';

interface UserProfileModalProps {
  visible: boolean;
  onboardingData: OnboardingState;
  onClose: () => void;
  onResetOnboarding?: () => void;
  onUpdateProfileName?: (newName: string) => void;
  onUpdateProfilePhoto?: (newPhotoUri: string) => void;
  previewPhase?: CircadianPhaseId | null;
  onSelectPreviewPhase?: (phase: CircadianPhaseId | null) => void;
  theme?: CircadianThemeConfig;
  currentTime?: Date;
  weatherCondition?: WeatherConditionType;
  coords?: { latitude?: number; longitude?: number };
  spacesCount?: number;
  totalPlantsCount?: number;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  visible,
  onboardingData,
  onClose,
  onResetOnboarding,
  onUpdateProfileName,
  previewPhase,
  onSelectPreviewPhase,
  theme,
  currentTime,
  weatherCondition = 'despejado',
  coords,
  spacesCount = 1,
  totalPlantsCount = 0,
}) => {
  const insets = useSafeAreaInsets();
  const safeTop = Math.max(insets.top, Platform.OS === 'ios' ? 50 : 24);
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 34 : 20);

  const account = onboardingData.account;
  const isGuest = onboardingData.isGuest;

  const [displayName, setDisplayName] = useState(
    account?.displayName || (isGuest ? 'Cultivador Local' : 'Jardinero')
  );
  const [photoUri, setPhotoUri] = useState<string | null>(account?.photoURL || null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<BotanicalExperienceLevel>(
    account?.experienceLevel || 'habitual'
  );
  const [notifyWatering, setNotifyWatering] = useState(true);
  const [notifyPests, setNotifyPests] = useState(true);
  const [cloudSync, setCloudSync] = useState(!isGuest);
  const [iosAlarms, setIosAlarms] = useState<IOSAlarmConfig[]>([]);
  const [iosPermissionsGranted, setIosPermissionsGranted] = useState<boolean>(true);
  const [isBubbleCameraOpen, setIsBubbleCameraOpen] = useState<boolean>(false);

  useEffect(() => {
    if (account?.photoURL !== undefined) {
      setPhotoUri(account?.photoURL || null);
    }
  }, [account?.photoURL]);

  useEffect(() => {
    if (visible) {
      getIOSAlarms().then(setIosAlarms);
    }
  }, [visible]);

  const triggerHaptic = (heavy = false) => {
    try {
      Haptics.impactAsync(
        heavy ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
      );
    } catch (_e) {}
  };

  const handlePickFromGallery = async () => {
    triggerHaptic();
    let result: ImagePicker.ImagePickerResult | null = null;
    try {
      if (Platform.OS === 'android') {
        const perm = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!req.granted) {
            Alert.alert(
              'Permisos necesarios',
              'Treegoh necesita acceso a tu galería para que puedas seleccionar tu fotografía de perfil.'
            );
            return;
          }
        }
      }

      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: Platform.OS === 'android',
        quality: 0.85,
      });
    } catch (err: any) {
      console.warn('[Treegoh] Error al abrir la galería:', err);
      Alert.alert('Error', 'No se pudo abrir la galería de fotos.');
      return;
    }

    if (!result || result.canceled || !result.assets?.[0]?.uri) {
      return;
    }

    try {
      const newUri = result.assets[0].uri;
      setPhotoUri(newUri);

      try {
        if (account) account.photoURL = newUri;
      } catch (_e) {}
      try {
        if (onboardingData.account) onboardingData.account.photoURL = newUri;
      } catch (_e) {}

      const updatedData: OnboardingState = {
        ...onboardingData,
        account: onboardingData.account
          ? { ...onboardingData.account, photoURL: newUri }
          : undefined,
      };

      await persistUserSession(updatedData);
      onUpdateProfilePhoto?.(newUri);
      triggerHaptic(true);
    } catch (saveErr) {
      console.warn('[Treegoh] Aviso al persistir fotografía de perfil:', saveErr);
    }
  };

  const handleTakePhoto = () => {
    triggerHaptic();
    setIsBubbleCameraOpen(true);
  };

  const handleBubbleCapture = async (frame: CapturedBubbleFrame) => {
    setIsBubbleCameraOpen(false);
    triggerHaptic(true);
    const newUri = frame.uri;
    setPhotoUri(newUri);

    try {
      if (account) account.photoURL = newUri;
    } catch (_e) {}
    try {
      if (onboardingData.account) onboardingData.account.photoURL = newUri;
    } catch (_e) {}

    const updatedData: OnboardingState = {
      ...onboardingData,
      account: onboardingData.account
        ? { ...onboardingData.account, photoURL: newUri }
        : undefined,
    };

    try {
      await persistUserSession(updatedData);
      onUpdateProfilePhoto?.(newUri);
      triggerHaptic(true);
    } catch (saveErr) {
      console.warn('[Treegoh] Aviso al persistir fotografía capturada:', saveErr);
    }
  };

  const handleRemovePhoto = async () => {
    triggerHaptic(true);
    setPhotoUri(null);
    try {
      if (account) account.photoURL = null;
    } catch (_e) {}
    try {
      if (onboardingData.account) onboardingData.account.photoURL = null;
    } catch (_e) {}

    const updatedData: OnboardingState = {
      ...onboardingData,
      account: onboardingData.account
        ? { ...onboardingData.account, photoURL: null }
        : undefined,
    };
    await persistUserSession(updatedData);
    onUpdateProfilePhoto?.('');
  };

  const handlePressAvatar = () => {
    triggerHaptic();
    const options: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[] = [
      {
        text: 'Elegir de Galería',
        onPress: handlePickFromGallery,
      },
      {
        text: 'Tomar Fotografía',
        onPress: handleTakePhoto,
      },
    ];

    if (photoUri) {
      options.push({
        text: 'Eliminar Foto de Perfil',
        style: 'destructive',
        onPress: handleRemovePhoto,
      });
    }

    options.push({
      text: 'Cancelar',
      style: 'cancel',
    });

    Alert.alert(
      'Fotografía de Perfil',
      'Elige cómo deseas actualizar tu imagen de cultivador en el Santuario:',
      options
    );
  };

  const handleToggleAlarm = async (alarm: IOSAlarmConfig) => {
    triggerHaptic();
    const updated = await updateIOSAlarm(alarm.id, { enabled: !alarm.enabled });
    setIosAlarms(updated);
  };

  const handleTestAlarm = async (alarm: IOSAlarmConfig) => {
    triggerHaptic(true);
    await testTriggerImmediateAlarm(alarm);
  };

  const handleRequestPermissions = async () => {
    triggerHaptic();
    const res = await requestIOSNotificationPermissions();
    setIosPermissionsGranted(res.granted);
  };

  const handleSaveName = async () => {
    triggerHaptic(true);
    setIsEditingName(false);
    if (displayName.trim()) {
      const cleanName = displayName.trim();
      try {
        if (account) account.displayName = cleanName;
      } catch (_e) {}
      try {
        if (onboardingData.account) onboardingData.account.displayName = cleanName;
      } catch (_e) {}

      const updatedData: OnboardingState = {
        ...onboardingData,
        account: onboardingData.account
          ? { ...onboardingData.account, displayName: cleanName }
          : undefined,
      };

      await persistUserSession(updatedData);
      onUpdateProfileName?.(cleanName);
    }
  };

  const handleSelectExperienceLevel = async (lvl: BotanicalExperienceLevel) => {
    triggerHaptic();
    setSelectedLevel(lvl);
    try {
      if (account) account.experienceLevel = lvl;
    } catch (_e) {}
    try {
      if (onboardingData.account) onboardingData.account.experienceLevel = lvl;
    } catch (_e) {}

    const updatedData: OnboardingState = {
      ...onboardingData,
      account: onboardingData.account
        ? { ...onboardingData.account, experienceLevel: lvl }
        : undefined,
    };

    await persistUserSession(updatedData);
  };

  const handleExportSanctuaryData = async () => {
    triggerHaptic();
    try {
      const exportPayload = {
        app: 'Treegoh Botanical Sanctuary',
        version: '2026.1',
        exportedAt: new Date().toISOString(),
        user: {
          displayName,
          email: account?.email || 'local',
          experienceLevel: selectedLevel,
          location: onboardingData.location,
        },
        sanctuary: {
          spacesCount,
          totalPlantsCount,
          safetyFilter: onboardingData.safetyFilter,
        },
      };

      await Share.share({
        title: 'Copia de Seguridad del Santuario Botánico',
        message: JSON.stringify(exportPayload, null, 2),
      });
    } catch (_err) {}
  };

  const experienceCatalog: Record<
    BotanicalExperienceLevel,
    { label: string; sub: string; tag: string }
  > = {
    principiante: {
      label: 'Principiante Entusiasta',
      sub: 'Supervisión guiada, pautas de riego conservadoras y prevención estricta de asfixia radicular.',
      tag: 'Nivel 1',
    },
    habitual: {
      label: 'Cuidador Habitual',
      sub: 'Monitoreo de luz natural indirecta, fertilización suave y calibración de ciclos circadianos.',
      tag: 'Nivel 2',
    },
    experto: {
      label: 'Coleccionista Avanzado',
      sub: 'Control de déficit de presión de vapor (VPD), sustratos aireados custom y aráceas raras.',
      tag: 'Nivel 3',
    },
  };

  const activeExp = experienceCatalog[selectedLevel] || experienceCatalog.habitual;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      {/* FONDO CIRCADIANO ANIMADO IDÉNTICO A LA APP CON VELO 50% MÁS CLARO */}
      <CircadianBackground
        coords={coords || onboardingData.location}
        theme={theme}
        currentTime={currentTime}
        weatherCondition={weatherCondition}
      >
        <View style={styles.translucentLightVeil}>
          {/* 1. BARRA SUPERIOR DE NAVEGACIÓN AÉREA */}
          <View style={[styles.topNavBarRow, { paddingTop: safeTop + 4 }]}>
            <TouchableOpacity
              style={styles.navBackBtnPill}
              onPress={() => {
                triggerHaptic();
                onClose();
              }}
              activeOpacity={0.8}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <TreegohIcon name="flecha_volver" size={16} color="#FFFFFF" glow={false} />
              <Text style={styles.navBackBtnText}>Santuario</Text>
            </TouchableOpacity>

            <View style={styles.topCloudSyncBadge}>
              <View
                style={[
                  styles.syncStatusDot,
                  { backgroundColor: isGuest ? '#FBBF24' : '#86EFAC' },
                ]}
              />
              <Text style={styles.topCloudSyncText} numberOfLines={1}>
                {isGuest ? 'Modo Local' : 'Nube Sincronizada'}
              </Text>
            </View>
          </View>

          {/* 2. SCROLL PRINCIPAL ESPACIOSO */}
          <ScrollView
            style={styles.mainScroll}
            contentContainerStyle={[
              styles.mainScrollContent,
              { paddingBottom: safeBottom + 60 },
            ]}
            showsVerticalScrollIndicator={false}
            horizontal={false}
            showsHorizontalScrollIndicator={false}
            alwaysBounceHorizontal={false}
            directionalLockEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* BLOQUE HERO EDITORIAL */}
            <View style={styles.editorialHeaderBlock}>
              <View style={styles.heroSuperTagPill}>
                <TreegohIcon name="biblia_plantas" size={12} color="#86EFAC" glow={false} />
                <Text style={styles.heroSuperTagText}>PERFIL DEL CULTIVADOR</Text>
              </View>
              <Text
                style={styles.editorialMainTitle}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.85}
              >
                Perfil y Santuario
              </Text>
              <Text style={styles.editorialSubtitle}>
                Gestión de tu identidad botánica, telemetría ambiental del hogar, alarmas sincronizadas con iOS y preferencias circadianas.
              </Text>
            </View>

            {/* 3. TARJETA HERO: IDENTIDAD Y CUENTA DEL CULTIVADOR */}
            <View style={styles.profileHeroCard}>
              <GlassCardSheen />

              <View style={styles.heroAvatarOrbRow}>
                {/* Avatar Orb Etereo Bioluminiscente e Interactivo */}
                <TouchableOpacity
                  style={styles.avatarOrbWrapper}
                  onPress={handlePressAvatar}
                  activeOpacity={0.82}
                  accessibilityLabel="Cambiar foto de perfil"
                  accessibilityRole="button"
                >
                  <View style={styles.avatarOrbOuterGlow} />
                  <View style={styles.avatarOrbInnerCircle}>
                    {photoUri ? (
                      <Image
                        source={{ uri: photoUri }}
                        style={styles.avatarOrbImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.avatarOrbInitials}>
                        {displayName.slice(0, 1).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.avatarCameraBadgePill}>
                    <TreegohIcon name="camara_diagnostica" size={11} color="#FFFFFF" glow={false} />
                  </View>
                </TouchableOpacity>

                {/* Nombre, correo editable y botón para cambiar fotografía */}
                <View style={styles.heroNameAndEmailCol}>
                  {isEditingName ? (
                    <View style={styles.editingInputRow}>
                      <TextInput
                        style={styles.editingTextInput}
                        value={displayName}
                        onChangeText={setDisplayName}
                        autoFocus={true}
                        placeholder="Nombre de cultivador..."
                        placeholderTextColor="rgba(255, 255, 255, 0.40)"
                        maxLength={32}
                      />
                      <TouchableOpacity
                        style={styles.saveNameActionBtn}
                        onPress={handleSaveName}
                        activeOpacity={0.8}
                      >
                        <TreegohIcon name="mas" size={12} color="#161922" glow={false} />
                        <Text style={styles.saveNameActionBtnText}>Guardar</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.nameDisplayClickableRow}
                      onPress={() => {
                        triggerHaptic();
                        setIsEditingName(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={styles.heroDisplayNameText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {displayName}
                      </Text>
                      <View style={styles.editPencilBadge}>
                        <Text style={styles.editPencilBadgeText}>Editar</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  <Text
                    style={styles.heroEmailText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {account?.email || (isGuest ? 'Cultivador Local (Sin cuenta en la nube)' : 'Cuenta protegida')}
                  </Text>

                  {/* Botón píldora para interactuar y actualizar la foto de perfil */}
                  <TouchableOpacity
                    style={styles.changePhotoPillBtn}
                    onPress={handlePressAvatar}
                    activeOpacity={0.8}
                  >
                    <TreegohIcon name="galeria_evolucion" size={11} color="#86EFAC" glow={false} />
                    <Text style={styles.changePhotoPillText}>
                      {photoUri ? 'Cambiar fotografía' : 'Subir foto de perfil'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Selector de nivel de experiencia botánica */}
              <View style={styles.experienceLevelSection}>
                <View style={styles.expLevelHeaderRow}>
                  <Text style={styles.expLevelSectionTitle}>Nivel de Conocimiento Botánico</Text>
                  <View style={styles.expLevelTagPill}>
                    <Text style={styles.expLevelTagPillText}>{activeExp.tag}</Text>
                  </View>
                </View>

                <View style={styles.expSelectorChipsRow}>
                  {(['principiante', 'habitual', 'experto'] as BotanicalExperienceLevel[]).map(lvl => {
                    const isSelected = selectedLevel === lvl;
                    const meta = experienceCatalog[lvl];
                    return (
                      <TouchableOpacity
                        key={lvl}
                        style={[
                          styles.expChipItem,
                          isSelected && styles.expChipItemActive,
                        ]}
                        onPress={() => handleSelectExperienceLevel(lvl)}
                        activeOpacity={0.8}
                      >
                        <GlassCardSheen selected={isSelected} />
                        <Text
                          style={[
                            styles.expChipItemText,
                            isSelected && styles.expChipItemTextActive,
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit={true}
                          minimumFontScale={0.85}
                        >
                          {lvl === 'principiante'
                            ? 'Principiante'
                            : lvl === 'habitual'
                            ? 'Habitual'
                            : 'Experto'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.expLevelDescriptionText}>
                  {activeExp.sub}
                </Text>
              </View>
            </View>

            {/* 4. TELEMETRÍA Y MÉTRICAS DEL SANTUARIO EN GRID 2 COLUMNAS */}
            <View style={styles.metricsSectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleWithIcon}>
                  <TreegohIcon name="espacios_microclimas" size={17} color="#FFFFFF" glow={false} />
                  <Text style={styles.sectionTitle}>Métricas del Santuario</Text>
                </View>
                <Text style={styles.sectionCounter}>4 parámetros</Text>
              </View>

              <View style={styles.metricsGrid2Col}>
                {/* 1. Estancias */}
                <View style={styles.metricCardItem}>
                  <GlassCardSheen />
                  <View style={styles.metricCardIconCircle}>
                    <TreegohIcon name="espacios_microclimas" size={18} color="#FFFFFF" glow={false} />
                  </View>
                  <View style={styles.metricCardTextCol}>
                    <Text style={styles.metricCardTitle}>Estancias</Text>
                    <Text style={styles.metricCardBigValue} numberOfLines={1}>
                      {spacesCount} {spacesCount === 1 ? 'Espacio' : 'Espacios'}
                    </Text>
                    <Text style={styles.metricCardDetail} numberOfLines={1} ellipsizeMode="tail">
                      Microclimas calibrados
                    </Text>
                  </View>
                </View>

                {/* 2. Plantas */}
                <View style={styles.metricCardItem}>
                  <GlassCardSheen />
                  <View style={styles.metricCardIconCircle}>
                    <TreegohIcon name="luz_natural" size={18} color="#86EFAC" glow={false} />
                  </View>
                  <View style={styles.metricCardTextCol}>
                    <Text style={styles.metricCardTitle}>Plantas Activas</Text>
                    <Text style={styles.metricCardBigValue} numberOfLines={1}>
                      {totalPlantsCount} {totalPlantsCount === 1 ? 'Planta' : 'Plantas'}
                    </Text>
                    <Text style={styles.metricCardDetail} numberOfLines={1} ellipsizeMode="tail">
                      En seguimiento activo
                    </Text>
                  </View>
                </View>

                {/* 3. Ubicación */}
                <View style={styles.metricCardItem}>
                  <GlassCardSheen />
                  <View style={styles.metricCardIconCircle}>
                    <TreegohIcon name="brujula_solar" size={18} color="#93C5FD" glow={false} />
                  </View>
                  <View style={styles.metricCardTextCol}>
                    <Text style={styles.metricCardTitle}>Ubicación</Text>
                    <Text style={styles.metricCardBigValue} numberOfLines={1}>
                      {onboardingData.location.city || 'Madrid'}
                    </Text>
                    <Text style={styles.metricCardDetail} numberOfLines={1} ellipsizeMode="tail">
                      {onboardingData.location.bioclimaticZone || 'Zona Templada'}
                    </Text>
                  </View>
                </View>

                {/* 4. Mascotas ASPCA */}
                <View style={styles.metricCardItem}>
                  <GlassCardSheen />
                  <View style={styles.metricCardIconCircle}>
                    <TreegohIcon name="toxicidad_mascotas" size={18} color="#FCA5A5" glow={false} />
                  </View>
                  <View style={styles.metricCardTextCol}>
                    <Text style={styles.metricCardTitle}>Filtro Mascotas</Text>
                    <Text style={styles.metricCardBigValue} numberOfLines={1}>
                      {onboardingData.safetyFilter.hasPets ? 'Activo (ASPCA)' : 'Inactivo'}
                    </Text>
                    <Text style={styles.metricCardDetail} numberOfLines={1} ellipsizeMode="tail">
                      {onboardingData.safetyFilter.hasPets
                        ? onboardingData.safetyFilter.petTypes.join(', ') || 'Seguro animales'
                        : 'Sin filtro ASPCA'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 5. ALARMAS Y NOTIFICACIONES CIRCADIANAS DE IOS */}
            <View style={styles.alarmsSectionBlock}>
              <View style={styles.alarmSectionHeaderRow}>
                <View style={styles.sectionTitleWithIcon}>
                  <TreegohIcon name="sensor_lux" size={17} color="#FFFFFF" glow={false} />
                  <Text style={styles.sectionTitle}>Alarmas Circadianas</Text>
                </View>

                <TouchableOpacity
                  style={styles.iosPermissionBadge}
                  onPress={handleRequestPermissions}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.permissionStatusDot,
                      { backgroundColor: iosPermissionsGranted ? '#86EFAC' : '#FDE68A' },
                    ]}
                  />
                  <Text style={styles.iosPermissionBadgeText} numberOfLines={1}>
                    {iosPermissionsGranted ? 'iOS Activo' : 'Pedir Permiso'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.alarmSectionSubtitle}>
                Avisos sonoros calibrados con luz cenital, evaporación VPD y bioacústica de relajación vespertina.
              </Text>

              <View style={styles.alarmsListCol}>
                {iosAlarms.map(alarm => (
                  <View key={alarm.id} style={styles.alarmItemCard}>
                    <GlassCardSheen />

                    <View style={styles.alarmTopRow}>
                      <View style={styles.alarmTimeBadgePill}>
                        <Text style={styles.alarmTimeBadgeText}>
                          {String(alarm.timeHour).padStart(2, '0')}:{String(alarm.timeMinute).padStart(2, '0')} h
                        </Text>
                      </View>

                      <View style={styles.alarmTextsCol}>
                        <Text style={styles.alarmTitleText} numberOfLines={1}>
                          {alarm.title}
                        </Text>
                        <Text style={styles.alarmBodyText} numberOfLines={2}>
                          {alarm.body}
                        </Text>
                      </View>

                      <Switch
                        value={alarm.enabled}
                        onValueChange={() => handleToggleAlarm(alarm)}
                        trackColor={{ false: 'rgba(255, 255, 255, 0.15)', true: '#86EFAC' }}
                        thumbColor={alarm.enabled ? '#161922' : '#D1D5DB'}
                        ios_backgroundColor="rgba(255, 255, 255, 0.15)"
                      />
                    </View>

                    <View style={styles.alarmFooterRow}>
                      <Text style={styles.alarmFooterRepeatText}>
                        Diario · Sonido y Vibración háptica
                      </Text>
                      <TouchableOpacity
                        style={styles.alarmTestButton}
                        onPress={() => handleTestAlarm(alarm)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.alarmTestButtonText}>Probar en iOS</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* 6. CALIBRACIÓN MANUAL DEL RITMO CIRCADIANO */}
            {onSelectPreviewPhase && (
              <View style={styles.circadianSectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTitleWithIcon}>
                    <TreegohIcon name="luz_natural" size={17} color="#FFFFFF" glow={false} />
                    <Text style={styles.sectionTitle}>Atmósfera Circadiana</Text>
                  </View>
                </View>

                <Text style={styles.circadianSectionSubtitle}>
                  Comprueba en tiempo real cómo cambia la iluminación ambiental de Treegoh en cada fase solar.
                </Text>

                <View style={styles.circadianPhasesWrap}>
                  {[
                    { id: null, label: 'Automático' },
                    { id: 'dawn', label: 'Amanecer' },
                    { id: 'morning', label: 'Mañana' },
                    { id: 'solar_noon', label: 'Luz Cenital' },
                    { id: 'golden_hour', label: 'Hora Dorada' },
                    { id: 'sunset', label: 'Ocaso' },
                    { id: 'night', label: 'Noche' },
                  ].map(ph => {
                    const isSelected =
                      previewPhase === ph.id || (!previewPhase && ph.id === null);
                    return (
                      <TouchableOpacity
                        key={ph.label}
                        style={[
                          styles.circadianPhasePill,
                          isSelected && styles.circadianPhasePillActive,
                        ]}
                        onPress={() => {
                          triggerHaptic();
                          onSelectPreviewPhase(ph.id as any);
                        }}
                        activeOpacity={0.8}
                      >
                        <GlassCardSheen selected={isSelected} />
                        <Text
                          style={[
                            styles.circadianPhasePillText,
                            isSelected && styles.circadianPhasePillTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {ph.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 7. PREFERENCIAS GENERALES Y SINCRONIZACIÓN */}
            <View style={styles.preferencesSectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleWithIcon}>
                  <TreegohIcon name="ajustes_pantalla" size={17} color="#FFFFFF" glow={false} />
                  <Text style={styles.sectionTitle}>Preferencias y Datos</Text>
                </View>
              </View>

              <View style={styles.preferenceCardsCol}>
                {/* Riego Predictivo VPD */}
                <View style={styles.preferenceRowCard}>
                  <GlassCardSheen />
                  <View style={styles.preferenceTextCol}>
                    <Text style={styles.preferenceTitleText} numberOfLines={1}>
                      Riego Predictivo (VPD Dinámico)
                    </Text>
                    <Text style={styles.preferenceSubText} numberOfLines={2}>
                      Calcula la evaporación foliar según la luz y humedad en cada estancia.
                    </Text>
                  </View>
                  <Switch
                    value={notifyWatering}
                    onValueChange={v => {
                      triggerHaptic();
                      setNotifyWatering(v);
                    }}
                    trackColor={{ false: 'rgba(255, 255, 255, 0.15)', true: '#FFFFFF' }}
                    thumbColor={notifyWatering ? '#161922' : '#D1D5DB'}
                    ios_backgroundColor="rgba(255, 255, 255, 0.15)"
                  />
                </View>

                {/* Alertas de Clima Exterior */}
                <View style={styles.preferenceRowCard}>
                  <GlassCardSheen />
                  <View style={styles.preferenceTextCol}>
                    <Text style={styles.preferenceTitleText} numberOfLines={1}>
                      Alertas de Radiación y Clima
                    </Text>
                    <Text style={styles.preferenceSubText} numberOfLines={2}>
                      Avisos automáticos en días de heladas, olas de calor o viento seco.
                    </Text>
                  </View>
                  <Switch
                    value={notifyPests}
                    onValueChange={v => {
                      triggerHaptic();
                      setNotifyPests(v);
                    }}
                    trackColor={{ false: 'rgba(255, 255, 255, 0.15)', true: '#FFFFFF' }}
                    thumbColor={notifyPests ? '#161922' : '#D1D5DB'}
                    ios_backgroundColor="rgba(255, 255, 255, 0.15)"
                  />
                </View>

                {/* Sincronización en la Nube */}
                <View style={styles.preferenceRowCard}>
                  <GlassCardSheen />
                  <View style={styles.preferenceTextCol}>
                    <Text style={styles.preferenceTitleText} numberOfLines={1}>
                      Sincronización en la Nube
                    </Text>
                    <Text style={styles.preferenceSubText} numberOfLines={2}>
                      Persistencia continua en Google Cloud Firestore sin pérdida de datos.
                    </Text>
                  </View>
                  <Switch
                    value={cloudSync}
                    onValueChange={v => {
                      triggerHaptic();
                      setCloudSync(v);
                    }}
                    trackColor={{ false: 'rgba(255, 255, 255, 0.15)', true: '#86EFAC' }}
                    thumbColor={cloudSync ? '#161922' : '#D1D5DB'}
                    ios_backgroundColor="rgba(255, 255, 255, 0.15)"
                  />
                </View>
              </View>
            </View>

            {/* 8. ACCIONES DE RESPALDO Y REINICIO DE PRUEBAS */}
            <View style={styles.actionsSectionBlock}>
              {/* Botón Exportar Santuario */}
              <TouchableOpacity
                style={styles.actionCardButton}
                onPress={handleExportSanctuaryData}
                activeOpacity={0.8}
              >
                <GlassCardSheen />
                <View style={styles.actionButtonIconWrap}>
                  <TreegohIcon name="galeria_evolucion" size={17} color="#86EFAC" glow={false} />
                </View>
                <View style={styles.actionButtonTextCol}>
                  <Text style={styles.actionButtonTitle}>Exportar Datos del Santuario</Text>
                  <Text style={styles.actionButtonSub} numberOfLines={1}>
                    Crea una copia de seguridad en formato JSON de todas tus plantas.
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Botón Recalibrar Onboarding */}
              {onResetOnboarding && (
                <TouchableOpacity
                  style={styles.actionCardButtonDanger}
                  onPress={() => {
                    triggerHaptic(true);
                    Alert.alert(
                      'Recalibrar Santuario',
                      '¿Deseas reiniciar la configuración inicial y repetir el onboarding de prueba?',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Recalibrar',
                          style: 'destructive',
                          onPress: () => {
                            onClose();
                            setTimeout(() => {
                              onResetOnboarding();
                            }, 240);
                          },
                        },
                      ]
                    );
                  }}
                  activeOpacity={0.8}
                >
                  <GlassCardSheen />
                  <View style={styles.actionButtonIconWrapDanger}>
                    <TreegohIcon name="espacios_microclimas" size={17} color="#FCA5A5" glow={false} />
                  </View>
                  <View style={styles.actionButtonTextCol}>
                    <Text style={styles.actionButtonTitleDanger}>Recalibrar Santuario (Repetir Onboarding)</Text>
                    <Text style={styles.actionButtonSubDanger} numberOfLines={1}>
                      Vuelve a calibrar la orientación solar, estancias y perfil.
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </CircadianBackground>

      {/* VISOR DE CÁMARA BOTÁNICO EN BURBUJA INTEGRADA (100% EN ESPAÑOL, CERO TEXTOS EN INGLÉS) */}
      <BotanicalCameraBubbleModal
        visible={isBubbleCameraOpen}
        isAnalyzing={false}
        liveHeadingDegrees={180}
        liveCompassLabel="Sur"
        estimatedLux={3200}
        onClose={() => setIsBubbleCameraOpen(false)}
        onCaptureFrame={handleBubbleCapture}
        onPickGalleryInsideModal={handlePickFromGallery}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Velo translúcido un 50% más claro para que la respiración circadiana fluya detrás
  translucentLightVeil: {
    flex: 1,
    backgroundColor: 'rgba(9, 14, 21, 0.38)',
  },
  topNavBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  navBackBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },
  navBackBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  topCloudSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    maxWidth: '55%',
  },
  syncStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  topCloudSyncText: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 28,
  },

  // Bloque hero editorial
  editorialHeaderBlock: {
    gap: 8,
  },
  heroSuperTagPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(134, 239, 172, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.28)',
  },
  heroSuperTagText: {
    fontFamily: Fonts.light,
    fontSize: 10.5,
    fontWeight: '300',
    color: '#86EFAC',
    letterSpacing: 1.2,
  },
  editorialMainTitle: {
    fontFamily: Fonts.light,
    fontSize: 30,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  editorialSubtitle: {
    fontFamily: Fonts.light,
    fontSize: 13.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
    lineHeight: 21,
  },

  // Tarjeta hero del perfil
  profileHeroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 20,
    gap: 18,
    overflow: 'hidden',
  },
  heroAvatarOrbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarOrbWrapper: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOrbOuterGlow: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(253, 164, 175, 0.35)',
  },
  avatarOrbInnerCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(251, 146, 60, 0.75)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarOrbImage: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
  },
  avatarCameraBadgePill: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#059669',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  avatarOrbInitials: {
    fontFamily: Fonts.regular,
    fontSize: 27,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  heroNameAndEmailCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  changePhotoPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 14,
    backgroundColor: 'rgba(134, 239, 172, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.28)',
    alignSelf: 'flex-start',
  },
  changePhotoPillText: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: '#86EFAC',
    letterSpacing: 0.2,
  },
  nameDisplayClickableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroDisplayNameText: {
    fontFamily: Fonts.regular,
    fontSize: 20,
    fontWeight: '400',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  editPencilBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  editPencilBadgeText: {
    fontFamily: Fonts.light,
    fontSize: 10.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  editingInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  editingTextInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.30)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontFamily: Fonts.regular,
    fontSize: 15,
  },
  saveNameActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  saveNameActionBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    fontWeight: '400',
    color: '#161922',
  },
  heroEmailText: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.58)',
  },

  // Selector de experiencia botánica
  experienceLevelSection: {
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
  },
  expLevelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expLevelSectionTitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  expLevelTagPill: {
    backgroundColor: 'rgba(134, 239, 172, 0.18)',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 8,
  },
  expLevelTagPillText: {
    fontFamily: Fonts.light,
    fontSize: 10.5,
    fontWeight: '300',
    color: '#86EFAC',
  },
  expSelectorChipsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  expChipItem: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  expChipItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderColor: 'rgba(134, 239, 172, 0.65)',
  },
  expChipItemText: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
    textAlign: 'center',
  },
  expChipItemTextActive: {
    fontFamily: Fonts.regular,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  expLevelDescriptionText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.60)',
    lineHeight: 18,
  },

  // Sección métricas en grid 2 columnas
  metricsSectionBlock: {
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: Fonts.light,
    fontSize: 19,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  sectionCounter: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.55)',
  },
  metricsGrid2Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    width: '100%',
  },
  metricCardItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 16,
    gap: 10,
    overflow: 'hidden',
  },
  metricCardIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricCardTextCol: {
    gap: 3,
    minWidth: 0,
  },
  metricCardTitle: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.55)',
  },
  metricCardBigValue: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  metricCardDetail: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.65)',
  },

  // Sección Alarmas Circadianas
  alarmsSectionBlock: {
    gap: 12,
  },
  alarmSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iosPermissionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(134, 239, 172, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.35)',
  },
  permissionStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  iosPermissionBadgeText: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: '#86EFAC',
  },
  alarmSectionSubtitle: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.62)',
    lineHeight: 18,
  },
  alarmsListCol: {
    gap: 12,
    marginTop: 4,
  },
  alarmItemCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 16,
    gap: 12,
    overflow: 'hidden',
  },
  alarmTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alarmTimeBadgePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  alarmTimeBadgeText: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    fontWeight: '400',
    color: '#86EFAC',
  },
  alarmTextsCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  alarmTitleText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  alarmBodyText: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.58)',
    lineHeight: 16,
  },
  alarmFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  alarmFooterRepeatText: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.45)',
  },
  alarmTestButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },
  alarmTestButtonText: {
    fontFamily: Fonts.light,
    fontSize: 11,
    fontWeight: '300',
    color: '#FFFFFF',
  },

  // Calibración circadiana
  circadianSectionBlock: {
    gap: 12,
  },
  circadianSectionSubtitle: {
    fontFamily: Fonts.light,
    fontSize: 12.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.62)',
    lineHeight: 18,
  },
  circadianPhasesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  circadianPhasePill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    overflow: 'hidden',
  },
  circadianPhasePillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderColor: 'rgba(134, 239, 172, 0.65)',
  },
  circadianPhasePillText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.70)',
  },
  circadianPhasePillTextActive: {
    fontFamily: Fonts.regular,
    fontWeight: '400',
    color: '#FFFFFF',
  },

  // Preferencias y Datos
  preferencesSectionBlock: {
    gap: 12,
  },
  preferenceCardsCol: {
    gap: 10,
  },
  preferenceRowCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  preferenceTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  preferenceTitleText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  preferenceSubText: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.58)',
    lineHeight: 16,
  },

  // Acciones de Respaldo y Reinicio
  actionsSectionBlock: {
    gap: 12,
  },
  actionCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 16,
    overflow: 'hidden',
  },
  actionButtonIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(134, 239, 172, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  actionButtonTitle: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  actionButtonSub: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.58)',
  },
  actionCardButtonDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(248, 113, 113, 0.06)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.22)',
    padding: 16,
    overflow: 'hidden',
  },
  actionButtonIconWrapDanger: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonTitleDanger: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    fontWeight: '400',
    color: '#FCA5A5',
  },
  actionButtonSubDanger: {
    fontFamily: Fonts.light,
    fontSize: 11.5,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.55)',
  },
});
