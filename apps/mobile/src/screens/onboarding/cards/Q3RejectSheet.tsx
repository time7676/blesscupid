import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../../../i18n/init.js';
import { color, space, radius, type as type_ } from '../../../lib/design-system/tokens.js';

interface Props {
  onResolve: (closeAccount: boolean) => void;
}

export function Q3RejectSheet({ onResolve }: Props) {
  const { t } = useTranslation();
  return (
    <Modal animationType="fade" transparent visible>
      <View style={styles.scrim}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('v1.onboarding.q3Reject.title')}</Text>
          <Text style={styles.body}>{t('v1.onboarding.q3Reject.body')}</Text>
          <Pressable onPress={() => onResolve(true)} style={[styles.btn, styles.btnDanger]}>
            <Text style={styles.btnDangerLabel}>{t('v1.onboarding.q3Reject.closeAccount')}</Text>
          </Pressable>
          <Pressable onPress={() => onResolve(false)} style={styles.btnGhost}>
            <Text style={styles.btnGhostLabel}>{t('v1.onboarding.q3Reject.goBack')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: color.ink.scrim, justifyContent: 'flex-end' },
  sheet: { backgroundColor: color.parchment.raised, padding: space.s7, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, gap: space.s4 },
  title: { ...type_.h2, color: color.ink.default },
  body: { ...type_.body, color: color.ink.soft, marginBottom: space.s4 },
  btn: { paddingVertical: space.s4, borderRadius: radius.lg, alignItems: 'center' as const },
  btnDanger: { backgroundColor: color.warning[500] },
  btnDangerLabel: { ...type_.label, color: color.parchment.raised },
  btnGhost: { paddingVertical: space.s3, alignItems: 'center' as const },
  btnGhostLabel: { ...type_.label, color: color.ink.soft },
});
