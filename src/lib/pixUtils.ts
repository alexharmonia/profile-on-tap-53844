/**
 * Gera um payload PIX válido seguindo o padrão EMVCo (BACEN)
 * 
 * @param pixKey - Chave PIX (CPF, CNPJ, email, telefone ou aleatória)
 * @param merchantName - Nome do beneficiário (até 25 caracteres)
 * @param merchantCity - Cidade do beneficiário (até 15 caracteres)
 * @param amount - Valor da transação (opcional)
 * @param txid - ID da transação (opcional, até 25 caracteres)
 * @returns Payload PIX válido com CRC16
 */
export function generatePixPayload(
  pixKey: string,
  merchantName: string,
  merchantCity: string,
  amount?: number,
  txid?: string
): string {
  // Remove caracteres especiais e normaliza
  const normalizedKey = pixKey.replace(/[^\w@.\-+]/g, '');
  const normalizedName = removeAccents(merchantName.substring(0, 25).toUpperCase());
  const normalizedCity = removeAccents(merchantCity.substring(0, 15).toUpperCase());
  
  // Payload IDs conforme padrão EMVCo
  const PAYLOAD_FORMAT_INDICATOR = '01'; // Versão do payload
  const MERCHANT_ACCOUNT_INFORMATION = '26'; // Informações da conta
  const MERCHANT_CATEGORY_CODE = '52'; // Categoria (0000 = não especificado)
  const TRANSACTION_CURRENCY = '53'; // Moeda (986 = BRL)
  const TRANSACTION_AMOUNT = '54'; // Valor
  const COUNTRY_CODE = '58'; // País (BR)
  const MERCHANT_NAME = '59'; // Nome
  const MERCHANT_CITY = '60'; // Cidade
  const ADDITIONAL_DATA = '62'; // Dados adicionais
  const CRC16 = '63'; // CRC
  
  // GUI do arranjo Pix (identificador único)
  const PIX_GUI = '0014br.gov.bcb.pix';
  
  // Monta a informação da conta (ID 26)
  let accountInfo = buildTLV('00', PIX_GUI); // GUI do Pix
  accountInfo += buildTLV('01', normalizedKey); // Chave PIX
  
  // Inicia o payload
  let payload = '';
  payload += buildTLV(PAYLOAD_FORMAT_INDICATOR, '01'); // Versão
  payload += buildTLV(MERCHANT_ACCOUNT_INFORMATION, accountInfo); // Conta
  payload += buildTLV(MERCHANT_CATEGORY_CODE, '0000'); // Categoria
  payload += buildTLV(TRANSACTION_CURRENCY, '986'); // BRL
  
  // Adiciona valor se especificado
  if (amount && amount > 0) {
    const formattedAmount = amount.toFixed(2);
    payload += buildTLV(TRANSACTION_AMOUNT, formattedAmount);
  }
  
  payload += buildTLV(COUNTRY_CODE, 'BR'); // País
  payload += buildTLV(MERCHANT_NAME, normalizedName); // Nome
  payload += buildTLV(MERCHANT_CITY, normalizedCity); // Cidade
  
  // Adiciona dados adicionais (txid)
  if (txid) {
    const normalizedTxid = txid.substring(0, 25);
    const additionalData = buildTLV('05', normalizedTxid);
    payload += buildTLV(ADDITIONAL_DATA, additionalData);
  }
  
  // Adiciona placeholder para CRC
  payload += CRC16 + '04';
  
  // Calcula e adiciona CRC16
  const crc = calculateCRC16(payload);
  payload += crc;
  
  return payload;
}

/**
 * Constrói um campo TLV (Tag-Length-Value)
 */
function buildTLV(tag: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return tag + length + value;
}

/**
 * Calcula o CRC16-CCITT para o payload PIX
 */
function calculateCRC16(payload: string): string {
  let crc = 0xFFFF;
  
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  
  crc &= 0xFFFF;
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Remove acentos de uma string
 */
function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Formata um valor monetário para o padrão brasileiro
 */
export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

/**
 * Aplica máscara de moeda enquanto o usuário digita
 */
export function applyCurrencyMask(value: string): string {
  // Remove tudo que não é número
  let numbers = value.replace(/\D/g, '');
  
  // Se vazio, retorna vazio
  if (numbers === '') return '';
  
  // Converte para centavos
  const cents = parseInt(numbers);
  const reais = (cents / 100).toFixed(2);
  
  // Formata para padrão brasileiro
  return formatCurrency(reais);
}

/**
 * Converte valor formatado (R$ 1.234,56) para número decimal
 */
export function parseCurrencyToNumber(value: string): number {
  const numbers = value.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(numbers) || 0;
}
