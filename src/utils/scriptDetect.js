const BENGALI_ASSAMESE_RANGE = /[ঀ-৿]/;

export function isAssameseScript(text) {
  return BENGALI_ASSAMESE_RANGE.test(text);
}
