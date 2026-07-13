// Contenido legal compartido entre el modal de la landing (LandingPageView) y las
// páginas standalone (/terminos, /privacidad, /reembolsos) que Paddle necesita poder
// visitar directamente para la aprobación de dominio. Una sola fuente de verdad
// evita que el texto se desincronice entre ambos lugares.

export function TermsContent() {
  return (
    <>
      <p><strong>1. Aceptación de los Términos</strong></p>
      <p>Al acceder y utilizar la plataforma Ganancy, usted acepta estar sujeto a estos Términos de Servicio. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestra aplicación.</p>
      <p><strong>2. Descripción del Servicio</strong></p>
      <p>Ganancy es una plataforma de software como servicio (SaaS) que permite a los usuarios organizar sus finanzas personales, flujos de caja y pasivos. La plataforma incluye simuladores con Inteligencia Artificial local y herramientas de escaneo de boletas.</p>
      <p><strong>3. Cuentas y Registro</strong></p>
      <p>Para utilizar ciertas funciones de la aplicación, deberá registrarse y mantener una cuenta activa. Usted es responsable de la confidencialidad de su cuenta y contraseña, así como de todas las actividades que ocurran bajo su cuenta.</p>
      <p><strong>4. Pagos y Suscripciones</strong></p>
      <p>Nuestros servicios de facturación, cobros de suscripciones y reventas son procesados por <strong>Paddle.com</strong> (nuestro Merchant of Record). Al realizar una compra, usted acepta los términos y condiciones de pago de Paddle.</p>
    </>
  );
}

export function PrivacyContent() {
  return (
    <>
      <p><strong>1. Recolección de Información</strong></p>
      <p>Recopilamos información necesaria para la autenticación y prestación del servicio (nombre, dirección de correo electrónico y datos financieros que usted decida ingresar voluntariamente en sus tablas de presupuesto).</p>
      <p><strong>2. Uso de los Datos</strong></p>
      <p>Los datos financieros ingresados en Ganancy se procesan localmente en su dispositivo y se almacenan de forma encriptada en la base de datos de la plataforma. No comercializamos ni transferimos sus datos a terceros.</p>
      <p><strong>3. Seguridad de los Datos</strong></p>
      <p>Implementamos medidas de seguridad técnicas (encriptación SSL, políticas de seguridad CSP) para resguardar su información contra acceso no autorizado.</p>
    </>
  );
}

export function RefundsContent() {
  return (
    <>
      <p><strong>1. Garantía de Satisfacción de 14 Días</strong></p>
      <p>Queremos que esté completamente satisfecho con Ganancy. Si por cualquier motivo siente que la plataforma no cumple con sus expectativas, tiene derecho a solicitar un reembolso completo dentro de los primeros 14 días contados desde la compra de su suscripción original.</p>
      <p><strong>2. Proceso de Solicitud</strong></p>
      <p>Para solicitar un reembolso, puede ponerse en contacto con nuestro equipo de soporte enviando un correo a <strong>contacto@ganancy.cl</strong> indicando su correo de registro y el ID de transacción provisto por nuestro vendedor autorizado <strong>Paddle</strong>.</p>
      <p><strong>3. Tiempo de Procesamiento</strong></p>
      <p>Una vez aprobada la solicitud, el reembolso se procesará de inmediato a través del sistema de Paddle y el dinero se devolverá al mismo medio de pago utilizado para la compra en un plazo de 3 a 10 días hábiles bancarios.</p>
    </>
  );
}

export function ContactContent() {
  return (
    <>
      <p>Para cualquier duda legal, soporte técnico, consultas sobre facturación o solicitudes de reembolso, puede comunicarse directamente con nuestro equipo de atención comercial:</p>
      <p style={{ marginTop: '8px' }}><strong>Correo Electrónico de Soporte:</strong></p>
      <p><a href="mailto:contacto@ganancy.cl">contacto@ganancy.cl</a></p>
      <p style={{ marginTop: '8px' }}><strong>Dirección Comercial y Representación Legal:</strong></p>
      <p>Metinca SpA / Ganancy</p>
      <p>Santiago de Chile, Chile</p>
    </>
  );
}

export const LEGAL_PAGES = {
  terminos: { title: 'Términos de Servicio', Content: TermsContent },
  privacidad: { title: 'Política de Privacidad', Content: PrivacyContent },
  reembolsos: { title: 'Política de Reembolsos', Content: RefundsContent },
};
