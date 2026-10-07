import { enviarCorreo } from './email.service';

describe('enviarCorreo', () => {
  it('no intenta enviar sin SMTP_HOST configurado -- se dice, no se simula', async () => {
    // El .env de desarrollo deja SMTP_HOST vacío a propósito (ver .env.example);
    // este es exactamente el camino que corre hoy sin proveedor contratado.
    const resultado = await enviarCorreo({
      to: 'vendedor@ejemplo.cl',
      subject: 'Asunto',
      html: '<p>Hola</p>',
      text: 'Hola',
    });
    expect(resultado).toEqual({ enviado: false, motivo: 'smtp_no_configurado' });
  });
});
