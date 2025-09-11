# 📍 Caption Positioning - Příklad použití

## 🎯 **Implementováno:**

### **1. Typy a interface**

```typescript
// src/types/captionPosition.ts
export type CaptionPosition = "TOP" | "MIDDLE" | "BOTTOM";

export interface LayoutInput {
  videoWidth: number;
  videoHeight: number;
  position: CaptionPosition;
  lineHeightPx: number;
  linesCount: number;
  avoidOverlays: boolean;
}
```

### **2. Utility funkce computeY()**

```typescript
// src/utils/layout.ts
export function computeY(input: LayoutInput): CaptionLayout {
  // Vypočítá y pozici s bezpečnými oblastmi
  // Safe top margin: 10% výšky videa
  // Safe bottom margin: 14% (nebo 16% s avoidOverlays)
  // Middle: vycentrované podle počtu řádků
}
```

### **3. UI komponenta**

```typescript
// src/components/CaptionPositionSelector/CaptionPositionSelector.tsx
<CaptionPositionSelector value={position} onChange={setPosition} />
```

### **4. Hook pro správu stavu**

```typescript
// src/hooks/useCaptionPosition.ts
const { position, setPosition } = useCaptionPosition({
  onPositionChange: (pos) => console.log("Position changed:", pos),
});
```

## 🔧 **FFmpeg příklad:**

### **Základní použití:**

```bash
ffmpeg -i input.mp4 \
  -vf "drawtext=text='Hello World':fontfile='/path/to/font.ttf':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=1750:box=1:boxcolor=black@0.7:borderw=3:bordercolor=black" \
  -c:a copy -c:v libx264 -preset fast -crf 23 -y output.mp4
```

### **S naší utility funkcí:**

```typescript
import { createFFmpegCommand } from "@/lib/ffmpeg/captionRenderer";

const options: CaptionRenderOptions = {
  videoWidth: 1080,
  videoHeight: 1920, // TikTok/IG Stories
  position: "BOTTOM",
  avoidOverlays: true,
  fontSize: 48,
  fontFamily: "/path/to/font.ttf",
  textColor: "white",
  backgroundColor: "black@0.7",
  outlineColor: "black",
  outlineWidth: 3,
  lineHeight: 1.2,
  maxWidth: 900,
  text: "Hello world! This is a test caption.",
};

const command = createFFmpegCommand(
  "/path/to/input.mp4",
  "/path/to/output.mp4",
  options
);

console.log(command);
// ffmpeg -i "/path/to/input.mp4" -vf "drawtext=text='Hello world! This is a test caption.':fontfile='/path/to/font.ttf':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=1750:box=1:boxcolor=black@0.7:borderw=3:bordercolor=black" -c:a copy -c:v libx264 -preset fast -crf 23 -y "/path/to/output.mp4"
```

### **Výpočet y pozice:**

```typescript
// Pro TikTok/IG Stories (1080x1920) s BOTTOM pozicí:
const layoutInput: LayoutInput = {
  videoWidth: 1080,
  videoHeight: 1920,
  position: "BOTTOM",
  lineHeightPx: 48 * 1.2, // fontSize * lineHeight
  linesCount: 2,
  avoidOverlays: true,
};

const layout = computeY(layoutInput);
console.log(layout.y); // ~1750 (vypočítaná pozice)
```

## 🎨 **UI integrace:**

### **V StylePicker komponentě:**

```typescript
// src/components/Video/StylePicker.tsx
export default function StylePicker({
  onStyleSelect,
  selectedStyle,
  onPositionChange,
}: Props) {
  const { position, setPosition } = useCaptionPosition({
    onPositionChange,
  });

  return (
    <div className={styles.container}>
      {/* Style selection */}
      <div className={styles.stylesGrid}>{/* ... style cards ... */}</div>

      {/* Caption Position Selector */}
      <div className={styles.positionSection}>
        <CaptionPositionSelector value={position} onChange={setPosition} />
      </div>

      {/* Preview */}
      {/* ... */}
    </div>
  );
}
```

## 📱 **Bezpečné oblasti:**

### **Konstanty:**

- **Top margin**: 10% výšky videa
- **Bottom margin**: 14% (standard) / 16% (s avoidOverlays)
- **Middle**: vycentrované podle počtu řádků

### **Příklad pro TikTok (1080x1920):**

- **Top margin**: 192px (10%)
- **Bottom margin**: 269px (14%) / 307px (16%)
- **Middle**: 960px (50% výšky)

## 🚀 **Použití v praxi:**

1. **Uživatel vybere pozici** → `CaptionPositionSelector`
2. **Hodnota se uloží** → `useCaptionPosition` hook
3. **Předá se do generátoru** → `onPositionChange` callback
4. **Vypočítá se y pozice** → `computeY()` funkce
5. **Vytvoří se FFmpeg command** → `createFFmpegCommand()`
6. **Rendruje se video** → s titulky na správné pozici

## ✅ **Výhody:**

- ✅ **Typová bezpečnost** - žádné `any`
- ✅ **Bezpečné oblasti** - respektuje TikTok/IG UI
- ✅ **Flexibilní** - podporuje všechny pozice
- ✅ **Přehledné** - rozděleno do modulů
- ✅ **Testovatelné** - čisté funkce
- ✅ **FFmpeg ready** - připravené pro rendering

**Vše je implementováno a připravené k použití!** 🎯
