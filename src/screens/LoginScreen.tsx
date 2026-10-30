import { useState } from 'react'
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { LogIn } from 'lucide-react-native'
import { Button, Card, Field, ui } from '../components/NativeUi'
import { demoCredentials } from '../data'
import { supabaseConfigured } from '../lib/supabase'
import { ensureDriverSeed } from '../services/trips'
import { useStore } from '../store'
import { colors } from '../theme'

export function LoginScreen() {
  const { state, dispatch, notify } = useStore()
  const [matricula, setMatricula] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')

  const login = (registration: string, password: string) => {
    if (!registration || !password) {
      setError('Informe a matrícula e a senha.')
      return
    }
    const driver =
      registration === demoCredentials.motorista.matricula &&
      password === demoCredentials.motorista.senha
    const admin =
      registration === demoCredentials.admin.matricula && password === demoCredentials.admin.senha
    if (!driver && !admin) {
      setError('Credenciais inválidas. Na demo use 1042/rota ou 9001/admin.')
      return
    }

    const profile = admin ? demoCredentials.admin.profile : demoCredentials.motorista.profile
    if (profile.role === 'motorista' && !state.vehicles.some((v) => v.driverId === profile.id)) {
      ensureDriverSeed(profile).vehicles.forEach((vehicle) =>
        dispatch({ type: 'upsert-vehicle', vehicle }),
      )
    }
    setError('')
    dispatch({ type: 'login', profile })
    notify('Sessão iniciada.')
  }

  return (
    <KeyboardAvoidingView
      style={ui.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.brand}>
          <Image
            source={require('../../public/brand/braulio-logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Transportadora Braulio"
          />
          <Text style={styles.subtitle}>Sistema do motorista</Text>
          <Text style={styles.hero}>Uma tela para registrar toda a viagem.</Text>
          <Text style={ui.muted}>
            Data, quilometragem, relato, gastos e comprovantes, mesmo sem conexão.
          </Text>
        </View>

        <Card>
          <Text style={ui.title}>Entrar</Text>
          <Text style={ui.muted}>
            {supabaseConfigured
              ? 'Supabase configurado. Seus dados locais permanecem disponíveis offline.'
              : 'Modo local: os registros ficam neste aparelho.'}
          </Text>
          <Field
            label="Matrícula"
            value={matricula}
            onChangeText={setMatricula}
            keyboardType="number-pad"
            autoCapitalize="none"
            autoComplete="username"
            placeholder="1042"
          />
          <Field
            label="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            placeholder="rota"
          />
          {error ? <Text style={ui.errorBox}>{error}</Text> : null}
          <Button title="Entrar" icon={LogIn} onPress={() => login(matricula.trim(), senha)} />
          <Button
            title="Entrar como motorista (demo)"
            variant="secondary"
            onPress={() => login('1042', 'rota')}
          />
          <Button
            title="Entrar como admin (demo)"
            variant="secondary"
            onPress={() => login('9001', 'admin')}
          />
          <Text style={ui.subtle}>Motorista 1042/rota · Admin 9001/admin</Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 28,
    paddingHorizontal: 18,
    paddingVertical: 48,
    backgroundColor: colors.background,
  },
  brand: { alignItems: 'center', gap: 10 },
  logo: { width: 260, height: 76 },
  subtitle: { color: colors.muted, fontWeight: '700' },
  hero: {
    maxWidth: 330,
    color: colors.text,
    fontSize: 27,
    lineHeight: 32,
    textAlign: 'center',
    fontWeight: '900',
  },
})
