'use strict';
const Joi = require('joi');

const registerSchema = Joi.object({
  username: Joi.string()
    .pattern(/^[A-Za-z0-9._-]+$/)
    .min(3)
    .max(25)
    .required()
    .messages({ 'string.pattern.base': 'El username solo puede contener letras, números, puntos, guiones bajos y guiones.' }),
  // Name: only letters and spaces (allow accents). No numbers or emojis.
  name: Joi.string()
    .pattern(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/)
    .min(3)
    .max(120)
    .optional()
    .messages({ 'string.pattern.base': 'El nombre solo puede contener letras y espacios.' }),
  // Email: stricter ASCII-like email (disallow spaces/emojis), must contain '@'
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .pattern(/^[\w.%+\-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)
    .max(160)
    .required()
    .messages({ 'string.pattern.base': 'Email inválido. Use formato correo válido sin caracteres especiales.' }),
  password: Joi.string().min(6).max(200).required(),
});

const googleLoginSchema = Joi.object({
  token: Joi.string().min(10).required(),
});

const loginSchema = Joi.object({
  username: Joi.string().pattern(/^[A-Za-z0-9._-]+$/).min(3).max(120).optional().messages({ 'string.pattern.base': 'El username solo puede contener letras, números, puntos, guiones bajos y guiones.' }),
  email: Joi.string().email().max(160).optional(),
  password: Joi.string().min(6).max(200).required(),
}).xor('username', 'email');

const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .pattern(/^[\w.%+\-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)
    .max(160)
    .required()
    .messages({ 'string.pattern.base': 'Email inválido. Use formato correo válido sin caracteres especiales.' }),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().min(20).max(255).required(),
  newPassword: Joi.string().min(6).max(200).required(),
});

const updateProfileSchema = Joi.object({
  username: Joi.string()
    .pattern(/^[A-Za-z0-9._-]+$/)
    .min(3)
    .max(25)
    .optional()
    .messages({ 'string.pattern.base': 'El username solo puede contener letras, números, puntos, guiones bajos y guiones.' }),
  name: Joi.string()
    .pattern(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/)
    .min(3)
    .max(120)
    .optional()
    .messages({ 'string.pattern.base': 'El nombre solo puede contener letras y espacios.' }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .pattern(/^[\w.%+\-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)
    .max(160)
    .optional()
    .messages({ 'string.pattern.base': 'Email inválido. Use formato correo válido sin caracteres especiales.' }),
}).or('name', 'username', 'email');

const requestEmailChangeSchema = Joi.object({
  currentPassword: Joi.string().min(6).max(200).optional(),
});

const verifyOldEmailOtpSchema = Joi.object({
  code: Joi.string().pattern(/^\d{6}$/).required().messages({
    'string.pattern.base': 'El código OTP debe tener 6 dígitos numéricos.',
  }),
  newEmail: Joi.string()
    .email({ tlds: { allow: false } })
    .pattern(/^[\w.%+\-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)
    .max(160)
    .required()
    .messages({ 'string.pattern.base': 'Email inválido. Use formato correo válido sin caracteres especiales.' }),
});

const confirmNewEmailSchema = Joi.object({
  code: Joi.string().pattern(/^\d{6}$/).required().messages({
    'string.pattern.base': 'El código OTP debe tener 6 dígitos numéricos.',
  }),
  newEmail: Joi.string()
    .email({ tlds: { allow: false } })
    .pattern(/^[\w.%+\-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)
    .max(160)
    .required()
    .messages({ 'string.pattern.base': 'Email inválido. Use formato correo válido sin caracteres especiales.' }),
});

const unlinkGoogleSchema = Joi.object({
  newPassword: Joi.string().min(6).max(200).required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(6).max(200).required(),
  newPassword: Joi.string().min(8).max(200).required(),
});

module.exports = {
  registerSchema,
  googleLoginSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  requestEmailChangeSchema,
  verifyOldEmailOtpSchema,
  confirmNewEmailSchema,
  unlinkGoogleSchema,
  changePasswordSchema,
};