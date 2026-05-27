import { z } from 'zod';

export const panValidator = z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format');
export const gstinValidator = z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format');
export const ifscValidator = z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC format');
export const pincodeValidator = z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid Pincode format');
export const indianPhoneValidator = z.string().regex(/^(?:\+91|91)?[6789]\d{9}$/, 'Invalid Indian Phone Number format');
