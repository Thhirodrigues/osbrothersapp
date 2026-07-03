/**
 * pixPayload.ts
 * Gera o payload EMV (copia-e-cola) do Pix com valor dinâmico.
 *
 * Usa a chave Pix de e-mail do estabelecimento, que suporta valor embutido
 * conforme especificação do Banco Central do Brasil (EMV QR Code Pix estático).
 */

// CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF)
function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Gera o payload Pix EMV estático com valor dinâmico.
 *
 * Dados do recebedor:
 *  - Chave Pix: osbrothersadega@gmail.com (e-mail)
 *  - Nome: OS BROTHERS ADEGA
 *  - Cidade: SAO PAULO
 *
 * @param valorReais - Valor em reais (ex: 42.50)
 */
export function gerarPixPayload(valorReais: number): string {
  // Formatar valor com 2 casas decimais, sem separador de milhar
  const valorStr = valorReais.toFixed(2);

  // ID 00 - Payload Format Indicator
  const payloadFormatIndicator = tlv('00', '01');

  // ID 01 - Point of Initiation Method (12 = estático)
  const pointOfInitiation = tlv('01', '12');

  // ID 26 - Merchant Account Information (GUI + chave Pix e-mail)
  const gui = tlv('00', 'BR.GOV.BCB.PIX');
  const chave = tlv('01', 'osbrothersadega@gmail.com');
  const merchantAccountInfo = tlv('26', gui + chave);

  // ID 52 - Merchant Category Code
  const merchantCategoryCode = tlv('52', '0000');

  // ID 53 - Transaction Currency (986 = BRL)
  const transactionCurrency = tlv('53', '986');

  // ID 54 - Transaction Amount (dinâmico — pré-preenche o valor no app do banco)
  const transactionAmount = tlv('54', valorStr);

  // ID 58 - Country Code
  const countryCode = tlv('58', 'BR');

  // ID 59 - Merchant Name (máx 25 chars)
  const merchantName = tlv('59', 'OS BROTHERS ADEGA');

  // ID 60 - Merchant City
  const merchantCity = tlv('60', 'SAO PAULO');

  // ID 62 - Additional Data Field Template (txid)
  const txid = tlv('05', '***');
  const additionalData = tlv('62', txid);

  // Montar payload sem CRC
  const payloadSemCRC =
    payloadFormatIndicator +
    pointOfInitiation +
    merchantAccountInfo +
    merchantCategoryCode +
    transactionCurrency +
    transactionAmount +
    countryCode +
    merchantName +
    merchantCity +
    additionalData +
    '6304'; // ID 63 + tamanho 04 (CRC virá a seguir)

  // Calcular CRC16
  const crc = crc16(payloadSemCRC);

  return payloadSemCRC + crc;
}
