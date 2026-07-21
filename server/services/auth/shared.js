'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const OTP_EXPIRATION_MINUTES = 15;

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

function buildOtpCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function buildOtpExpirationDate() {
  return new Date(Date.now() + (OTP_EXPIRATION_MINUTES * 60 * 1000));
}

module.exports = {
  generateToken,
  buildOtpCode,
  buildOtpExpirationDate,
  OTP_EXPIRATION_MINUTES,
};
