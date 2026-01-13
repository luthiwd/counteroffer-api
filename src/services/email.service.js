const nodemailer = require('nodemailer');

// Configurar transporter (en producción usar variables de entorno)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const SHOP_NAME = process.env.SHOP_NAME || 'Mi Tienda';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

// Email: Oferta aceptada (con cupón)
exports.sendAcceptedEmail = async (offer, product) => {
  if (!process.env.SMTP_USER) {
    console.log('[EMAIL MOCK] Sending accepted email to:', offer.customerEmail);
    console.log('[EMAIL MOCK] Coupon code:', offer.couponCode);
    return true;
  }

  const mailOptions = {
    from: `"${SHOP_NAME}" <${process.env.SMTP_USER}>`,
    to: offer.customerEmail,
    subject: '¡Tu oferta ha sido aceptada!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4CAF50;">¡Enhorabuena ${offer.customerName || 'Cliente'}!</h1>
        
        <p>Tu oferta para el producto <strong>${product.title}</strong> ha sido aceptada.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Precio original:</strong> ${offer.productPrice.toFixed(2)}€</p>
          <p><strong>Tu oferta:</strong> ${offer.offeredPrice.toFixed(2)}€</p>
          <p><strong>Descuento:</strong> ${offer.discountPercentage.toFixed(2)}%</p>
        </div>
        
        <div style="background: #4CAF50; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;">Tu código de descuento:</p>
          <p style="margin: 10px 0; font-size: 24px; font-weight: bold; letter-spacing: 2px;">${offer.couponCode}</p>
        </div>
        
        <p>Usa este código en tu próxima compra para obtener tu descuento.</p>
        
        <p style="color: #666; font-size: 12px;">Este cupón es válido solo para el producto indicado y de un solo uso.</p>
        
        <p>Saludos,<br><strong>${SHOP_NAME}</strong></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending accepted email:', error);
    return false;
  }
};

// Email: Oferta pendiente (confirmación de recepción)
exports.sendPendingEmail = async (offer, product) => {
  if (!process.env.SMTP_USER) {
    console.log('[EMAIL MOCK] Sending pending email to:', offer.customerEmail);
    return true;
  }

  const mailOptions = {
    from: `"${SHOP_NAME}" <${process.env.SMTP_USER}>`,
    to: offer.customerEmail,
    subject: 'Hemos recibido tu oferta',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2196F3;">Hemos recibido tu oferta</h1>
        
        <p>Hola ${offer.customerName || 'Cliente'},</p>
        
        <p>Hemos recibido tu oferta para el producto <strong>${product.title}</strong>.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Precio original:</strong> ${offer.productPrice.toFixed(2)}€</p>
          <p><strong>Tu oferta:</strong> ${offer.offeredPrice.toFixed(2)}€</p>
          <p><strong>Descuento solicitado:</strong> ${offer.discountPercentage.toFixed(2)}%</p>
        </div>
        
        <p>Nuestro equipo está revisando tu solicitud y nos pondremos en contacto contigo pronto.</p>
        
        <p>Saludos,<br><strong>${SHOP_NAME}</strong></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending pending email:', error);
    return false;
  }
};

// Email: Oferta rechazada
exports.sendRejectedEmail = async (offer, product) => {
  if (!process.env.SMTP_USER) {
    console.log('[EMAIL MOCK] Sending rejected email to:', offer.customerEmail);
    return true;
  }

  const mailOptions = {
    from: `"${SHOP_NAME}" <${process.env.SMTP_USER}>`,
    to: offer.customerEmail,
    subject: 'Actualización sobre tu oferta',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f44336;">Actualización sobre tu oferta</h1>
        
        <p>Hola ${offer.customerName || 'Cliente'},</p>
        
        <p>Lamentamos informarte que no hemos podido aceptar tu oferta para el producto <strong>${product.title}</strong>.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Precio del producto:</strong> ${offer.productPrice.toFixed(2)}€</p>
          <p><strong>Tu oferta:</strong> ${offer.offeredPrice.toFixed(2)}€</p>
        </div>
        
        <p>Te invitamos a realizar una nueva oferta o a contactarnos para encontrar una solución.</p>
        
        <p>Saludos,<br><strong>${SHOP_NAME}</strong></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending rejected email:', error);
    return false;
  }
};

// Email: Notificación al admin
exports.sendAdminNotification = async (offer, product, type = 'within') => {
  if (!process.env.SMTP_USER) {
    console.log('[EMAIL MOCK] Sending admin notification:', type);
    return true;
  }

  const isWithin = type === 'within';
  const subject = isWithin
    ? `Contraoferta ACEPTADA automáticamente - ${product.title}`
    : `Contraoferta PENDIENTE de revisión - ${product.title}`;

  const statusColor = isWithin ? '#4CAF50' : '#FF9800';
  const statusText = isWithin ? 'ACEPTADA AUTOMÁTICAMENTE' : 'PENDIENTE DE REVISIÓN';

  const mailOptions = {
    from: `"${SHOP_NAME}" <${process.env.SMTP_USER}>`,
    to: ADMIN_EMAIL,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: ${statusColor};">Nueva Contraoferta - ${statusText}</h1>
        
        <h2>Datos del cliente:</h2>
        <ul>
          <li><strong>Email:</strong> ${offer.customerEmail}</li>
          <li><strong>Nombre:</strong> ${offer.customerName || 'No proporcionado'}</li>
          <li><strong>Teléfono:</strong> ${offer.customerPhone}</li>
          <li><strong>Tipo:</strong> ${offer.isGuest ? 'Invitado' : 'Registrado'}</li>
        </ul>
        
        <h2>Datos del producto:</h2>
        <ul>
          <li><strong>Producto:</strong> ${product.title}</li>
          <li><strong>Referencia:</strong> ${product.reference || product._id}</li>
        </ul>
        
        <h2>Datos de la oferta:</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
          <p><strong>Precio original:</strong> ${offer.productPrice.toFixed(2)}€</p>
          <p><strong>Precio ofrecido:</strong> ${offer.offeredPrice.toFixed(2)}€</p>
          <p><strong>Descuento:</strong> ${offer.discountPercentage.toFixed(2)}%</p>
          <p><strong>Margen máximo permitido:</strong> ${offer.maxDiscountAllowed}%</p>
          ${offer.comments ? `<p><strong>Comentarios:</strong> ${offer.comments}</p>` : ''}
        </div>
        
        ${isWithin ? `
          <div style="background: #4CAF50; color: white; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p><strong>Cupón generado:</strong> ${offer.couponCode}</p>
          </div>
        ` : `
          <div style="background: #FF9800; color: white; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p>Esta oferta requiere revisión manual ya que supera el margen permitido.</p>
          </div>
        `}
        
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          Fecha: ${new Date().toLocaleString('es-ES')}
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return false;
  }
};
