// components/NativeQRScanner.tsx
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNativeCapabilities } from "../hooks/useNativeCapabilities";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "./ui";

export default function NativeQRScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const lock = useRef(false);
  const { scheduleNotification } = useNativeCapabilities();

  const startScan = async () => {
    if (!permission?.granted) {
      const req = await requestPermission();
      if (!req.granted) return;
    }
    setResult(null);
    setScanning(true);
    lock.current = false;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Scanner</CardTitle>
        <Badge variant={permission?.granted ? "success" : "secondary"}>
          {permission?.granted ? "Camera Ready" : "Permission Needed"}
        </Badge>
      </CardHeader>

      <CardContent>
        <View style={styles.box}>
          {scanning ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={(e) => {
                if (lock.current) return;
                lock.current = true;
                setScanning(false);
                setResult(e.data || "BC2U-CUP-001");
                scheduleNotification("Scan Complete", "QR detected", 0).catch(() => {});
              }}
            />
          ) : (
            <Text style={{ color: "#2563EB", fontWeight: "700" }}>
              Tap “Start Scanning” to open camera
            </Text>
          )}
        </View>

        <Button onPress={startScan} style={{ marginTop: 12 }}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>
            {scanning ? "Scanning..." : "Start Scanning"}
          </Text>
        </Button>

        {result && (
          <View style={styles.result}>
            <Text style={{ color: "#16A34A", fontWeight: "700" }}>✅ Container Found!</Text>
            <Text style={{ fontWeight: "800", marginTop: 4 }}>{result}</Text>
            <Button variant="eco" style={{ marginTop: 10 }}>
              <Text style={{ color: "#fff", fontWeight: "800" }}>Borrow Container</Text>
            </Button>
          </View>
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 220,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(37,99,235,0.5)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(37,99,235,0.06)",
  },
  result: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(34,197,94,0.08)",
    borderWidth: 0.5,
    borderColor: "rgba(34,197,94,0.3)",
  },
});
