import { body } from 'express-validator';

export const registerValidation = [
  body('email')
    .isEmail().withMessage('Email invalide.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 12 }).withMessage('Le mot de passe doit contenir au moins 12 caractères.')
    .matches(/[a-z]/).withMessage('Le mot de passe doit contenir une minuscule.')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir une majuscule.')
    .matches(/\d/).withMessage('Le mot de passe doit contenir un chiffre.')
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/).withMessage('Le mot de passe doit contenir un caractère spécial.'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Le prénom doit contenir entre 2 et 100 caractères.'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères.'),
];

export const loginValidation = [
  body('email')
    .isEmail().withMessage('Email invalide.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis.'),
];

export const forgotPasswordValidation = [
  body('email')
    .isEmail().withMessage('Email invalide.')
    .normalizeEmail(),
];

export const resetPasswordValidation = [
  body('token')
    .notEmpty().withMessage('Le token est requis.'),
  body('password')
    .isLength({ min: 12 }).withMessage('Le mot de passe doit contenir au moins 12 caractères.')
    .matches(/[a-z]/).withMessage('Le mot de passe doit contenir une minuscule.')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir une majuscule.')
    .matches(/\d/).withMessage('Le mot de passe doit contenir un chiffre.')
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/).withMessage('Le mot de passe doit contenir un caractère spécial.'),
];
