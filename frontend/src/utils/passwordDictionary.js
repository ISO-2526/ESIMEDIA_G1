// Lista de contraseñas comunes que SÍ cumplen con las políticas de seguridad
// (12+ caracteres, mayúsculas, minúsculas, números y caracteres especiales)
const commonPasswords = [
  'Password123!', 'Welcome123!', 'Admin123456!', 'P@ssw0rd123', 'Qwerty123456!',
  'Password1234!', 'Welcome1234!', 'Admin1234567!', 'Changeme123!', 'Default123!',
  'P@ssword123', 'Qwerty12345!', 'Football123!', 'Baseball123!', 'Basketball1!',
  'Superman123!', 'Batman12345!', 'Spiderman12!', 'Computer123!', 'Internet123!',
  'Summer123456!', 'Winter123456!', 'Spring123456!', 'Autumn123456!',
  'January12345!', 'February123!', 'December123!', 'Monday123456!', 'Friday123456!',
  'Welcome@2024', 'Password@2024', 'Admin@123456', 'User@1234567', 'Test@1234567',
  'Hello@123456', 'World@123456', 'System@12345', 'Access@12345', 'Secret@12345',
  '123456Aa!@#$', '12345678Aa!@', 'Aa123456!@#$', 'Qwerty123!@#', 'Asdfgh123!@#',
  'Zxcvbn123!@#', 'Qwertyuiop1!', 'Asdfghjkl12!', 'Zxcvbnm1234!',
  'Liverpool123!', 'Chelsea1234!', 'Arsenal1234!', 'Barcelona12!', 'Madrid12345!',
  'Juventus123!', 'Pokemon1234!', 'Naruto12345!', 'Dragonball1!', 'Starwars123!',
  'Microsoft12!', 'Google12345!', 'Amazon12345!', 'Facebook123!', 'Instagram12!',
  'Iloveyou123!', 'Sunshine123!', 'Princess123!', 'Butterfly12!', 'Rainbow1234!',
  'Password!123', 'Welcome!1234', 'Admin!123456', 'Summer!12345', 'Winter!12345'
];

// Palabras base comunes que pueden combinarse con números y símbolos
const commonBaseWords = [
  'password', 'welcome', 'admin', 'user', 'test', 'guest', 'root', 'master',
  'administrator', 'default', 'changeme', 'secret', 'access', 'system',
  'qwerty', 'asdfgh', 'zxcvbn', 'hello', 'world', 'computer', 'internet',
  'football', 'baseball', 'basketball', 'soccer', 'dragon', 'tiger', 'eagle',
  'superman', 'batman', 'spiderman', 'ironman', 'captain', 'wonder',
  'princess', 'sunshine', 'rainbow', 'butterfly', 'iloveyou', 'trustno',
  'liverpool', 'chelsea', 'arsenal', 'barcelona', 'madrid', 'juventus',
  'pokemon', 'naruto', 'dragonball', 'starwars', 'matrix', 'terminator',
  'microsoft', 'google', 'amazon', 'facebook', 'instagram', 'twitter','esimedia',
  'samsung', 'apple', 'windows', 'android', 'iphone', 'linux'
];

export const isCommonPassword = (password) => {
  if (!password) return false;
  
  const lowerPassword = password.toLowerCase();
  
  // Verificar si está en el diccionario de contraseñas comunes completas
  const lowerCommonPasswords = commonPasswords.map(p => p.toLowerCase());
  if (lowerCommonPasswords.includes(lowerPassword)) {
    return true;
  }
  
  // Verificar si contiene alguna palabra base común
  for (const baseWord of commonBaseWords) {
    if (lowerPassword.includes(baseWord)) {
      return true;
    }
  }
  
  // Verificar patrones comunes de teclado (incluso con números y símbolos)
  const keyboardPatterns = [
    'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
    'qwerty', 'asdfgh', 'zxcvb',
    '1234567890', '0987654321', '12345678',
    'qweasd', 'zxcasd', 'qazwsx'
  ];
  
  for (const pattern of keyboardPatterns) {
    if (lowerPassword.includes(pattern)) {
      return true;
    }
  }
  
  // Verificar secuencias repetitivas (aaa, 111, !!!)
  const repeatedChars = /(.)\1{2,}/;
  if (repeatedChars.test(password)) {
    return true;
  }
  
  // Verificar patrones de fecha (2024, 2023, etc.)
  const datePatterns = /20[0-9]{2}|19[0-9]{2}/;
  if (datePatterns.test(password)) {
    // Si contiene un año y una palabra común, es débil
    for (const baseWord of commonBaseWords) {
      if (lowerPassword.includes(baseWord)) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * ✅ NUEVA: Validar que la contraseña no contenga información personal
 */
export const containsPersonalInfo = (password, email, name, surname, alias) => {
  if (!password) return false;
  const passwordLower = password.toLowerCase();
  const emailPrefix = email ? email.split('@')[0] : null;

  // Helper para evitar repetir lógica y reducir complejidad
  const hasMatch = (candidate) =>
    candidate &&
    candidate.length >= 3 &&
    passwordLower.includes(candidate.toLowerCase());

  return (
    hasMatch(emailPrefix) ||
    hasMatch(name) ||
    hasMatch(surname) ||
    hasMatch(alias)
  );
};

/**
 * ✅ ACTUALIZADA: Validación completa de fortaleza de contraseña
 */
export const validatePasswordStrength = (password, email = null, name = null, surname = null, alias = null) => {
  const errors = [];
  
  if (password.length < 12) {
    errors.push('❌ La contraseña debe tener al menos 12 caracteres.');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('❌ Debe incluir al menos una letra mayúscula.');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('❌ Debe incluir al menos una letra minúscula.');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('❌ Debe incluir al menos un número.');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('❌ Debe incluir al menos un carácter especial (!@#$%^&*(),.?":{}|<>).');
  }
  
  if (isCommonPassword(password)) {
    errors.push('❌ Esta contraseña es muy común y no es segura. Por favor, elige otra.');
  }
  
  // ✅ NUEVA: Validar información personal
  if (containsPersonalInfo(password, email, name, surname, alias)) {
    errors.push('❌ La contraseña no puede contener tu email, nombre, apellido o alias.');
  }
  
  return errors;
};