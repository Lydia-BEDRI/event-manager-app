import nodemailer from 'nodemailer';

const DEFAULT_SMTP_PORT = 1025;

function getSmtpPort(): number {
  const port = Number(process.env.SMTP_PORT || DEFAULT_SMTP_PORT);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('SMTP_PORT must be a valid TCP port.');
  }

  return port;
}

function getTransport() {
  const port = getSmtpPort();
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if ((user && !password) || (!user && password)) {
    throw new Error('SMTP_USER and SMTP_PASSWORD must be configured together.');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port,
    secure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === 'true'
      : port === 465,
    auth: user && password ? { user, pass: password } : undefined,
  });
}

export interface PasswordResetEmail {
  to: string;
  resetLink: string;
  expiresInMinutes: number;
}

export async function sendPasswordResetEmail({
  to,
  resetLink,
  expiresInMinutes,
}: PasswordResetEmail): Promise<void> {
  const from = process.env.SMTP_FROM || 'EventManager <no-reply@eventmanager.local>';

  await getTransport().sendMail({
    from,
    to,
    subject: 'Réinitialisation de votre mot de passe EventManager',
    text: [
      'Bonjour,',
      '',
      'Une demande de réinitialisation de mot de passe a été effectuée pour votre compte EventManager.',
      `Utilisez ce lien dans les ${expiresInMinutes} prochaines minutes :`,
      resetLink,
      '',
      "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
    ].join('\n'),
    html: `
      <!doctype html>
      <html lang="fr">
        <body style="margin:0;background:#f4f6f8;font-family:Arial,sans-serif;color:#17202a">
          <div style="max-width:600px;margin:0 auto;padding:32px 16px">
            <div style="background:#ffffff;border:1px solid #e5e7eb;padding:32px">
              <h1 style="margin:0 0 20px;font-size:24px">Réinitialisation du mot de passe</h1>
              <p style="line-height:1.6">Une demande de réinitialisation a été effectuée pour votre compte EventManager.</p>
              <p style="line-height:1.6">Ce lien est valable pendant ${expiresInMinutes} minutes.</p>
              <p style="margin:28px 0">
                <a href="${resetLink}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 20px;text-decoration:none;font-weight:600">
                  Réinitialiser mon mot de passe
                </a>
              </p>
              <p style="line-height:1.6;color:#5f6b7a">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}
