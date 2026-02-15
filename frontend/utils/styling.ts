import { Dimensions, PixelRatio } from "react-native";

// 1️⃣ Ambil ukuran layar
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
// Ini ambil ukuran layar device sekarang.

// Misalnya:
// - iPhone kecil → 320px
// - Android gede → 412px
// - Tablet → bisa 768px++

// 2️⃣ Tentuin short & long dimension
const [shortDimension, longDimension] =
  SCREEN_WIDTH < SCREEN_HEIGHT
    ? [SCREEN_WIDTH, SCREEN_HEIGHT]
    : [SCREEN_HEIGHT, SCREEN_WIDTH];
// Karena layar bisa:
// - Portrait (tinggi > lebar)
// - Landscape (lebar > tinggi)

// Jadi kita pastikan:
// - shortDimension = sisi yang lebih pendek
// - longDimension = sisi yang lebih panjang

// Supaya scaling tetap konsisten walaupun rotate.

const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// 4️⃣ Fungsi scale
export const scale = (size: number) =>
  Math.round(
    PixelRatio.roundToNearestPixel(
      (shortDimension / guidelineBaseWidth) * (size as number),
    ),
  );
// Ini untuk horizontal scaling (lebar, font size, margin horizontal).

// Cara kerjanya:
// (shortDimension / 375) * size

// Contoh:
// Device width = 414
// size = 16

// Maka:
// (414 / 375) * 16 ≈ 17.6

// Jadi font 16 jadi 18 kira-kira.
// Kalau layar lebih kecil → otomatis mengecil.

// 5️⃣ Fungsi verticalScale
export const verticalScale = (size: number) =>
  Math.round(
    PixelRatio.roundToNearestPixel(
      (longDimension / guidelineBaseHeight) * (size as number),
    ),
  );
// Ini buat vertical scaling (height, margin vertical).

// Kenapa dipisah?

// Karena:
// - Tinggi device beda-beda jauh
// - Aspek rasio beda
// - Kadang lebar nggak terlalu beda tapi tinggi jauh beda
// - Jadi supaya proporsi tetap enak.
