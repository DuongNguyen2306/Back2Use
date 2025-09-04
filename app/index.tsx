// app/index.tsx
import MobileLayout from "../components/MobileLayout";
import MobileOptimizedCustomerApp from "../components/MobileOptimizedCustomerApp";
import NativeQRScanner from "../components/NativeQRScanner";

export default function Index() {
  return (
    <MobileLayout title="BC2U Customer" showHeader={false}>
      <NativeQRScanner />
      <MobileOptimizedCustomerApp />
    </MobileLayout>
  );
}
