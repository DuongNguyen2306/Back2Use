import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Linking, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { paymentsApi } from '../../../lib/api';

export default function PurchasePackagesScreen() {
  const [walletId, setWalletId] = useState('');
  const [amount, setAmount] = useState('10000');
  const [note, setNote] = useState('Mua gói thử nghiệm');
  const [loading, setLoading] = useState(false);

  const openUrl = async (url: string) => {
    try {
      const result = await WebBrowser.openBrowserAsync(url);
      if (result.type === 'dismiss') {
        // optional: do nothing
      }
    } catch (e: any) {
      // fallback
      await Linking.openURL(url);
    }
  };

  const handleCreatePayment = async () => {
    const value = Number(amount);
    if (!value || value < 100) {
      Alert.alert('Lỗi', 'Số tiền không hợp lệ');
      return;
    }
    if (!walletId.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập Wallet ID');
      return;
    }
    setLoading(true);
    try {
      // Prefer wallet deposit endpoint if available
      const res: any = await paymentsApi.depositToWallet(walletId.trim(), value);
      const payUrl = res?.data?.payUrl || res?.payUrl || res?.data?.paymentUrl;
      if (!payUrl) {
        throw new Error('Không nhận được payUrl');
      }
      await openUrl(payUrl);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Tạo thanh toán thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#009900" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mua gói (VNPay Test)</Text>
      </View>

      <View style={{ padding: 16, gap: 12 }}>
        <View>
          <Text style={styles.label}>Wallet ID</Text>
          <TextInput value={walletId} onChangeText={setWalletId} style={styles.input} placeholder="Nhập walletId" />
        </View>

        <View>
          <Text style={styles.label}>Số tiền (VND)</Text>
          <TextInput
            keyboardType="number-pad"
            value={amount}
            onChangeText={setAmount}
            style={styles.input}
            placeholder="Ví dụ: 10000"
          />
        </View>

        <View>
          <Text style={styles.label}>Ghi chú đơn hàng</Text>
          <TextInput value={note} onChangeText={setNote} style={styles.input} placeholder="Mua gói ..." />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleCreatePayment} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Đang tạo...' : 'Thanh toán qua VNPay'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#009900' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  label: { fontWeight: '600', marginBottom: 6, color: '#111827' },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  button: { backgroundColor: '#0F4D3A', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});


