import type { ComponentType, ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native'
import type { LucideProps } from 'lucide-react-native'
import { colors, radius } from '../theme'
import type { TripStatus } from '../types'

export function Card({
  children,
  onPress,
  style,
}: {
  children: ReactNode
  onPress?: () => void
  style?: ViewStyle | ViewStyle[]
}) {
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    )
  }
  return <View style={[styles.card, style]}>{children}</View>
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon: Icon,
}: {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'text'
  disabled?: boolean
  loading?: boolean
  icon?: ComponentType<LucideProps>
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled || loading) }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${variant}`],
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.text} />
      ) : (
        <>
          {Icon ? <Icon size={19} color={variant === 'primary' ? '#fff' : colors.text} /> : null}
          <Text style={[styles.buttonText, styles[`buttonText_${variant}`]]}>{title}</Text>
        </>
      )}
    </Pressable>
  )
}

export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.subtle}
        style={[styles.input, props.multiline && styles.multiline, error && styles.inputError]}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <Card>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.muted}>{message}</Text>
    </Card>
  )
}

const labels: Record<TripStatus, string> = {
  rascunho: 'Rascunho',
  em_andamento: 'Rascunho',
  aguardando_conferencia: 'Enviado',
  precisa_correcao: 'Correção',
  concluida: 'Concluída',
}

export function StatusBadge({ status }: { status: TripStatus }) {
  const tone =
    status === 'concluida'
      ? styles.badgeGreen
      : status === 'precisa_correcao'
        ? styles.badgeRed
        : status === 'aguardando_conferencia'
          ? styles.badgeAmber
          : styles.badgeNeutral
  return (
    <View style={[styles.badge, tone]}>
      <Text style={[styles.badgeText, tone]}>{labels[status]}</Text>
    </View>
  )
}

export function SummaryRow({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  )
}

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 112, gap: 16 },
  stack: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  pageTitle: { color: colors.text, fontSize: 25, lineHeight: 30, fontWeight: '800' },
  eyebrow: {
    color: colors.subtle,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  body: { color: colors.text, fontSize: 15, lineHeight: 22 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  subtle: { color: colors.subtle, fontSize: 12, lineHeight: 17 },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  errorBox: {
    padding: 12,
    borderRadius: 12,
    color: colors.red,
    backgroundColor: colors.redSoft,
    fontWeight: '700',
  },
  image: { width: '100%', height: 190, borderRadius: 12, backgroundColor: colors.elevated },
})

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 16,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.992 }] },
  disabled: { opacity: 0.45 },
  button: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  button_primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  button_secondary: { backgroundColor: colors.elevated, borderColor: colors.border },
  button_danger: { backgroundColor: colors.redSoft, borderColor: colors.redSoft },
  button_text: { minHeight: 40, backgroundColor: 'transparent', borderColor: 'transparent' },
  buttonText: { fontSize: 15, fontWeight: '800' },
  buttonText_primary: { color: '#fff' },
  buttonText_secondary: { color: colors.text },
  buttonText_danger: { color: colors.red },
  buttonText_text: { color: colors.muted },
  field: { gap: 7 },
  label: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: colors.elevated,
    color: colors.text,
    fontSize: 16,
  },
  multiline: { minHeight: 108, textAlignVertical: 'top' },
  inputError: { borderColor: colors.red },
  errorText: { color: colors.red, fontSize: 12 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  badgeGreen: { color: colors.green, borderColor: colors.greenSoft, backgroundColor: colors.greenSoft },
  badgeRed: { color: colors.red, borderColor: colors.redSoft, backgroundColor: colors.redSoft },
  badgeAmber: { color: colors.amber, borderColor: colors.amberSoft, backgroundColor: colors.amberSoft },
  badgeNeutral: { color: colors.muted, borderColor: colors.border, backgroundColor: colors.elevated },
  summaryRow: {
    minHeight: 38,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  summaryValue: { color: colors.text, fontWeight: '800', flexShrink: 1, textAlign: 'right' },
})
