/**
 * Migración 0001: línea de partida del esquema.
 *
 * El SQL de abajo es un volcado real (`pg_dump --schema-only`) de la base de
 * desarrollo tal como queda después de `sequelize.sync({ alter: true })` con
 * los modelos actuales -- no está escrito a mano. Se generó así a propósito:
 * transcribir 16 modelos a `queryInterface.createTable` uno por uno arriesga
 * discrepancias sutiles (precisión de columnas, nombres de índices, los
 * `ON DELETE`/`ON UPDATE` reales de cada asociación) que un volcado del
 * esquema que ya corre no tiene. Verificado aplicando este mismo SQL contra
 * una base nueva y vacía: crea las 16 tablas, igual que el dump original
 * tabla por tabla.
 *
 * En Neon (producción) y en cualquier base de desarrollo que ya exista desde
 * antes de este sistema de migraciones, este paso no se ejecuta: se marca
 * como aplicado a mano (INSERT directo en `migraciones`) porque las tablas
 * ya están ahí, creadas por el `sync({ alter: true })` que se corrió una vez
 * contra Neon (ver CLAUDE.md, "Despliegue del backend en Vercel"). Correr su
 * `up()` sólo tiene sentido contra una base nueva: una instancia de Postgres
 * recién creada, sin ninguna de estas 16 tablas todavía.
 */
import type { Migracion } from '../migrador';

const SQL_BASELINE = `
--
-- PostgreSQL database dump
--


-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)


--
-- Name: enum_consentimientos_tipo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_consentimientos_tipo AS ENUM (
    'divulgacion_antecedentes'
);


--
-- Name: enum_documentos_estado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_documentos_estado AS ENUM (
    'requerido',
    'solicitado',
    'en_tramite',
    'recibido',
    'rechazado',
    'no_aplica'
);


--
-- Name: enum_documentos_validacion; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_documentos_validacion AS ENUM (
    'sin_revisar',
    'en_revision',
    'aprobado',
    'observado'
);


--
-- Name: enum_firmas_promesa_proveedor; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_firmas_promesa_proveedor AS ENUM (
    'simple',
    'docusign'
);


--
-- Name: enum_firmas_promesa_rol; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_firmas_promesa_rol AS ENUM (
    'comprador',
    'vendedor'
);


--
-- Name: enum_informes_estado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_informes_estado AS ENUM (
    'emitido',
    'esperando_pago',
    'en_preparacion',
    'entregado',
    'anulado'
);


--
-- Name: enum_informes_nivel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_informes_nivel AS ENUM (
    'antecedentes',
    'titulos'
);


--
-- Name: enum_mensajes_bot_destino; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_mensajes_bot_destino AS ENUM (
    'informe',
    'visita',
    'persona'
);


--
-- Name: enum_pagos_estado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_pagos_estado AS ENUM (
    'pendiente',
    'pagado',
    'anulado',
    'reembolsado'
);


--
-- Name: enum_pagos_medio; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_pagos_medio AS ENUM (
    'transferencia',
    'webpay'
);


--
-- Name: enum_pagos_proveedor; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_pagos_proveedor AS ENUM (
    'manual',
    'flow'
);


--
-- Name: enum_promesas_estado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_promesas_estado AS ENUM (
    'negociando',
    'acordada',
    'firmada',
    'cumplida',
    'desistida'
);


--
-- Name: enum_promesas_moneda; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_promesas_moneda AS ENUM (
    'clp',
    'uf'
);


--
-- Name: enum_propiedades_estado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_propiedades_estado AS ENUM (
    'borrador',
    'en_revision',
    'publicada',
    'reservada',
    'vendida',
    'retirada'
);


--
-- Name: enum_propiedades_moneda; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_propiedades_moneda AS ENUM (
    'clp',
    'uf'
);


--
-- Name: enum_propiedades_region; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_propiedades_region AS ENUM (
    'Arica y Parinacota',
    'Tarapacá',
    'Antofagasta',
    'Atacama',
    'Coquimbo',
    'Valparaíso',
    'Metropolitana de Santiago',
    'Libertador General Bernardo O''Higgins',
    'Maule',
    'Ñuble',
    'Biobío',
    'La Araucanía',
    'Los Ríos',
    'Los Lagos',
    'Aysén del General Carlos Ibáñez del Campo',
    'Magallanes y de la Antártica Chilena'
);


--
-- Name: enum_propiedades_tipo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_propiedades_tipo AS ENUM (
    'casa',
    'departamento',
    'oficina',
    'terreno',
    'bodega',
    'estacionamiento',
    'parcela'
);


--
-- Name: enum_socios_tipo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_socios_tipo AS ENUM (
    'notaria',
    'conservador'
);


--
-- Name: enum_solicitudes_datos_resultado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_solicitudes_datos_resultado AS ENUM (
    'atendida',
    'atendida_parcial',
    'rechazada'
);


--
-- Name: enum_solicitudes_datos_tipo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_solicitudes_datos_tipo AS ENUM (
    'acceso',
    'rectificacion',
    'supresion',
    'oposicion',
    'portabilidad'
);


--
-- Name: enum_usuarios_rol; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_usuarios_rol AS ENUM (
    'vendedor',
    'comprador',
    'asesor',
    'notaria',
    'abogado',
    'admin'
);


--
-- Name: enum_visitas_estado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_visitas_estado AS ENUM (
    'solicitada',
    'confirmada',
    'realizada',
    'cancelada',
    'no_asistio'
);




--
-- Name: clausulas_promesa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clausulas_promesa (
    id uuid NOT NULL,
    promesa_id uuid NOT NULL,
    codigo character varying(60) NOT NULL,
    texto text NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    propuesta_por_id uuid NOT NULL,
    aceptada_por_id uuid,
    aceptada_en timestamp with time zone,
    comentario text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: consentimientos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consentimientos (
    id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    propiedad_id uuid NOT NULL,
    tipo public.enum_consentimientos_tipo NOT NULL,
    texto_version character varying(60) NOT NULL,
    otorgado_en timestamp with time zone NOT NULL,
    revocado_en timestamp with time zone,
    ip character varying(64),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: disponibilidad_visitas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disponibilidad_visitas (
    id uuid NOT NULL,
    propiedad_id uuid NOT NULL,
    dia_semana integer NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: documentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documentos (
    id uuid NOT NULL,
    propiedad_id uuid NOT NULL,
    codigo character varying(60) NOT NULL,
    estado public.enum_documentos_estado DEFAULT 'requerido'::public.enum_documentos_estado NOT NULL,
    archivo_url character varying(500),
    fecha_emision timestamp with time zone,
    observaciones text,
    costo_clp integer,
    validacion public.enum_documentos_validacion DEFAULT 'sin_revisar'::public.enum_documentos_validacion NOT NULL,
    validado_por_id uuid,
    validado_en timestamp with time zone,
    observacion_notaria text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    avisado_vencimiento_en timestamp with time zone
);


--
-- Name: firmas_promesa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.firmas_promesa (
    id uuid NOT NULL,
    promesa_id uuid NOT NULL,
    firmante_por_id uuid NOT NULL,
    rol public.enum_firmas_promesa_rol NOT NULL,
    texto text NOT NULL,
    texto_hash character varying(64) NOT NULL,
    proveedor public.enum_firmas_promesa_proveedor DEFAULT 'simple'::public.enum_firmas_promesa_proveedor NOT NULL,
    proveedor_ref character varying(200),
    ip character varying(64),
    firmado_en timestamp with time zone NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: incidentes_seguridad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incidentes_seguridad (
    id uuid NOT NULL,
    declarado_por_id uuid NOT NULL,
    titulo character varying(150) NOT NULL,
    descripcion text NOT NULL,
    categorias_afectadas jsonb DEFAULT '[]'::jsonb NOT NULL,
    cantidad_afectada_estimada integer,
    detectado_en timestamp with time zone NOT NULL,
    notificada_agencia_en timestamp with time zone,
    notificada_titulares_en timestamp with time zone,
    medidas_adoptadas text,
    cerrado_en timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: informes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.informes (
    id uuid NOT NULL,
    propiedad_id uuid NOT NULL,
    comprador_id uuid NOT NULL,
    nivel public.enum_informes_nivel NOT NULL,
    estado public.enum_informes_estado DEFAULT 'emitido'::public.enum_informes_estado NOT NULL,
    precio_clp integer DEFAULT 0 NOT NULL,
    contenido jsonb DEFAULT '{}'::jsonb NOT NULL,
    emitido_en timestamp with time zone,
    pagado_en timestamp with time zone,
    entregado_en timestamp with time zone,
    abogado_id uuid,
    firmado_en timestamp with time zone,
    conclusion text,
    defectos jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: mensajes_bot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mensajes_bot (
    id uuid NOT NULL,
    propiedad_id uuid NOT NULL,
    usuario_id uuid,
    sesion character varying(64) NOT NULL,
    pregunta text,
    respuesta text NOT NULL,
    temas jsonb DEFAULT '[]'::jsonb NOT NULL,
    zonas jsonb DEFAULT '[]'::jsonb NOT NULL,
    destino public.enum_mensajes_bot_destino,
    entendido boolean DEFAULT true NOT NULL,
    atendido_en timestamp with time zone,
    atendido_por_id uuid,
    nota_interna text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: pagos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pagos (
    id uuid NOT NULL,
    informe_id uuid NOT NULL,
    comprador_id uuid NOT NULL,
    monto integer NOT NULL,
    medio public.enum_pagos_medio NOT NULL,
    proveedor public.enum_pagos_proveedor NOT NULL,
    estado public.enum_pagos_estado DEFAULT 'pendiente'::public.enum_pagos_estado NOT NULL,
    referencia character varying(40) NOT NULL,
    reportado_en timestamp with time zone,
    pagado_en timestamp with time zone,
    conciliado_por_id uuid,
    nota text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    url_pago character varying(500)
);


--
-- Name: promesas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promesas (
    id uuid NOT NULL,
    propiedad_id uuid NOT NULL,
    comprador_id uuid NOT NULL,
    vendedor_id uuid NOT NULL,
    precio numeric(15,2) NOT NULL,
    moneda public.enum_promesas_moneda DEFAULT 'uf'::public.enum_promesas_moneda NOT NULL,
    pie numeric(15,2),
    fecha_escritura date,
    estado public.enum_promesas_estado DEFAULT 'negociando'::public.enum_promesas_estado NOT NULL,
    acordada_en timestamp with time zone,
    firmada_en timestamp with time zone,
    cerrada_en timestamp with time zone,
    motivo_cierre text,
    revisada_por_id uuid,
    revisada_en timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    cumplida_en timestamp with time zone
);


--
-- Name: propiedades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.propiedades (
    id uuid NOT NULL,
    vendedor_id uuid NOT NULL,
    titulo character varying(150) NOT NULL,
    descripcion text,
    tipo public.enum_propiedades_tipo NOT NULL,
    estado public.enum_propiedades_estado DEFAULT 'borrador'::public.enum_propiedades_estado NOT NULL,
    precio numeric(15,2) NOT NULL,
    moneda public.enum_propiedades_moneda DEFAULT 'uf'::public.enum_propiedades_moneda NOT NULL,
    calle character varying(150) NOT NULL,
    numero character varying(20) NOT NULL,
    depto character varying(20),
    comuna character varying(80) NOT NULL,
    region public.enum_propiedades_region NOT NULL,
    latitud numeric(10,7),
    longitud numeric(10,7),
    rol_avaluo character varying(20),
    superficie_total numeric(10,2),
    superficie_construida numeric(10,2),
    dormitorios integer,
    banos integer,
    estacionamientos integer DEFAULT 0 NOT NULL,
    bodegas integer DEFAULT 0 NOT NULL,
    ano_construccion integer,
    tiene_hipoteca boolean DEFAULT false NOT NULL,
    fotos jsonb DEFAULT '[]'::jsonb NOT NULL,
    notaria_id uuid,
    conservador_id uuid,
    fojas character varying(20),
    numero_inscripcion character varying(20),
    ano_inscripcion integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    visitantes_por_cupo integer DEFAULT 1 NOT NULL,
    avaluo_fiscal_cache jsonb,
    contribuciones_cache jsonb
);


--
-- Name: purgas_registro; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purgas_registro (
    id uuid NOT NULL,
    ejecutada_por_id uuid NOT NULL,
    acciones jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: socios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.socios (
    id uuid NOT NULL,
    tipo public.enum_socios_tipo NOT NULL,
    nombre character varying(150) NOT NULL,
    comuna character varying(80) NOT NULL,
    region character varying(80) NOT NULL,
    email character varying(255),
    telefono character varying(20),
    direccion character varying(200),
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: solicitudes_datos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitudes_datos (
    id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    tipo public.enum_solicitudes_datos_tipo NOT NULL,
    resultado public.enum_solicitudes_datos_resultado NOT NULL,
    detalle text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    rut character varying(12),
    telefono character varying(20),
    rol public.enum_usuarios_rol DEFAULT 'comprador'::public.enum_usuarios_rol NOT NULL,
    socio_id uuid,
    email_verificado boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    anonimizado_en timestamp with time zone
);


--
-- Name: visitas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visitas (
    id uuid NOT NULL,
    propiedad_id uuid NOT NULL,
    comprador_id uuid NOT NULL,
    asesor_id uuid,
    inicio timestamp with time zone NOT NULL,
    fin timestamp with time zone NOT NULL,
    estado public.enum_visitas_estado DEFAULT 'solicitada'::public.enum_visitas_estado NOT NULL,
    mensaje text,
    motivo_cierre text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: clausulas_promesa clausulas_promesa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clausulas_promesa
    ADD CONSTRAINT clausulas_promesa_pkey PRIMARY KEY (id);


--
-- Name: consentimientos consentimientos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consentimientos
    ADD CONSTRAINT consentimientos_pkey PRIMARY KEY (id);


--
-- Name: disponibilidad_visitas disponibilidad_visitas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disponibilidad_visitas
    ADD CONSTRAINT disponibilidad_visitas_pkey PRIMARY KEY (id);


--
-- Name: documentos documentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_pkey PRIMARY KEY (id);


--
-- Name: firmas_promesa firmas_promesa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firmas_promesa
    ADD CONSTRAINT firmas_promesa_pkey PRIMARY KEY (id);


--
-- Name: incidentes_seguridad incidentes_seguridad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidentes_seguridad
    ADD CONSTRAINT incidentes_seguridad_pkey PRIMARY KEY (id);


--
-- Name: informes informes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.informes
    ADD CONSTRAINT informes_pkey PRIMARY KEY (id);


--
-- Name: mensajes_bot mensajes_bot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensajes_bot
    ADD CONSTRAINT mensajes_bot_pkey PRIMARY KEY (id);


--
-- Name: pagos pagos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id);


--
-- Name: pagos pagos_referencia_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key1 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key10; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key10 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key11; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key11 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key12; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key12 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key13; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key13 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key14; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key14 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key15; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key15 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key16; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key16 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key17; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key17 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key18; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key18 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key19; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key19 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key2 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key20; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key20 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key21; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key21 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key22; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key22 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key23; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key23 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key24; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key24 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key25; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key25 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key26; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key26 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key27; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key27 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key28; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key28 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key29; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key29 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key3 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key30; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key30 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key31; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key31 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key32; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key32 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key33; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key33 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key34; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key34 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key35; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key35 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key36; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key36 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key37; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key37 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key38; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key38 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key39; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key39 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key4 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key40; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key40 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key41; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key41 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key42; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key42 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key43; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key43 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key44; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key44 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key45; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key45 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key46; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key46 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key47; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key47 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key48; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key48 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key49; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key49 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key5 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key50; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key50 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key51; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key51 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key52; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key52 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key53; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key53 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key54; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key54 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key55; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key55 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key56; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key56 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key6 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key7 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key8 UNIQUE (referencia);


--
-- Name: pagos pagos_referencia_key9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key9 UNIQUE (referencia);


--
-- Name: promesas promesas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promesas
    ADD CONSTRAINT promesas_pkey PRIMARY KEY (id);


--
-- Name: propiedades propiedades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propiedades
    ADD CONSTRAINT propiedades_pkey PRIMARY KEY (id);


--
-- Name: purgas_registro purgas_registro_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purgas_registro
    ADD CONSTRAINT purgas_registro_pkey PRIMARY KEY (id);


--
-- Name: socios socios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socios
    ADD CONSTRAINT socios_pkey PRIMARY KEY (id);


--
-- Name: solicitudes_datos solicitudes_datos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_datos
    ADD CONSTRAINT solicitudes_datos_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_email_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key1 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key10; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key10 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key11; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key11 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key12; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key12 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key13; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key13 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key14; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key14 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key15; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key15 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key16; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key16 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key17; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key17 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key18; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key18 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key19; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key19 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key2 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key20; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key20 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key21; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key21 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key22; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key22 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key23; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key23 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key24; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key24 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key25; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key25 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key26; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key26 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key27; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key27 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key28; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key28 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key29; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key29 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key3 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key30; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key30 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key31; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key31 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key32; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key32 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key33; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key33 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key34; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key34 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key35; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key35 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key36; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key36 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key37; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key37 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key38; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key38 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key39; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key39 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key4 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key40; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key40 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key41; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key41 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key42; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key42 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key43; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key43 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key44; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key44 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key45; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key45 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key46; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key46 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key47; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key47 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key48; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key48 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key49; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key49 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key5 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key50; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key50 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key51; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key51 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key52; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key52 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key53; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key53 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key54; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key54 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key55; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key55 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key56; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key56 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key57; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key57 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key58; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key58 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key59; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key59 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key6 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key60; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key60 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key61; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key61 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key62; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key62 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key63; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key63 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key64; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key64 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key65; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key65 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key66; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key66 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key67; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key67 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key68; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key68 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key69; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key69 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key7 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key70; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key70 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key71; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key71 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key72; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key72 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key73; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key73 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key74; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key74 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key75; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key75 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key76; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key76 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key77; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key77 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key78; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key78 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key79; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key79 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key8 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key80; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key80 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key81; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key81 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key82; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key82 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key83; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key83 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key84; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key84 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key85; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key85 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key86; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key86 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key87; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key87 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key88; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key88 UNIQUE (email);


--
-- Name: usuarios usuarios_email_key9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key9 UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_rut_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key1 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key10; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key10 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key11; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key11 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key12; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key12 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key13; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key13 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key14; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key14 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key15; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key15 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key16; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key16 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key17; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key17 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key18; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key18 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key19; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key19 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key2 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key20; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key20 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key21; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key21 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key22; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key22 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key23; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key23 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key24; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key24 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key25; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key25 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key26; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key26 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key27; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key27 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key28; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key28 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key29; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key29 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key3 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key30; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key30 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key31; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key31 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key32; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key32 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key33; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key33 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key34; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key34 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key35; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key35 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key36; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key36 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key37; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key37 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key38; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key38 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key39; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key39 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key4 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key40; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key40 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key41; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key41 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key42; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key42 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key43; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key43 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key44; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key44 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key45; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key45 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key46; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key46 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key47; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key47 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key48; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key48 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key49; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key49 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key5 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key50; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key50 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key51; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key51 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key52; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key52 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key53; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key53 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key54; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key54 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key55; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key55 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key56; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key56 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key57; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key57 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key58; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key58 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key59; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key59 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key6 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key60; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key60 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key61; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key61 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key62; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key62 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key63; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key63 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key64; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key64 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key65; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key65 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key66; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key66 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key67; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key67 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key68; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key68 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key69; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key69 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key7 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key70; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key70 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key71; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key71 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key72; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key72 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key73; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key73 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key74; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key74 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key75; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key75 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key76; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key76 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key77; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key77 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key78; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key78 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key79; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key79 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key8 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key80; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key80 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key81; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key81 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key82; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key82 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key83; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key83 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key84; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key84 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key85; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key85 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key86; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key86 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key87; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key87 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key88; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key88 UNIQUE (rut);


--
-- Name: usuarios usuarios_rut_key9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rut_key9 UNIQUE (rut);


--
-- Name: visitas visitas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitas
    ADD CONSTRAINT visitas_pkey PRIMARY KEY (id);


--
-- Name: clausulas_promesa_promesa_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clausulas_promesa_promesa_id ON public.clausulas_promesa USING btree (promesa_id);


--
-- Name: clausulas_promesa_promesa_id_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX clausulas_promesa_promesa_id_codigo ON public.clausulas_promesa USING btree (promesa_id, codigo);


--
-- Name: consentimientos_propiedad_id_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX consentimientos_propiedad_id_tipo ON public.consentimientos USING btree (propiedad_id, tipo);


--
-- Name: consentimientos_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX consentimientos_usuario_id ON public.consentimientos USING btree (usuario_id);


--
-- Name: disponibilidad_visitas_propiedad_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX disponibilidad_visitas_propiedad_id ON public.disponibilidad_visitas USING btree (propiedad_id);


--
-- Name: documentos_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documentos_estado ON public.documentos USING btree (estado);


--
-- Name: documentos_propiedad_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documentos_propiedad_id ON public.documentos USING btree (propiedad_id);


--
-- Name: documentos_propiedad_id_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX documentos_propiedad_id_codigo ON public.documentos USING btree (propiedad_id, codigo);


--
-- Name: firmas_promesa_promesa_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX firmas_promesa_promesa_id ON public.firmas_promesa USING btree (promesa_id);


--
-- Name: firmas_promesa_promesa_id_firmante_por_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX firmas_promesa_promesa_id_firmante_por_id ON public.firmas_promesa USING btree (promesa_id, firmante_por_id);


--
-- Name: incidentes_seguridad_declarado_por_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX incidentes_seguridad_declarado_por_id ON public.incidentes_seguridad USING btree (declarado_por_id);


--
-- Name: incidentes_seguridad_detectado_en; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX incidentes_seguridad_detectado_en ON public.incidentes_seguridad USING btree (detectado_en);


--
-- Name: informes_comprador_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX informes_comprador_id ON public.informes USING btree (comprador_id);


--
-- Name: informes_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX informes_estado ON public.informes USING btree (estado);


--
-- Name: informes_propiedad_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX informes_propiedad_id ON public.informes USING btree (propiedad_id);


--
-- Name: mensajes_bot_destino_atendido_en; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mensajes_bot_destino_atendido_en ON public.mensajes_bot USING btree (destino, atendido_en);


--
-- Name: mensajes_bot_propiedad_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mensajes_bot_propiedad_id ON public.mensajes_bot USING btree (propiedad_id);


--
-- Name: mensajes_bot_sesion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mensajes_bot_sesion ON public.mensajes_bot USING btree (sesion);


--
-- Name: mensajes_bot_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mensajes_bot_usuario_id ON public.mensajes_bot USING btree (usuario_id);


--
-- Name: pagos_comprador_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pagos_comprador_id ON public.pagos USING btree (comprador_id);


--
-- Name: pagos_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pagos_estado ON public.pagos USING btree (estado);


--
-- Name: pagos_informe_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pagos_informe_id ON public.pagos USING btree (informe_id);


--
-- Name: promesas_comprador_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promesas_comprador_id ON public.promesas USING btree (comprador_id);


--
-- Name: promesas_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promesas_estado ON public.promesas USING btree (estado);


--
-- Name: promesas_propiedad_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promesas_propiedad_id ON public.promesas USING btree (propiedad_id);


--
-- Name: promesas_vendedor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promesas_vendedor_id ON public.promesas USING btree (vendedor_id);


--
-- Name: propiedades_comuna; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX propiedades_comuna ON public.propiedades USING btree (comuna);


--
-- Name: propiedades_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX propiedades_estado ON public.propiedades USING btree (estado);


--
-- Name: propiedades_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX propiedades_tipo ON public.propiedades USING btree (tipo);


--
-- Name: propiedades_vendedor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX propiedades_vendedor_id ON public.propiedades USING btree (vendedor_id);


--
-- Name: purgas_registro_ejecutada_por_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX purgas_registro_ejecutada_por_id ON public.purgas_registro USING btree (ejecutada_por_id);


--
-- Name: socios_activo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX socios_activo ON public.socios USING btree (activo);


--
-- Name: socios_comuna; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX socios_comuna ON public.socios USING btree (comuna);


--
-- Name: socios_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX socios_tipo ON public.socios USING btree (tipo);


--
-- Name: solicitudes_datos_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX solicitudes_datos_tipo ON public.solicitudes_datos USING btree (tipo);


--
-- Name: solicitudes_datos_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX solicitudes_datos_usuario_id ON public.solicitudes_datos USING btree (usuario_id);


--
-- Name: usuarios_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX usuarios_email ON public.usuarios USING btree (email);


--
-- Name: usuarios_rut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX usuarios_rut ON public.usuarios USING btree (rut);


--
-- Name: visitas_asesor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX visitas_asesor_id ON public.visitas USING btree (asesor_id);


--
-- Name: visitas_comprador_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX visitas_comprador_id ON public.visitas USING btree (comprador_id);


--
-- Name: visitas_inicio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX visitas_inicio ON public.visitas USING btree (inicio);


--
-- Name: visitas_propiedad_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX visitas_propiedad_id ON public.visitas USING btree (propiedad_id);


--
-- Name: clausulas_promesa clausulas_promesa_promesa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clausulas_promesa
    ADD CONSTRAINT clausulas_promesa_promesa_id_fkey FOREIGN KEY (promesa_id) REFERENCES public.promesas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: clausulas_promesa clausulas_promesa_propuesta_por_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clausulas_promesa
    ADD CONSTRAINT clausulas_promesa_propuesta_por_id_fkey FOREIGN KEY (propuesta_por_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE;


--
-- Name: consentimientos consentimientos_propiedad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consentimientos
    ADD CONSTRAINT consentimientos_propiedad_id_fkey FOREIGN KEY (propiedad_id) REFERENCES public.propiedades(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: consentimientos consentimientos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consentimientos
    ADD CONSTRAINT consentimientos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE;


--
-- Name: disponibilidad_visitas disponibilidad_visitas_propiedad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disponibilidad_visitas
    ADD CONSTRAINT disponibilidad_visitas_propiedad_id_fkey FOREIGN KEY (propiedad_id) REFERENCES public.propiedades(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documentos documentos_propiedad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_propiedad_id_fkey FOREIGN KEY (propiedad_id) REFERENCES public.propiedades(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: firmas_promesa firmas_promesa_firmante_por_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firmas_promesa
    ADD CONSTRAINT firmas_promesa_firmante_por_id_fkey FOREIGN KEY (firmante_por_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE;


--
-- Name: firmas_promesa firmas_promesa_promesa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firmas_promesa
    ADD CONSTRAINT firmas_promesa_promesa_id_fkey FOREIGN KEY (promesa_id) REFERENCES public.promesas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: incidentes_seguridad incidentes_seguridad_declarado_por_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidentes_seguridad
    ADD CONSTRAINT incidentes_seguridad_declarado_por_id_fkey FOREIGN KEY (declarado_por_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE;


--
-- Name: informes informes_abogado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.informes
    ADD CONSTRAINT informes_abogado_id_fkey FOREIGN KEY (abogado_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: informes informes_comprador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.informes
    ADD CONSTRAINT informes_comprador_id_fkey FOREIGN KEY (comprador_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE;


--
-- Name: informes informes_propiedad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.informes
    ADD CONSTRAINT informes_propiedad_id_fkey FOREIGN KEY (propiedad_id) REFERENCES public.propiedades(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mensajes_bot mensajes_bot_atendido_por_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensajes_bot
    ADD CONSTRAINT mensajes_bot_atendido_por_id_fkey FOREIGN KEY (atendido_por_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: mensajes_bot mensajes_bot_propiedad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensajes_bot
    ADD CONSTRAINT mensajes_bot_propiedad_id_fkey FOREIGN KEY (propiedad_id) REFERENCES public.propiedades(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mensajes_bot mensajes_bot_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensajes_bot
    ADD CONSTRAINT mensajes_bot_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pagos pagos_comprador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_comprador_id_fkey FOREIGN KEY (comprador_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE;


--
-- Name: pagos pagos_informe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_informe_id_fkey FOREIGN KEY (informe_id) REFERENCES public.informes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: promesas promesas_comprador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promesas
    ADD CONSTRAINT promesas_comprador_id_fkey FOREIGN KEY (comprador_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE;


--
-- Name: promesas promesas_propiedad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promesas
    ADD CONSTRAINT promesas_propiedad_id_fkey FOREIGN KEY (propiedad_id) REFERENCES public.propiedades(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: promesas promesas_revisada_por_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promesas
    ADD CONSTRAINT promesas_revisada_por_id_fkey FOREIGN KEY (revisada_por_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: promesas promesas_vendedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promesas
    ADD CONSTRAINT promesas_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE;


--
-- Name: propiedades propiedades_conservador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propiedades
    ADD CONSTRAINT propiedades_conservador_id_fkey FOREIGN KEY (conservador_id) REFERENCES public.socios(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: propiedades propiedades_notaria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propiedades
    ADD CONSTRAINT propiedades_notaria_id_fkey FOREIGN KEY (notaria_id) REFERENCES public.socios(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: propiedades propiedades_vendedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propiedades
    ADD CONSTRAINT propiedades_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: purgas_registro purgas_registro_ejecutada_por_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purgas_registro
    ADD CONSTRAINT purgas_registro_ejecutada_por_id_fkey FOREIGN KEY (ejecutada_por_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE;


--
-- Name: solicitudes_datos solicitudes_datos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_datos
    ADD CONSTRAINT solicitudes_datos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE;


--
-- Name: usuarios usuarios_socio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_socio_id_fkey FOREIGN KEY (socio_id) REFERENCES public.socios(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: visitas visitas_asesor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitas
    ADD CONSTRAINT visitas_asesor_id_fkey FOREIGN KEY (asesor_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: visitas visitas_comprador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitas
    ADD CONSTRAINT visitas_comprador_id_fkey FOREIGN KEY (comprador_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE;


--
-- Name: visitas visitas_propiedad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitas
    ADD CONSTRAINT visitas_propiedad_id_fkey FOREIGN KEY (propiedad_id) REFERENCES public.propiedades(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--
`;

const migracion: Migracion = {
  nombre: '0001_baseline',

  async up(sequelize) {
    await sequelize.query(SQL_BASELINE);
  },

  async down(sequelize) {
    // Deshacer el baseline es "vaciar la base": no hay una versión anterior
    // a la que volver. CASCADE porque el orden de borrado no importa -- las
    // 16 tablas se van con sus FKs y todo lo que dependa de ellas.
    await sequelize.query(`DROP TABLE IF EXISTS public.clausulas_promesa, public.consentimientos, public.disponibilidad_visitas, public.documentos, public.firmas_promesa, public.incidentes_seguridad, public.informes, public.mensajes_bot, public.pagos, public.promesas, public.propiedades, public.purgas_registro, public.socios, public.solicitudes_datos, public.usuarios, public.visitas CASCADE;`);
    await sequelize.query(`
DROP TYPE IF EXISTS public.enum_consentimientos_tipo;
DROP TYPE IF EXISTS public.enum_documentos_estado;
DROP TYPE IF EXISTS public.enum_documentos_validacion;
DROP TYPE IF EXISTS public.enum_firmas_promesa_proveedor;
DROP TYPE IF EXISTS public.enum_firmas_promesa_rol;
DROP TYPE IF EXISTS public.enum_informes_estado;
DROP TYPE IF EXISTS public.enum_informes_nivel;
DROP TYPE IF EXISTS public.enum_mensajes_bot_destino;
DROP TYPE IF EXISTS public.enum_pagos_estado;
DROP TYPE IF EXISTS public.enum_pagos_medio;
DROP TYPE IF EXISTS public.enum_pagos_proveedor;
DROP TYPE IF EXISTS public.enum_promesas_estado;
DROP TYPE IF EXISTS public.enum_promesas_moneda;
DROP TYPE IF EXISTS public.enum_propiedades_estado;
DROP TYPE IF EXISTS public.enum_propiedades_moneda;
DROP TYPE IF EXISTS public.enum_propiedades_region;
DROP TYPE IF EXISTS public.enum_propiedades_tipo;
DROP TYPE IF EXISTS public.enum_socios_tipo;
DROP TYPE IF EXISTS public.enum_solicitudes_datos_resultado;
DROP TYPE IF EXISTS public.enum_solicitudes_datos_tipo;
DROP TYPE IF EXISTS public.enum_usuarios_rol;
DROP TYPE IF EXISTS public.enum_visitas_estado;
    `);
  },
};

export default migracion;
