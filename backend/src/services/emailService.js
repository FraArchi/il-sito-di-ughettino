const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  async init() {
    if (process.env.SENDGRID_API_KEY) {
      // Use SendGrid
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      logger.info('Email service initialized with SendGrid');
    } else {
      try {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'localhost',
          port: process.env.SMTP_PORT || 1025,
          secure: false,
          auth: process.env.SMTP_USER ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          } : undefined
        });
        logger.info('Email service initialized with SMTP');
      } catch (e) {
        logger.error('Failed to init SMTP transporter', e);
      }
    }
  }

  // Send email via SendGrid
  async sendWithSendGrid(to, subject, html, text) {
    try {
      const msg = {
        to,
        from: {
          email: process.env.FROM_EMAIL,
          name: 'Il Mondo di Ugo'
        },
        subject,
        text: text || html.replace(/<[^>]*>/g, ''),
        html
      };

      await sgMail.send(msg);
      logger.info('Email sent via SendGrid:', { to, subject });
      return true;
    } catch (error) {
      logger.error('SendGrid error:', error);
      throw error;
    }
  }

  // Send email via SMTP
  async sendWithSMTP(to, subject, html, text) {
    try {
      const mailOptions = {
        from: `"Il Mondo di Ugo" <${process.env.FROM_EMAIL}>`,
        to,
        subject,
        text: text || html.replace(/<[^>]*>/g, ''),
        html
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Email sent via SMTP:', { to, subject });
      return true;
    } catch (error) {
      logger.error('SMTP error:', error);
      throw error;
    }
  }

  // Generic send method
  async send(to, subject, html, text) {
    if (process.env.SENDGRID_API_KEY) {
      return await this.sendWithSendGrid(to, subject, html, text);
    } else {
      return await this.sendWithSMTP(to, subject, html, text);
    }
  }

  // Email verification
  async sendVerificationEmail(user, token) {
    const verificationUrl = `${process.env.CORS_ORIGIN}/verify-email?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verifica il tuo account - Il Mondo di Ugo</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #b97a56, #d35400);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            background: #b97a56;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            margin: 20px 0;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding: 20px;
            font-size: 12px;
            color: #666;
          }
          .ugo-icon {
            font-size: 24px;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="ugo-icon">🐕</div>
          <h1>Benvenuto nel Mondo di Ugo!</h1>
          <p>Ciao ${user.firstName}, grazie per esserti registrato!</p>
        </div>
        
        <div class="content">
          <h2>Verifica il tuo indirizzo email</h2>
          <p>Per completare la registrazione e iniziare la tua avventura nel mondo di Ugo, devi verificare il tuo indirizzo email.</p>
          
          <p>Clicca sul pulsante qui sotto per verificare il tuo account:</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verifica il mio account</a>
          </div>
          
          <p>Se il pulsante non funziona, copia e incolla questo link nel tuo browser:</p>
          <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">
            ${verificationUrl}
          </p>
          
          <p><strong>Cosa ti aspetta:</strong></p>
          <ul>
            <li>🎮 Sistema di gamificazione con punti e achievements</li>
            <li>📚 Storie interattive di Ugo</li>
            <li>🧠 Quiz divertenti</li>
            <li>📸 Photo booth per le foto del tuo cane</li>
            <li>👥 Community di amanti dei cani</li>
          </ul>
          
          <p>Questo link scadrà tra 24 ore per motivi di sicurezza.</p>
        </div>
        
        <div class="footer">
          <p>Se non ti sei registrato tu, ignora questa email.</p>
          <p>© 2024 Il Mondo di Ugo - Francesco Archi</p>
        </div>
      </body>
      </html>
    `;

    const text = `
      Benvenuto nel Mondo di Ugo!
      
      Ciao ${user.firstName}, grazie per esserti registrato!
      
      Per completare la registrazione, verifica il tuo indirizzo email cliccando su questo link:
      ${verificationUrl}
      
      Questo link scadrà tra 24 ore per motivi di sicurezza.
      
      Se non ti sei registrato tu, ignora questa email.
      
      © 2024 Il Mondo di Ugo - Francesco Archi
    `;

    return await this.send(
      user.email,
      '🐕 Verifica il tuo account - Il Mondo di Ugo',
      html,
      text
    );
  }

  // Password reset email
  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${process.env.CORS_ORIGIN}/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password - Il Mondo di Ugo</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #b97a56, #d35400);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            background: #d35400;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            margin: 20px 0;
            font-weight: bold;
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔒 Reset Password</h1>
          <p>Richiesta di cambio password per ${user.firstName}</p>
        </div>
        
        <div class="content">
          <h2>Hai richiesto di cambiare la password</h2>
          <p>Abbiamo ricevuto una richiesta per reimpostare la password del tuo account.</p>
          
          <div class="warning">
            <strong>⚠️ Importante:</strong> Se non hai richiesto tu questo reset, ignora questa email. La tua password rimarrà invariata.
          </div>
          
          <p>Per reimpostare la password, clicca sul pulsante qui sotto:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reimposta Password</a>
          </div>
          
          <p>Se il pulsante non funziona, copia e incolla questo link nel tuo browser:</p>
          <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">
            ${resetUrl}
          </p>
          
          <p><strong>Questo link scadrà tra 1 ora</strong> per motivi di sicurezza.</p>
          
          <p>Una volta reimpostata la password, tutte le sessioni attive verranno terminate e dovrai effettuare nuovamente il login.</p>
        </div>
        
        <div class="footer">
          <p>Se hai problemi, contatta il supporto: ${process.env.SUPPORT_EMAIL}</p>
          <p>© 2024 Il Mondo di Ugo - Francesco Archi</p>
        </div>
      </body>
      </html>
    `;

    const text = `
      Reset Password - Il Mondo di Ugo
      
      Ciao ${user.firstName},
      
      Hai richiesto di cambiare la password del tuo account.
      
      Se non hai richiesto tu questo reset, ignora questa email.
      
      Per reimpostare la password, visita questo link:
      ${resetUrl}
      
      Questo link scadrà tra 1 ora per motivi di sicurezza.
      
      © 2024 Il Mondo di Ugo - Francesco Archi
    `;

    return await this.send(
      user.email,
      '🔒 Reset della password - Il Mondo di Ugo',
      html,
      text
    );
  }

  // Welcome email after verification
  async sendWelcomeEmail(user) {
    const html = `
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Benvenuto nel Mondo di Ugo!</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #b97a56, #d35400);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .feature {
            background: white;
            margin: 15px 0;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #b97a56;
          }
          .button {
            display: inline-block;
            background: #b97a56;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            margin: 20px 0;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Benvenuto nel Mondo di Ugo!</h1>
          <p>Il tuo account è ora attivo, ${user.firstName}!</p>
        </div>
        
        <div class="content">
          <h2>Sei ufficialmente parte della famiglia! 🐕</h2>
          <p>Congratulazioni! Hai completato la registrazione e ora puoi goderti tutte le fantastiche funzionalità del mondo di Ugo.</p>
          
          <div class="feature">
            <h3>🎮 Sistema di Gamificazione</h3>
            <p>Guadagna punti completando attività, sblocca achievements e scala la classifica!</p>
          </div>
          
          <div class="feature">
            <h3>📚 Storie Interattive</h3>
            <p>Vivi avventure emozionanti con Ugo attraverso storie a bivi interattive.</p>
          </div>
          
          <div class="feature">
            <h3>🧠 Quiz su Ugo</h3>
            <p>Metti alla prova la tua conoscenza del mondo di Ugo con quiz divertenti.</p>
          </div>
          
          <div class="feature">
            <h3>📸 Photo Booth</h3>
            <p>Crea foto divertenti del tuo cane con filtri e decorazioni a tema Ugo.</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.CORS_ORIGIN}" class="button">Inizia l'Avventura!</a>
          </div>
          
          <p><strong>I tuoi primi passi:</strong></p>
          <ol>
            <li>Completa il tuo profilo con una foto</li>
            <li>Aggiungi informazioni sul tuo cane</li>
            <li>Fai il primo quiz per guadagnare punti</li>
            <li>Esplora le storie interattive</li>
            <li>Connettiti con altri amanti dei cani</li>
          </ol>
          
          <p>Buon divertimento nel mondo di Ugo! 🐾</p>
        </div>
      </body>
      </html>
    `;

    return await this.send(
      user.email,
      '🎉 Benvenuto nel Mondo di Ugo!',
      html
    );
  }

  // Notification email for new post
  async sendNewPostNotification(subscribers, post) {
    const postUrl = `${process.env.CORS_ORIGIN}/posts/${post.slug}`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nuovo Post - ${post.title}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #b97a56, #d35400);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .post-preview {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            background: #b97a56;
            color: white;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 25px;
            margin: 15px 0;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📝 Nuovo Post da Ugo!</h1>
        </div>
        
        <div class="content">
          <div class="post-preview">
            <h2>${post.title}</h2>
            ${post.coverImage ? `<img src="${post.coverImage}" alt="${post.title}" style="max-width: 100%; border-radius: 10px;">` : ''}
            <p>${post.excerpt || post.content.substring(0, 200)}...</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${postUrl}" class="button">Leggi l'Articolo Completo</a>
          </div>
          
          <p><small>Hai ricevuto questa email perché sei iscritto alle notifiche. <a href="${process.env.CORS_ORIGIN}/unsubscribe">Annulla iscrizione</a></small></p>
        </div>
      </body>
      </html>
    `;

    // Send to all subscribers
    const promises = subscribers.map(subscriber => 
      this.send(
        subscriber.email,
        `📝 Nuovo post: ${post.title}`,
        html
      )
    );

    return await Promise.allSettled(promises);
  }

  // Achievement unlocked email
  async sendAchievementEmail(user, achievement) {
    const html = `
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Achievement Sbloccato!</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #f1c40f, #f39c12);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .achievement {
            background: white;
            padding: 30px;
            text-align: center;
            border-radius: 0 0 10px 10px;
            border: 3px solid #f1c40f;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
          .points {
            background: #b97a56;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            display: inline-block;
            margin: 15px 0;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Achievement Sbloccato!</h1>
          <p>Congratulazioni ${user.firstName}!</p>
        </div>
        
        <div class="achievement">
          <div class="icon">${achievement.icon}</div>
          <h2>${achievement.name}</h2>
          <p>${achievement.description}</p>
          <div class="points">+${achievement.points} punti!</div>
          
          <p>Continua così per sbloccare altri achievements!</p>
          
          <a href="${process.env.CORS_ORIGIN}/dashboard" style="color: #b97a56; text-decoration: none; font-weight: bold;">Vedi tutti i tuoi achievements →</a>
        </div>
      </body>
      </html>
    `;

    return await this.send(
      user.email,
      `🏆 Achievement Sbloccato: ${achievement.name}`,
      html
    );
  }
}

module.exports = new EmailService();
