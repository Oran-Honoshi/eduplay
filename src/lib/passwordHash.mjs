export const BCRYPT_PREFIX = /^\$2[aby]\$\d{2}\$/

export function isBcryptHash(value) {
  return BCRYPT_PREFIX.test(value)
}
