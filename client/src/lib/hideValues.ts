/**
 * Utilidades para ocultar/mostrar valores
 */

/**
 * Formata um valor monetário, ocultando-o se necessário
 * @param valor - Valor em reais (pode ser número ou string)
 * @param isHidden - Se deve ocultar o valor
 * @returns Valor formatado ou "R$ ***,**" se oculto
 */
export function formatarValorComOcultacao(
  valor: number | string | undefined,
  isHidden: boolean
): string {
  if (valor === undefined || valor === null || isNaN(Number(valor))) {
    return isHidden ? 'R$ •••,••' : 'R$ 0,00';
  }

  if (isHidden) {
    return 'R$ •••,••';
  }

  const num = typeof valor === 'string' ? parseFloat(valor) : valor;
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
}

/**
 * Oculta um valor numérico com asteriscos
 * @param valor - Valor a ocultar
 * @param isHidden - Se deve ocultar
 * @returns Valor ou "***" se oculto
 */
export function ocultarValor(valor: any, isHidden: boolean): string | number {
  if (isHidden) {
    return '•••';
  }
  return valor;
}

/**
 * Oculta um texto/descrição
 * @param texto - Texto a ocultar
 * @param isHidden - Se deve ocultar
 * @returns Texto ou "***" se oculto
 */
export function ocultarTexto(texto: string | undefined, isHidden: boolean): string {
  if (isHidden && texto) {
    return '•••';
  }
  return texto || '';
}
