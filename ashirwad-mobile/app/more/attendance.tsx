import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../services/api';
import { useTheme } from '../../store/themeStore';
import { Colors, Spacing, Radius } from '../../constants/Colors';

interface Device {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
}

interface Employee {
  id: string;
  name: string;
  deviceUserId: string;
  designation?: string;
  department?: string;
}

interface AttendanceLog {
  id: string;
  timestamp: string;
  verifyMode: number;
  employee: {
    name: string;
  };
  device?: {
    name: string;
  };
}

export default function AttendanceScreen() {
  const [activeTab, setActiveTab] = useState<'today' | 'employees' | 'devices'>('today');
  const [logs, setLogs] = useState<AttendanceLog[]>([]); 
  const { colors } = useTheme();
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0 });
  const [employees, setEmployees] = useState<Employee[]>([]); 
  const [devices, setDevices] = useState<Device[]>([]); 
  const [loading, setLoading] = useState(true);

  // Syncing indicators
  const [syncing, setSyncing] = useState(false);
  const [testingDeviceId, setTestingDeviceId] = useState<string | null>(null);

  // New device form modal
  const [modalVisible, setModalVisible] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [deviceIp, setDeviceIp] = useState('');
  const [devicePort, setDevicePort] = useState('4370');
  const [savingDevice, setSavingDevice] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'today') {
        const { data } = await api.get('/attendance/today');
        setLogs(data.logs || []);
        setSummary(data.summary || { total: 0, present: 0, absent: 0 });
      } else if (activeTab === 'employees') {
        const { data } = await api.get('/attendance/employees');
        setEmployees(data || []);
      } else if (activeTab === 'devices') {
        const { data } = await api.get('/attendance/devices');
        setDevices(data || []);
      }
    } catch (err) {
      console.error('Fetch attendance data failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      await api.post('/attendance/sync');
      Alert.alert('Sync Complete', 'Manual sync triggered on all connected devices successfully.');
      if (activeTab === 'today') {
        fetchData();
      }
    } catch (err) {
      Alert.alert('Sync Failed', 'Failed to connect/sync ZK devices. Please check device connectivity.');
    } finally {
      setSyncing(false);
    }
  };

  const handleTestConnection = async (device: Device) => {
    setTestingDeviceId(device.id);
    try {
      const { data } = await api.post(`/attendance/devices/${device.id}/test`);
      Alert.alert('Connection Success', data.message || 'Successfully connected to ZK Device.');
    } catch (err: any) {
      Alert.alert('Connection Failed', err?.response?.data?.error || 'Device timed out or unreachable.');
    } finally {
      setTestingDeviceId(null);
    }
  };

  const handleAddDevice = async () => {
    if (!deviceName.trim() || !deviceIp.trim()) {
      Alert.alert('Validation Error', 'Device Name and IP Address are required.');
      return;
    }
    setSavingDevice(true);
    try {
      await api.post('/attendance/devices', {
        name: deviceName.trim(),
        ipAddress: deviceIp.trim(),
        port: parseInt(devicePort) || 4370,
      });
      setModalVisible(false);
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Failed to add attendance device.');
    } finally {
      setSavingDevice(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance Systems</Text>
        {activeTab === 'devices' ? (
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
            <Feather name="plus" size={18} color={Colors.accentLight} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={handleSyncAll} 
            style={[styles.syncBtn, syncing && { opacity: 0.6 }]}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Feather name="refresh-cw" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'today' && styles.tabActive]}
          onPress={() => setActiveTab('today')}
        >
          <Text style={[styles.tabText, activeTab === 'today' && styles.tabTextActive]}>Today's Log</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'employees' && styles.tabActive]}
          onPress={() => setActiveTab('employees')}
        >
          <Text style={[styles.tabText, activeTab === 'employees' && styles.tabTextActive]}>Employees</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'devices' && styles.tabActive]}
          onPress={() => setActiveTab('devices')}
        >
          <Text style={[styles.tabText, activeTab === 'devices' && styles.tabTextActive]}>Biometric Devices</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          {activeTab === 'today' && (
            <>
              {/* Summary Cards */}
              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <Text style={styles.sumVal}>{summary.total}</Text>
                  <Text style={styles.sumLabel}>Employees</Text>
                </View>
                <View style={[styles.summaryCard, { borderColor: '#10b981' }]}>
                  <Text style={[styles.sumVal, { color: '#10b981' }]}>{summary.present}</Text>
                  <Text style={styles.sumLabel}>Present</Text>
                </View>
                <View style={[styles.summaryCard, { borderColor: '#ef4444' }]}>
                  <Text style={[styles.sumVal, { color: '#ef4444' }]}>{summary.absent}</Text>
                  <Text style={styles.sumLabel}>Absent</Text>
                </View>
              </View>

              {/* Logs */}
              <Text style={styles.sectionTitle}>Real-time Check-ins</Text>
              {logs.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.noDataText}>No check-in logs registered today yet</Text>
                </View>
              ) : (
                logs.map(log => (
                  <View key={log.id} style={styles.logCard}>
                    <View style={styles.logAvatar}>
                      <Text style={styles.avatarText}>{log.employee?.name[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.logName}>{log.employee?.name}</Text>
                      <Text style={styles.logDevice}>Device: {log.device?.name || 'Manual Check'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.logTime}>{formatDate(log.timestamp)}</Text>
                      <View style={styles.verifiedTag}>
                        <Feather name="check" size={10} color="#10b981" />
                        <Text style={styles.verifiedText}>Biometric</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </>
          )}

          {activeTab === 'employees' && (
            <>
              <Text style={styles.sectionTitle}>Employee Biometric Profiles</Text>
              {employees.length === 0 ? (
                <Text style={styles.noDataText}>No employees registered</Text>
              ) : (
                employees.map(emp => (
                  <View key={emp.id} style={styles.employeeCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.empName}>{emp.name}</Text>
                      {emp.designation || emp.department ? (
                        <Text style={styles.empMeta}>
                          {emp.designation || 'Staff'} · {emp.department || 'General'}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.uidBadge}>
                      <Text style={styles.uidText}>Device ID: {emp.deviceUserId}</Text>
                    </View>
                  </View>
                ))
              )}
            </>
          )}

          {activeTab === 'devices' && (
            <>
              <Text style={styles.sectionTitle}>ZKTeco Connected Devices</Text>
              {devices.length === 0 ? (
                <Text style={styles.noDataText}>No biometric devices configured</Text>
              ) : (
                devices.map(dev => (
                  <View key={dev.id} style={styles.deviceCard}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.deviceTitleRow}>
                        <Feather name="cpu" size={16} color={Colors.accentLight} />
                        <Text style={styles.deviceName}>{dev.name}</Text>
                      </View>
                      <Text style={styles.deviceIp}>
                        {dev.ipAddress}:{dev.port}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.testBtn, testingDeviceId === dev.id && { opacity: 0.6 }]}
                      onPress={() => handleTestConnection(dev)}
                      disabled={testingDeviceId === dev.id}
                    >
                      {testingDeviceId === dev.id ? (
                        <ActivityIndicator color={Colors.accent} size="small" />
                      ) : (
                        <Text style={styles.testBtnText}>Test Connect</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* New Device Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalRoot}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configure ZK Device</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Device Name *</Text>
                <TextInput
                  style={styles.input}
                  value={deviceName}
                  onChangeText={setDeviceName}
                  placeholder="e.g. Main Gate Fingerprint"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>IP Address *</Text>
                <TextInput
                  style={styles.input}
                  value={deviceIp}
                  onChangeText={setDeviceIp}
                  placeholder="e.g. 192.168.1.201"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Port Number</Text>
                <TextInput
                  style={styles.input}
                  value={devicePort}
                  onChangeText={setDevicePort}
                  placeholder="4370"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveDeviceBtn, savingDevice && { opacity: 0.7 }]}
                onPress={handleAddDevice}
                disabled={savingDevice}
              >
                {savingDevice ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveDeviceBtnText}>Configure</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  syncBtn: {
    width: 32, height: 32, borderRadius: Radius.md,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtn: {
    width: 32, height: 32, borderRadius: Radius.md,
    backgroundColor: Colors.accentGlow,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.accent,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.accent },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.accentLight, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noDataText: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: Spacing.xxl },
  container: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 40 },
  
  // Today's summary
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1, backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, alignItems: 'center',
  },
  sumVal: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  sumLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 4, textTransform: 'uppercase' },

  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyBox: { padding: Spacing.xxl, alignItems: 'center' },
  
  // Real-time logs
  logCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  logAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.accentGlow,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: Colors.accentLight },
  logName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  logDevice: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  logTime: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  verifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  verifiedText: { fontSize: 10, color: '#10b981', fontWeight: '600' },

  // Employees
  employeeCard: {
    flexDirection: 'row', alignItems: 'center', justify: 'space-between',
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  empName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  empMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  uidBadge: {
    backgroundColor: Colors.bgSecondary, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  uidText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },

  // Devices
  deviceCard: {
    flexDirection: 'row', alignItems: 'center', justify: 'space-between',
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  deviceTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deviceName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  deviceIp: { fontSize: 12, color: Colors.textMuted, marginTop: 4, paddingLeft: 24 },
  testBtn: {
    backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 6,
  },
  testBtnText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },

  // Modal
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContainer: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  form: { padding: Spacing.xl, gap: Spacing.lg },
  inputGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10,
    color: Colors.textPrimary, fontSize: 14,
  },
  modalFooter: {
    flexDirection: 'row', gap: Spacing.md,
    padding: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  saveDeviceBtn: {
    flex: 2, paddingVertical: 12, borderRadius: Radius.md,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  saveDeviceBtnText: { color: '#fff', fontWeight: '700' },
});
