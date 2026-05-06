import { createContext, useContext } from 'react';

/**
 * True только внутри холста Page Constructor (/constructor).
 * Компоненты блоков могут показывать образцы (моки) для редактирования — на витрине контекст по умолчанию false.
 */
const ConstructorCanvasPreviewContext = createContext(false);

export const ConstructorCanvasPreviewProvider = ConstructorCanvasPreviewContext.Provider;

export function useConstructorCanvasPreview(): boolean {
  return useContext(ConstructorCanvasPreviewContext);
}
