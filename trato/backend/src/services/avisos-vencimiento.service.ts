import { Op } from 'sequelize';
import { Documento } from '../models/Documento';
import { Propiedad } from '../models/Propiedad';
import { Usuario } from '../models/Usuario';
import { POR_CODIGO } from '../dominio/documentos.catalogo';
import { enviarCorreo } from './email.service';

/**
 * Avisos por correo cuando un certificado del expediente está por vencer.
 *
 * `Documento.vencido` y `diasParaVencer` (en el modelo) ya calculan esto para
 * un papel individual. Lo que faltaba era juntar los que están por vencer en
 * todo el expediente y avisarle al vendedor antes de que lo descubra recién
 * al escriturar -- la fricción que el catálogo de documentos ya identifica
 * como el motivo de ser de la plataforma ("Los certificados vencen").
 *
 * No se repite el aviso para el mismo papel: una vez enviado,
 * `avisadoVencimientoEn` queda marcado y el hook del modelo lo limpia sólo si
 * el vendedor sube un documento nuevo (ver `models/Documento.ts`). Sin esto,
 * un certificado vencido que nadie reemplaza generaría un correo cada vez que
 * esto se corre.
 */

export const DIAS_AVISO_VENCIMIENTO = 7;

export interface DocumentoPorVencer {
  documentoId: string;
  codigo: string;
  nombre: string;
  propiedadId: string;
  propiedadTitulo: string;
  diasParaVencer: number;
  vencido: boolean;
}

export interface PropiedadConDocumentosPorVencer {
  propiedadId: string;
  propiedadTitulo: string;
  vendedorId: string;
  vendedorEmail: string;
  vendedorNombre: string;
  documentos: DocumentoPorVencer[];
}

async function buscarCandidatos(): Promise<Documento[]> {
  // `vigenciaDias` vive en el catálogo, no en la fila: se filtra en memoria
  // después de traer los candidatos razonables (recibidos, sin avisar, con
  // fecha de emisión).
  return Documento.findAll({
    where: {
      estado: 'recibido',
      avisadoVencimientoEn: { [Op.is]: null },
      fechaEmision: { [Op.not]: null },
    },
    include: [{ model: Propiedad, as: 'propiedad', include: [{ model: Usuario, as: 'vendedor' }] }],
  });
}

/** Lista sin enviar nada -- lo que se mostraría antes de apretar el botón. */
export async function propiedadesPorAvisar(
  diasAviso = DIAS_AVISO_VENCIMIENTO,
  ahora = new Date(),
): Promise<PropiedadConDocumentosPorVencer[]> {
  const candidatos = await buscarCandidatos();

  const porPropiedad = new Map<string, PropiedadConDocumentosPorVencer>();

  for (const documento of candidatos) {
    const def = POR_CODIGO.get(documento.codigo);
    if (!def?.vigenciaDias) continue;

    const dias = (ahora.getTime() - new Date(documento.fechaEmision as Date).getTime()) / 86_400_000;
    const diasParaVencer = Math.ceil(def.vigenciaDias - dias);
    if (diasParaVencer > diasAviso) continue;

    const propiedad = documento.get('propiedad') as Propiedad | undefined;
    const vendedor = propiedad?.get('vendedor') as Usuario | undefined;
    if (!propiedad || !vendedor?.email) continue;

    let entrada = porPropiedad.get(propiedad.id);
    if (!entrada) {
      entrada = {
        propiedadId: propiedad.id,
        propiedadTitulo: propiedad.titulo,
        vendedorId: vendedor.id,
        vendedorEmail: vendedor.email,
        vendedorNombre: `${vendedor.nombre} ${vendedor.apellido}`,
        documentos: [],
      };
      porPropiedad.set(propiedad.id, entrada);
    }

    entrada.documentos.push({
      documentoId: documento.id,
      codigo: documento.codigo,
      nombre: def.nombre,
      propiedadId: propiedad.id,
      propiedadTitulo: propiedad.titulo,
      diasParaVencer,
      vencido: diasParaVencer < 0,
    });
  }

  return [...porPropiedad.values()];
}

function textoDocumento(doc: DocumentoPorVencer): string {
  return doc.vencido
    ? `${doc.nombre}: venció hace ${Math.abs(doc.diasParaVencer)} día(s)`
    : `${doc.nombre}: vence en ${doc.diasParaVencer} día(s)`;
}

function armarCorreo(entrada: PropiedadConDocumentosPorVencer): { subject: string; html: string; text: string } {
  const items = entrada.documentos.map(textoDocumento);
  const subject = `Certificados por vencer -- ${entrada.propiedadTitulo}`;
  const text = [
    `Hola ${entrada.vendedorNombre},`,
    '',
    `Estos certificados de tu publicación "${entrada.propiedadTitulo}" necesitan atención:`,
    ...items.map((i) => `- ${i}`),
    '',
    'Entra a tu panel en Trato para volver a pedirlos.',
  ].join('\n');
  const html = `
    <p>Hola ${entrada.vendedorNombre},</p>
    <p>Estos certificados de tu publicación <strong>${entrada.propiedadTitulo}</strong> necesitan atención:</p>
    <ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>
    <p>Entra a tu panel en Trato para volver a pedirlos.</p>
  `;
  return { subject, html, text };
}

export interface ResumenAvisos {
  propiedadesAvisadas: number;
  documentosAvisados: number;
  correosEnviados: number;
  correosFallidos: number;
}

/** Envía los correos y marca cada documento avisado -- sólo si el correo salió. */
export async function enviarAvisosVencimiento(
  diasAviso = DIAS_AVISO_VENCIMIENTO,
  ahora = new Date(),
): Promise<ResumenAvisos> {
  const entradas = await propiedadesPorAvisar(diasAviso, ahora);

  const resumen: ResumenAvisos = {
    propiedadesAvisadas: 0,
    documentosAvisados: 0,
    correosEnviados: 0,
    correosFallidos: 0,
  };

  for (const entrada of entradas) {
    const correo = armarCorreo(entrada);
    const resultado = await enviarCorreo({ to: entrada.vendedorEmail, ...correo });

    if (resultado.enviado) {
      resumen.correosEnviados += 1;
      resumen.propiedadesAvisadas += 1;
      resumen.documentosAvisados += entrada.documentos.length;
      await Documento.update(
        { avisadoVencimientoEn: ahora },
        { where: { id: entrada.documentos.map((d) => d.documentoId) } },
      );
    } else {
      resumen.correosFallidos += 1;
    }
  }

  return resumen;
}
