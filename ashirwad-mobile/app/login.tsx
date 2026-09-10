import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../store/authStore';
import { useTheme } from '../store/themeStore';
import { Colors, Radius, Spacing } from '../constants/Colors';

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPwd, setShowPwd]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwdFocused, setPwdFocused]   = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      console.log('Login error:', err?.response?.data || err?.message);
      Alert.alert(
        'Authentication Failed',
        err?.response?.data?.error || err?.response?.data?.message || 'Invalid credentials. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      {/* Top Hero Gradient */}
      <LinearGradient
        colors={['#1e1b4b', '#312e81', '#4338ca']}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.logoBadgeContainer}>
          <View style={styles.logoBox}>
            <Feather name="box" size={32} color="#fff" />
          </View>
        </View>
        <Text style={styles.heroTitle}>Ashirwad IMS</Text>
        <Text style={styles.heroSub}>Manufacturing & Inventory System</Text>
      </LinearGradient>

      {/* Login Card Form */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.cardWrap}
      >
        <ScrollView
          contentContainerStyle={[styles.card, { backgroundColor: colors.bgCard }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Welcome Back</Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
              Enter your credentials to access your terminal
            </Text>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>EMAIL ADDRESS</Text>
            <View
              style={[
                styles.inputRow,
                { backgroundColor: colors.bgSecondary, borderColor: colors.border },
                emailFocused && { borderColor: colors.accent, backgroundColor: colors.accentGlow }
              ]}
            >
              <Feather
                name="mail"
                size={17}
                color={emailFocused ? colors.accentLight : colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="admin@ashirwad.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>PASSWORD</Text>
            <View
              style={[
                styles.inputRow,
                { backgroundColor: colors.bgSecondary, borderColor: colors.border },
                pwdFocused && { borderColor: colors.accent, backgroundColor: colors.accentGlow }
              ]}
            >
              <Feather
                name="lock"
                size={17}
                color={pwdFocused ? colors.accentLight : colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPwdFocused(true)}
                onBlur={() => setPwdFocused(false)}
                placeholder="••••••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPwd}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={styles.eyeBtn}>
                <Feather name={showPwd ? 'eye-off' : 'eye'} size={17} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#6366f1', '#4f46e5', '#4338ca']}
              style={styles.loginGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.loginBtnText}>Sign In</Text>
                  <Feather name="arrow-right" size={17} color="#fff" />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Security Badge Footer */}
          <View style={styles.securityBadge}>
            <Feather name="shield" size={12} color={colors.textMuted} />
            <Text style={[styles.securityText, { color: colors.textMuted }]}>
              256-Bit Encrypted Enterprise Session
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 70,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  logoBadgeContainer: {
    padding: 3,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 14,
  },
  logoBox: {
    width: 60, height: 60,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 26, fontWeight: '800',
    color: '#fff', letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.75)',
    marginTop: 4, fontWeight: '500',
  },
  cardWrap: { flex: 1 },
  card: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: Spacing.xl,
    paddingBottom: 40,
    flexGrow: 1,
  },
  cardHeader: { marginBottom: 24 },
  cardTitle: {
    fontSize: 22, fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardSub: {
    fontSize: 13,
    marginTop: 4,
  },
  inputGroup: { marginBottom: 18 },
  label: {
    fontSize: 11, fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 13,
  },
  eyeBtn: { padding: 6 },
  loginBtn: {
    marginTop: 18,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginGrad: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loginBtnText: {
    color: '#fff', fontSize: 15,
    fontWeight: '800', letterSpacing: 0.3,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 36,
  },
  securityText: { fontSize: 11, fontWeight: '600' },
});
