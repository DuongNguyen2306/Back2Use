import { useEffect, useState } from "react";
import { Dimensions } from "react-native";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(() => Dimensions.get("window").width < MOBILE_BREAKPOINT);

  useEffect(() => {
    const onChange = ({ window }: { window: { width: number; height: number } }) => {
      setIsMobile(window.width < MOBILE_BREAKPOINT);
    };
    const sub = Dimensions.addEventListener("change", onChange);
    return () => {
      // RN <=0.64 compatibility
      // @ts-ignore
      sub?.remove ? sub.remove() : Dimensions.removeEventListener("change", onChange);
    };
  }, []);

  return isMobile;
}


