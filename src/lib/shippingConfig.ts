/**
 * إعدادات الشحن حسب الولايات
 * تحدد أي الولايات مدعومة بالكامل، وأيها تدعم المنزل فقط، وأيها غير مدعومة إطلاقاً
 */

// الولايات غير المدعومة إطلاقاً (لا منزل ولا مكتب شحن)
export const UNSUPPORTED_WILAYA_IDS: string[] = ['33', '50', '54', '56'];

// الولايات التي تدعم التوصيل للمنزل فقط (لا يوجد مكتب شحن)
export const HOME_ONLY_WILAYA_IDS: string[] = ['1', '11', '37', '41', '49', '51', '52', '53', '55', '57', '58'];

export type WilayaSupportType = 'full' | 'home_only' | 'none';

/**
 * تُرجع نوع الدعم المتاح للولاية
 * @param wilayaId - رقم الولاية (string)
 */
export function getWilayaSupportType(wilayaId: string): WilayaSupportType {
  if (UNSUPPORTED_WILAYA_IDS.includes(wilayaId)) return 'none';
  if (HOME_ONLY_WILAYA_IDS.includes(wilayaId)) return 'home_only';
  return 'full';
}

/**
 * تُرجع true إذا كانت الولاية مدعومة (إما full أو home_only)
 */
export function isWilayaSupported(wilayaId: string): boolean {
  return getWilayaSupportType(wilayaId) !== 'none';
}

/**
 * تُرجع true إذا كانت الولاية تدعم التوصيل للمكتب
 */
export function isDeskShippingAvailable(wilayaId: string): boolean {
  return getWilayaSupportType(wilayaId) === 'full';
}

/**
 * تُرجع true إذا كانت الولاية تدعم التوصيل للمنزل
 */
export function isHomeShippingAvailable(wilayaId: string): boolean {
  return getWilayaSupportType(wilayaId) !== 'none';
}