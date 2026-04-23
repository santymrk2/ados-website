--
-- PostgreSQL database dump
--

\restrict 36N04NtYZD8dVft2arwVTV3LlDavA6rgPrJMepvNoYeiWhQLlIscfxJEecsqSO2

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg13+1)
-- Dumped by pg_dump version 18.3 (Debian 18.3-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: santymrk
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO santymrk;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: santymrk
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO santymrk;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: santymrk
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO santymrk;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: santymrk
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: activities; Type: TABLE; Schema: public; Owner: santymrk
--

CREATE TABLE public.activities (
    id integer NOT NULL,
    fecha text NOT NULL,
    titulo text,
    cant_equipos integer DEFAULT 4 NOT NULL,
    locked boolean DEFAULT false
);


ALTER TABLE public.activities OWNER TO santymrk;

--
-- Name: activities_id_seq; Type: SEQUENCE; Schema: public; Owner: santymrk
--

CREATE SEQUENCE public.activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activities_id_seq OWNER TO santymrk;

--
-- Name: activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: santymrk
--

ALTER SEQUENCE public.activities_id_seq OWNED BY public.activities.id;


--
-- Name: activity_participants; Type: TABLE; Schema: public; Owner: santymrk
--

CREATE TABLE public.activity_participants (
    id integer NOT NULL,
    activity_id integer NOT NULL,
    participant_id integer NOT NULL,
    equipo text,
    es_puntual boolean DEFAULT false,
    tiene_biblia boolean DEFAULT false,
    es_social boolean DEFAULT false
);


ALTER TABLE public.activity_participants OWNER TO santymrk;

--
-- Name: activity_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: santymrk
--

CREATE SEQUENCE public.activity_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_participants_id_seq OWNER TO santymrk;

--
-- Name: activity_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: santymrk
--

ALTER SEQUENCE public.activity_participants_id_seq OWNED BY public.activity_participants.id;


--
-- Name: extras; Type: TABLE; Schema: public; Owner: santymrk
--

CREATE TABLE public.extras (
    id integer NOT NULL,
    activity_id integer NOT NULL,
    participant_id integer,
    team text,
    tipo text NOT NULL,
    puntos integer NOT NULL,
    motivo text
);


ALTER TABLE public.extras OWNER TO santymrk;

--
-- Name: extras_id_seq; Type: SEQUENCE; Schema: public; Owner: santymrk
--

CREATE SEQUENCE public.extras_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.extras_id_seq OWNER TO santymrk;

--
-- Name: extras_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: santymrk
--

ALTER SEQUENCE public.extras_id_seq OWNED BY public.extras.id;


--
-- Name: goles; Type: TABLE; Schema: public; Owner: santymrk
--

CREATE TABLE public.goles (
    id integer NOT NULL,
    activity_id integer NOT NULL,
    participant_id integer,
    match_id integer,
    team text,
    tipo text NOT NULL,
    cant integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.goles OWNER TO santymrk;

--
-- Name: goles_id_seq; Type: SEQUENCE; Schema: public; Owner: santymrk
--

CREATE SEQUENCE public.goles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goles_id_seq OWNER TO santymrk;

--
-- Name: goles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: santymrk
--

ALTER SEQUENCE public.goles_id_seq OWNED BY public.goles.id;


--
-- Name: invitaciones; Type: TABLE; Schema: public; Owner: santymrk
--

CREATE TABLE public.invitaciones (
    id integer NOT NULL,
    activity_id integer NOT NULL,
    invitador_id integer,
    invitado_id integer NOT NULL
);


ALTER TABLE public.invitaciones OWNER TO santymrk;

--
-- Name: invitaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: santymrk
--

CREATE SEQUENCE public.invitaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invitaciones_id_seq OWNER TO santymrk;

--
-- Name: invitaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: santymrk
--

ALTER SEQUENCE public.invitaciones_id_seq OWNED BY public.invitaciones.id;


--
-- Name: juego_posiciones; Type: TABLE; Schema: public; Owner: santymrk
--

CREATE TABLE public.juego_posiciones (
    id integer NOT NULL,
    juego_id integer NOT NULL,
    equipo text NOT NULL,
    posicion integer NOT NULL
);


ALTER TABLE public.juego_posiciones OWNER TO santymrk;

--
-- Name: juego_posiciones_id_seq; Type: SEQUENCE; Schema: public; Owner: santymrk
--

CREATE SEQUENCE public.juego_posiciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.juego_posiciones_id_seq OWNER TO santymrk;

--
-- Name: juego_posiciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: santymrk
--

ALTER SEQUENCE public.juego_posiciones_id_seq OWNED BY public.juego_posiciones.id;


--
-- Name: juegos; Type: TABLE; Schema: public; Owner: santymrk
--

CREATE TABLE public.juegos (
    id integer NOT NULL,
    activity_id integer NOT NULL,
    nombre text
);


ALTER TABLE public.juegos OWNER TO santymrk;

--
-- Name: juegos_id_seq; Type: SEQUENCE; Schema: public; Owner: santymrk
--

CREATE SEQUENCE public.juegos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.juegos_id_seq OWNER TO santymrk;

--
-- Name: juegos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: santymrk
--

ALTER SEQUENCE public.juegos_id_seq OWNED BY public.juegos.id;


--
-- Name: participants; Type: TABLE; Schema: public; Owner: santymrk
--

CREATE TABLE public.participants (
    id integer NOT NULL,
    nombre text NOT NULL,
    apellido text NOT NULL,
    fecha_nacimiento text,
    sexo text DEFAULT 'M'::text NOT NULL,
    foto text,
    foto_alta_calidad text,
    invitado_por integer
);


ALTER TABLE public.participants OWNER TO santymrk;

--
-- Name: participants_id_seq; Type: SEQUENCE; Schema: public; Owner: santymrk
--

CREATE SEQUENCE public.participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.participants_id_seq OWNER TO santymrk;

--
-- Name: participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: santymrk
--

ALTER SEQUENCE public.participants_id_seq OWNED BY public.participants.id;


--
-- Name: partidos; Type: TABLE; Schema: public; Owner: santymrk
--

CREATE TABLE public.partidos (
    id integer NOT NULL,
    activity_id integer NOT NULL,
    deporte text NOT NULL,
    genero text NOT NULL,
    eq1 text NOT NULL,
    eq2 text NOT NULL,
    resultado text
);


ALTER TABLE public.partidos OWNER TO santymrk;

--
-- Name: partidos_id_seq; Type: SEQUENCE; Schema: public; Owner: santymrk
--

CREATE SEQUENCE public.partidos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.partidos_id_seq OWNER TO santymrk;

--
-- Name: partidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: santymrk
--

ALTER SEQUENCE public.partidos_id_seq OWNED BY public.partidos.id;


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: santymrk
--

CREATE TABLE public.push_subscriptions (
    id integer NOT NULL,
    participant_id integer,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at text DEFAULT '2026-04-09T11:49:27.858Z'::text NOT NULL
);


ALTER TABLE public.push_subscriptions OWNER TO santymrk;

--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: santymrk
--

CREATE SEQUENCE public.push_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.push_subscriptions_id_seq OWNER TO santymrk;

--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: santymrk
--

ALTER SEQUENCE public.push_subscriptions_id_seq OWNED BY public.push_subscriptions.id;


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: santymrk
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: activities id; Type: DEFAULT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.activities ALTER COLUMN id SET DEFAULT nextval('public.activities_id_seq'::regclass);


--
-- Name: activity_participants id; Type: DEFAULT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.activity_participants ALTER COLUMN id SET DEFAULT nextval('public.activity_participants_id_seq'::regclass);


--
-- Name: extras id; Type: DEFAULT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.extras ALTER COLUMN id SET DEFAULT nextval('public.extras_id_seq'::regclass);


--
-- Name: goles id; Type: DEFAULT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.goles ALTER COLUMN id SET DEFAULT nextval('public.goles_id_seq'::regclass);


--
-- Name: invitaciones id; Type: DEFAULT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.invitaciones ALTER COLUMN id SET DEFAULT nextval('public.invitaciones_id_seq'::regclass);


--
-- Name: juego_posiciones id; Type: DEFAULT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.juego_posiciones ALTER COLUMN id SET DEFAULT nextval('public.juego_posiciones_id_seq'::regclass);


--
-- Name: juegos id; Type: DEFAULT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.juegos ALTER COLUMN id SET DEFAULT nextval('public.juegos_id_seq'::regclass);


--
-- Name: participants id; Type: DEFAULT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.participants ALTER COLUMN id SET DEFAULT nextval('public.participants_id_seq'::regclass);


--
-- Name: partidos id; Type: DEFAULT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.partidos ALTER COLUMN id SET DEFAULT nextval('public.partidos_id_seq'::regclass);


--
-- Name: push_subscriptions id; Type: DEFAULT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.push_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.push_subscriptions_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: santymrk
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	060884fac9f0993d06a8340abfc0f4ea4127757b7f11abeefc20267890c8bf60	1775677319291
\.


--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: santymrk
--

COPY public.activities (id, fecha, titulo, cant_equipos, locked) FROM stdin;
12	2026-05-02	Cuarta Actividad	4	f
9	2026-03-21	Primera actividad 	4	t
10	2026-04-04	Segunda Actividad	4	t
11	2026-04-18	Tercera Actividad	4	f
\.


--
-- Data for Name: activity_participants; Type: TABLE DATA; Schema: public; Owner: santymrk
--

COPY public.activity_participants (id, activity_id, participant_id, equipo, es_puntual, tiene_biblia, es_social) FROM stdin;
104566	9	46	E1	t	t	f
104567	9	45	E2	t	t	f
104568	9	76	E4	t	t	f
104569	9	75	E2	t	t	f
104570	9	71	E3	t	t	f
104571	9	93	E1	t	t	f
104572	9	73	E1	t	t	f
104573	9	82	E3	t	t	f
104574	9	53	E1	t	t	f
104575	9	44	E1	t	t	f
104576	9	89	E4	t	t	f
104577	9	51	E4	t	t	f
104578	9	83	E2	t	t	f
104579	9	81	E2	t	t	f
104580	9	80	E3	t	t	f
104581	9	65	E1	t	t	f
104582	9	87	E4	t	t	f
104583	9	88	E3	t	t	f
104584	9	92	E3	t	t	f
104585	9	64	E4	t	t	f
104586	9	67	E4	t	t	f
104587	9	68	E2	t	t	f
104588	9	62	E2	t	t	f
104589	9	86	E1	t	t	f
104590	9	48	E3	t	t	f
104591	9	63	E1	t	t	f
104592	9	55	E4	t	t	f
104593	9	54	E2	t	t	f
104594	9	74	E3	t	t	f
104595	9	57	E2	t	t	f
104596	9	90	E1	t	t	f
104597	9	52	E1	t	t	f
104598	9	56	E4	t	t	f
104599	9	58	E4	t	t	f
104600	9	50	E2	t	t	f
104601	9	77	E2	t	t	f
104602	9	43	E3	t	t	f
104603	9	49	E3	t	t	f
104604	9	85	E1	t	t	f
104605	9	78	E1	t	t	f
104606	9	47	E4	t	t	f
104607	9	72	E2	t	t	f
104608	9	84	E3	t	t	f
104609	9	61	E4	t	t	f
104610	9	60	E4	t	t	f
104611	9	70	E3	t	t	f
104612	9	66	E2	t	t	f
104613	9	91	E1	t	t	f
104614	9	59	E2	t	t	f
104615	9	69	E3	t	t	f
104616	9	79	E3	t	t	f
104734	10	49	E3	f	f	f
104735	10	66	E1	f	f	f
104736	10	98	E2	f	f	f
104737	10	99	E1	f	f	f
104738	10	89	\N	f	f	t
104739	10	101	E3	f	f	f
104740	10	102	E2	f	f	f
104741	10	103	E4	f	f	f
104742	10	104	E4	f	f	f
104743	10	91	E3	f	f	f
104744	10	93	E2	f	f	f
104745	10	50	E4	f	f	f
104746	10	72	E1	f	f	f
104747	10	105	\N	f	f	t
104748	10	75	E3	f	f	f
104749	10	71	E2	f	f	f
104750	10	73	E4	f	f	f
104751	10	106	\N	f	f	t
104752	10	107	E1	f	f	f
104753	10	84	\N	f	f	t
104754	10	54	E2	f	f	f
104755	10	55	E1	f	f	f
104756	10	108	\N	f	f	t
104757	10	109	E3	f	f	f
104758	10	110	E1	f	f	f
104759	10	111	E4	f	f	f
104760	10	68	E3	f	f	f
104761	10	69	E3	f	f	f
104762	10	51	E2	f	f	f
104763	10	62	E1	f	f	f
104764	10	112	\N	f	f	t
104765	10	63	\N	f	f	t
104766	10	78	E1	f	f	f
104767	10	92	E4	f	f	f
104768	10	114	\N	f	f	t
104971	11	45	E1	t	f	f
104972	11	77	E2	t	f	f
104973	11	64	E4	f	f	f
104974	11	62	E2	f	f	f
104975	11	129	\N	f	f	t
104976	11	119	E3	f	f	f
104977	11	118	E3	f	f	f
104978	11	120	E2	f	f	f
104979	11	58	E4	f	f	f
104980	11	89	E3	f	f	f
104981	11	84	\N	f	f	t
104982	11	112	E4	f	f	f
104983	11	43	E1	f	f	f
104984	11	46	E3	f	f	f
104985	11	93	E4	f	f	f
104986	11	92	E4	f	f	f
104987	11	90	E3	f	f	f
104988	11	115	E1	f	f	f
104989	11	116	E1	f	f	f
104990	11	128	E2	f	f	f
104991	11	108	\N	f	f	t
104992	11	91	E1	f	f	f
104993	11	70	E2	f	f	f
104994	11	127	E1	f	f	f
104995	11	49	E3	f	f	f
104996	11	50	E2	f	f	f
104997	11	56	E4	f	f	f
104998	11	124	E1	f	f	f
104999	11	54	E2	f	f	f
105000	11	55	E4	f	f	f
105001	11	68	E3	f	f	f
105002	11	107	E2	f	f	f
105003	11	87	E3	f	f	f
105004	11	65	E1	f	f	f
105005	11	81	E2	f	f	f
105006	11	51	E4	f	f	f
105007	11	123	E3	f	f	f
105008	11	44	E2	f	f	f
105009	11	98	E3	f	f	f
105010	11	132	E1	f	f	f
105011	11	133	E4	f	f	f
105012	11	134	E1	f	f	f
105013	11	135	E4	f	f	f
\.


--
-- Data for Name: extras; Type: TABLE DATA; Schema: public; Owner: santymrk
--

COPY public.extras (id, activity_id, participant_id, team, tipo, puntos, motivo) FROM stdin;
\.


--
-- Data for Name: goles; Type: TABLE DATA; Schema: public; Owner: santymrk
--

COPY public.goles (id, activity_id, participant_id, match_id, team, tipo, cant) FROM stdin;
256	11	\N	\N	\N	f	1
\.


--
-- Data for Name: invitaciones; Type: TABLE DATA; Schema: public; Owner: santymrk
--

COPY public.invitaciones (id, activity_id, invitador_id, invitado_id) FROM stdin;
3	11	44	134
4	11	44	135
\.


--
-- Data for Name: juego_posiciones; Type: TABLE DATA; Schema: public; Owner: santymrk
--

COPY public.juego_posiciones (id, juego_id, equipo, posicion) FROM stdin;
810	171	E4	1
811	171	E1	2
812	171	E2	3
813	171	E3	4
753	163	E2	1
754	163	E1	2
755	163	E3	3
756	163	E4	4
794	165	E1	2
795	165	E2	2
796	165	E3	2
797	165	E4	2
801	164	E1	1
802	164	E2	1
803	164	E3	2
804	164	E4	2
\.


--
-- Data for Name: juegos; Type: TABLE DATA; Schema: public; Owner: santymrk
--

COPY public.juegos (id, activity_id, nombre) FROM stdin;
171	10	Postas
172	10	Quemado
163	9	
164	9	
165	9	
\.


--
-- Data for Name: participants; Type: TABLE DATA; Schema: public; Owner: santymrk
--

COPY public.participants (id, nombre, apellido, fecha_nacimiento, sexo, foto, foto_alta_calidad, invitado_por) FROM stdin;
88	Sofi	Diale	2010-07-19	F		\N	\N
45	Mateo	Almiron	2011-07-14	M	thumb_1775775461627_tlsaik.jpg	full_1775775461649_kc0kwd.jpg	\N
51	Yamir	Cataneo	2010-12-07	M	thumb_1775683826245_przldc.jpg	full_1775683826280_0ax3g6.jpg	\N
78	Morena	Rojas	2008-12-16	F	thumb_1776197598255_7d9a7j.jpg	full_1776197598434_gb8acp.jpg	\N
67	Martu	Gomez	2011-03-05	F	thumb_1775775490155_78sbe.jpg	full_1775775490174_csr9ji.jpg	\N
74	Mailen	Mercado	2011-01-08	F	thumb_1775775509984_plbc9c.jpg	full_1775775510004_27emnk.jpg	\N
63	Luciana	Henriquez	2009-03-15	F	thumb_1775775530383_3kb5hf.jpg	full_1775775530411_9jjjlwe.jpg	\N
54	Valentin	Lucero	2014-01-20	M	thumb_1775774975197_fmgpz3.jpg	full_1775774975218_ryx7ai.jpg	\N
44	Uma	Burgos	2009-09-08	F	thumb_1775774996271_7fhvgd.jpg	full_1775774996288_b5mgg8.jpg	\N
57	Thiago	Miraval	2011-05-14	M	thumb_1775775053553_cbmzir.jpg	full_1775775053579_j8pmyo.jpg	\N
43	Sofía	Ochnicki	2010-06-06	F	thumb_1775775072229_63cb2f.jpg	full_1775775072263_jubn2v.jpg	\N
73	Shaine	Ayala	2012-10-31	F	thumb_1775775129172_g2znoe.jpg	full_1775775129208_3w5x29.jpg	\N
53	Santino	Burca	2014-01-21	M	thumb_1775775148849_o5udt.jpg	full_1775775148889_bcu1c.jpg	\N
86	Santiago	Guernos	2010-01-18	M	thumb_1775775171741_1zuxex.jpg	full_1775775171778_2hdqun.jpg	\N
50	Roman	Nuñez	2007-11-23	M	thumb_1775775185853_e14fl.jpg	full_1775775185906_42z73v.jpg	\N
72	Rodrigo 	Rolon	2010-05-23	M	thumb_1775775224673_t82amh.jpg	full_1775775224740_l1v75a.jpg	\N
47	Nicolas	Rojas	2011-01-20	M	thumb_1775775250107_173bw5.jpg	full_1775775250126_v1dwz5.jpg	\N
87	Mirko	Diale	2012-06-25	M	thumb_1775775294624_kg6cda.jpg	full_1775775294857_225i5.jpg	\N
58	Milena	Nuñez	2012-08-19	F	thumb_1775775354234_cwz8cu.jpg	full_1775775354313_ll98y.jpg	\N
83	Melanie	Chavez	2012-08-06	F	thumb_1775775383796_bq2ja.jpg	full_1775775383838_ubx37.jpg	\N
90	Felipe	Morinico	2009-01-21	M	thumb_1775775973909_a0jloq.jpg	full_1775775973928_0jfz5t.jpg	\N
56	Leandro	Nuñez	2010-07-17	M	thumb_1775775552388_w4qdqz.jpg	full_1775775552446_8ggdyk.jpg	\N
55	Julian	Ledesma	2014-05-14	M	thumb_1775775631817_l4cbss.jpg	full_1775775631864_xv5sjs.jpg	\N
59	Julia	Vivas	2009-11-11	F	thumb_1775775656220_zdf41n.jpg	full_1775775656238_wj54op.jpg	\N
66	Juan Cruz	Veron	2011-01-05	M	thumb_1775775682121_pzf47h.jpg	full_1775775682166_7prgo.jpg	\N
85	Josue	Poroma	2009-12-27	M	thumb_1775775717156_jyela.jpg	full_1775775717180_txvx8f.jpg	\N
82	Jonatan	Barrios	2011-03-22	M	thumb_1775775804001_6jow7.jpg	full_1775775804023_rfm9y.jpg	\N
80	Jonas	Corvalan	2010-01-14	M	thumb_1775775870304_ff50v4.jpg	full_1775775870376_n34cnbf.jpg	\N
49	Imanol	Petrina	2011-09-12	M	thumb_1775775892300_87dplo.jpg	full_1775775892327_4v2kx.jpg	\N
81	Gonzalo 	Corvalan	2011-04-14	M	thumb_1775775919078_vopare.jpg	full_1775775919119_r5cuva.jpg	\N
89	Francesca	Carbone	2013-07-31	F	thumb_1775775944361_t226ta.jpg	full_1775775944387_y89x4.jpg	\N
93	Esteban	Ayala	2008-11-12	M	thumb_1775776002302_j2exw.jpg	full_1775776002319_rcn4i.jpg	\N
52	Emma	Nieva	2010-06-10	F	thumb_1775776024203_w7hjop.jpg	full_1775776024227_dop6zmd.jpg	\N
71	Emilce	Ayala	2011-01-26	F	thumb_1775776055781_dff73.jpg	full_1775776055816_94nglb.jpg	\N
92	Dilan 	Diaz	2010-06-19	M	thumb_1775776086409_id50uw.jpg	full_1775776086451_v4qh2.jpg	\N
77	Catalina	Ochnicki	2009-07-03	F	thumb_1775776114716_utwa2.jpg	full_1775776114739_3pscm.jpg	\N
48	Catalina	Gutiérrez 	2010-08-29	F	thumb_1775776136433_zbol6p.jpg	full_1775776136451_xm1i6.jpg	\N
75	Candela	Ayala	2008-12-26	F	thumb_1775776157390_dam9a.jpg	full_1775776157404_flbi4j.jpg	\N
61	Camila	Rosas	2014-03-11	F			\N
64	Camila	Donaire	2013-11-03	F			\N
65	Bruno	De Vita	2014-03-01	M	thumb_1775776201267_imixgw.jpg	full_1775776201288_3n4hgw.jpg	\N
62	Briana	Gramajo	2013-12-06	F	thumb_1775776217801_uvmkyl.jpg	full_1775776217820_mggvoa.jpg	\N
68	Benjamin	Gramajo	2011-11-11	M	thumb_1775776238624_djb4u9.jpg	full_1775776238643_7tkjbb.jpg	\N
84	Anahi	Rosales	2012-03-24	F	thumb_1775776255434_ye3ekq.jpg	full_1775776255502_3cgngb.jpg	\N
76	Anahi	Apaza	2010-01-29	F	thumb_1775776273698_w8y4sl.jpg	full_1775776273715_o8vlynr.jpg	\N
46	Amira	Almiron	2009-08-18	F	thumb_1775776288876_muuowg.jpg	full_1775776288891_1cu6r.jpg	\N
91	Alan	Vilaja	2008-08-09	M	thumb_1775776305274_vyjfc.jpg	full_1775776305307_etebs.jpg	\N
60	Ainara	Sanchez	2010-05-02	F	thumb_1775776319055_sfe4a1.jpg	full_1775776319145_ka293j.jpg	\N
79	Morena	Zarate	2009-08-06	F	thumb_1776197615127_jh21a.jpg	full_1776197615169_xsrz4.jpg	\N
70	Lautaro	Vazquez	2012-03-29	M	thumb_1775872589448_o15dhb.jpg	full_1775872589499_a9gzf.jpg	\N
69	Lautaro	Zalazar	2012-01-08	M	thumb_1775872626818_959uj8.jpg	full_1775872626841_6xah2r.jpg	\N
99	Francesca	Pereira	2026-04-15	F		\N	\N
101	Melo	Eugenia	2026-04-01	F		\N	\N
102	Isabela	Gonzalez	2026-04-01	F		\N	\N
103	Fausto	Vazquez	2026-04-01	M		\N	\N
104	Uriel	Avila	2026-04-01	M		\N	\N
105	Sarai	Diaz	2026-04-01	F		\N	\N
106	Sofia	Escriba	2026-04-01	F		\N	\N
108	Naomi	Medina	2026-04-01	F		\N	\N
109	Juan Manuel	Ochnicki	2026-04-01	M		\N	\N
110	Kevin	Martinz	2026-04-01	M		\N	\N
111	Santiago	Elizalde	2026-04-01	M		\N	\N
112	Josefa	Taboada	2026-04-01	F		\N	\N
114	Emma	Cárdenas	2026-04-01	F		\N	\N
115	Jonathan 	Fernnadez	2026-01-17	M		\N	\N
116	Alan	Benitez	2010-11-26	M		\N	\N
117	Fausto	Vázquez 	2012-09-20	M		\N	\N
118	Maia	Lopez	2011-03-18	F		\N	\N
98	Elias	Acuña	2012-03-17	M		\N	\N
119	Narella	Sanchez	2012-07-21	F		\N	118
120	Agustina	Quintana	2011-09-19	F		\N	\N
121	Tobias	Villarreal	2013-01-09	M		\N	\N
122	Benjamin 	Gonzalez	2013-01-21	M		\N	\N
123	Axel	Canale	2011-06-09	M		\N	\N
124	Santino	Mendoza	2012-12-30	M		\N	\N
125	Genaro	Carix	2013-12-17	M		\N	\N
107	Dante	Eleuterio	2010-12-30	M		\N	\N
126	Benjamin	Gomez	2011-08-26	M		\N	\N
127	Lucas	Oroya	2012-06-27	M		\N	\N
128	Benjamin	Azocar	2010-10-29	M		\N	\N
129	Giuliana	Florez	2009-02-09	F		\N	\N
130	Nicolás 	González	2013-10-16	M		\N	\N
131	Mateo 	Calero	2013-07-02	M		\N	\N
132	Natalia	Balvin	2009-09-16	F		\N	\N
133	Maite 	Balvin	2003-05-03	F		\N	\N
134	Lisa	Gonzales	2013-06-11	F		\N	44
135	Damaris	Sosa	2013-02-25	M		\N	44
\.


--
-- Data for Name: partidos; Type: TABLE DATA; Schema: public; Owner: santymrk
--

COPY public.partidos (id, activity_id, deporte, genero, eq1, eq2, resultado) FROM stdin;
\.


--
-- Data for Name: push_subscriptions; Type: TABLE DATA; Schema: public; Owner: santymrk
--

COPY public.push_subscriptions (id, participant_id, endpoint, p256dh, auth, created_at) FROM stdin;
7	\N	https://updates.push.services.mozilla.com/wpush/v2/gAAAAABp2GN5hC4rr1rrh6spMpQsue7BFVVODLPDhxv0VLpMTxejg8pLxZKu96gH8xsDFeQGiFXIOZehHt95yMCPydRyaJeDU4kw20zbTt2z0jYybbcfg9gTCAdMPfdspx0L6wDVtdwb5f4K_mfZ9J9p51pBZT_yxVIjXklDQqWM03G9SrdMlrs	BDf1uo4Di2G8Y9Y_0HvWnpMqDYAwtzl4hkFNtSzWuJDIMYcYLhoDbF-gdaJrnl14C7Athr-oi_F0FpHiFx_JinA	Va1_oHJNC3i8VdQlzuWHLg	2026-04-10T02:42:00.035Z
8	\N	https://web.push.apple.com/QH7s9-i3xdEcV5nW8JvlE93hX_MKsA6DebU983vTq3x25yfS5UPQvt5CGesKcQiLAyVfDp9bnZRHE0WqauQbrCsEVVW5elRDli11W2J4HZEniTZTrSc6wbiFyLXRdWs1cWkwhW5U1xe0Spn83WzrdSY-cKtQUHwXKNj4AX5WsU4	BMjUvkg-I5Qi3I4NaJf5Wqxxk2xzXWnGiKdWZ_RNIijQkFzEqCVMSZSCQkGub29X6WOEHu_2aTKkXxQE5L8VR3A	MEy18Mlrs-oB9KzMkV-LsQ	2026-04-10T02:44:58.897Z
10	\N	https://web.push.apple.com/QEb8uIFwJHjn-04PJXzdXbIKMCaYdnNBzERfr0_jk6X0kAWurCeNcbClHhMQMLnBozvUML0nwbqKbule6lbAuomrtc1JVlE58FcFYF_8YnXpXYwNLW8rbMMEddqe49loszkxMxFhfrSAOZgnYDvbPkw3GBZo5qFYkjnlyDkoMYo	BA_913o4OAWRG9QZ0PXkTGFNcVhnMgJ5maPFM1FNf1O8hrABHL3ciY_yR1Y7DCITwzLYp006LYqTIVMg3cJz2Qw	w4WiTmHpxfn49T8rQr0xbw	2026-04-10T18:20:10.643Z
11	\N	https://web.push.apple.com/QDNG99db9Zm3Ya8tcyWeRkVg9d2vxQ0-EEuXOpn2TK4ydniAirAI2JbKW9J1dWmsG_poua5qZbbCTTd1fSdF8kxo8nhiVxrMg498jKbnYcr6L7vUvEZ25796l-XGbiV_GsHLtRcKTL4JbHd9ira6PhgyZYts6_V4T30uzxbYHfc	BNPHjp8WAlohcInsVzylJNTqVhUX6D9AYiApeA_zFO9caRpcL3WZm3t60bFYEbEn_3qgeeGAVUosx8Ps_WH5PIg	FCD744_CEe72Au_LSrYOkA	2026-04-11T01:46:22.826Z
12	\N	https://web.push.apple.com/QFhZ_epnE2_16cAdqqvqB3g2GjllwtMc9rMv2q-gJqnyLOBboWwRitSZRa8UiDudOMEIDFOBldnJuNqR7mC9HZ3A66oIk2Hxq7Ot-GE0w3kePIT4eVGD0dC1nWqsqqZdIINA0Zfx5MjYSEE46oCFAAJO9l2pploRn_Li6dI42kE	BCMzwB1eaixY7pPFsSf72eUSBzfgEERTQ-SpJtC0BaZc1FsN7PVMH6Pgg7OgsR55ppvG-GhLKg8ijPt5zSYmpSE	4LxKGAJvPvjBPe6_96CRXA	2026-04-18T16:42:18.346Z
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: santymrk
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 1, true);


--
-- Name: activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: santymrk
--

SELECT pg_catalog.setval('public.activities_id_seq', 12, true);


--
-- Name: activity_participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: santymrk
--

SELECT pg_catalog.setval('public.activity_participants_id_seq', 105013, true);


--
-- Name: extras_id_seq; Type: SEQUENCE SET; Schema: public; Owner: santymrk
--

SELECT pg_catalog.setval('public.extras_id_seq', 158, true);


--
-- Name: goles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: santymrk
--

SELECT pg_catalog.setval('public.goles_id_seq', 256, true);


--
-- Name: invitaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: santymrk
--

SELECT pg_catalog.setval('public.invitaciones_id_seq', 4, true);


--
-- Name: juego_posiciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: santymrk
--

SELECT pg_catalog.setval('public.juego_posiciones_id_seq', 817, true);


--
-- Name: juegos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: santymrk
--

SELECT pg_catalog.setval('public.juegos_id_seq', 172, true);


--
-- Name: participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: santymrk
--

SELECT pg_catalog.setval('public.participants_id_seq', 135, true);


--
-- Name: partidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: santymrk
--

SELECT pg_catalog.setval('public.partidos_id_seq', 1, true);


--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: santymrk
--

SELECT pg_catalog.setval('public.push_subscriptions_id_seq', 12, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: santymrk
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: activity_participants activity_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.activity_participants
    ADD CONSTRAINT activity_participants_pkey PRIMARY KEY (id);


--
-- Name: extras extras_pkey; Type: CONSTRAINT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.extras
    ADD CONSTRAINT extras_pkey PRIMARY KEY (id);


--
-- Name: goles goles_pkey; Type: CONSTRAINT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.goles
    ADD CONSTRAINT goles_pkey PRIMARY KEY (id);


--
-- Name: invitaciones invitaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.invitaciones
    ADD CONSTRAINT invitaciones_pkey PRIMARY KEY (id);


--
-- Name: juego_posiciones juego_posiciones_pkey; Type: CONSTRAINT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.juego_posiciones
    ADD CONSTRAINT juego_posiciones_pkey PRIMARY KEY (id);


--
-- Name: juegos juegos_pkey; Type: CONSTRAINT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.juegos
    ADD CONSTRAINT juegos_pkey PRIMARY KEY (id);


--
-- Name: participants participants_pkey; Type: CONSTRAINT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_pkey PRIMARY KEY (id);


--
-- Name: partidos partidos_pkey; Type: CONSTRAINT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.partidos
    ADD CONSTRAINT partidos_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: unq_juego_equipo; Type: INDEX; Schema: public; Owner: santymrk
--

CREATE UNIQUE INDEX unq_juego_equipo ON public.juego_posiciones USING btree (juego_id, equipo);


--
-- Name: activity_participants activity_participants_activity_id_activities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.activity_participants
    ADD CONSTRAINT activity_participants_activity_id_activities_id_fk FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;


--
-- Name: activity_participants activity_participants_participant_id_participants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.activity_participants
    ADD CONSTRAINT activity_participants_participant_id_participants_id_fk FOREIGN KEY (participant_id) REFERENCES public.participants(id) ON DELETE CASCADE;


--
-- Name: extras extras_activity_id_activities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.extras
    ADD CONSTRAINT extras_activity_id_activities_id_fk FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;


--
-- Name: extras extras_participant_id_participants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.extras
    ADD CONSTRAINT extras_participant_id_participants_id_fk FOREIGN KEY (participant_id) REFERENCES public.participants(id) ON DELETE CASCADE;


--
-- Name: goles goles_activity_id_activities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.goles
    ADD CONSTRAINT goles_activity_id_activities_id_fk FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;


--
-- Name: goles goles_participant_id_participants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.goles
    ADD CONSTRAINT goles_participant_id_participants_id_fk FOREIGN KEY (participant_id) REFERENCES public.participants(id) ON DELETE CASCADE;


--
-- Name: invitaciones invitaciones_activity_id_activities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.invitaciones
    ADD CONSTRAINT invitaciones_activity_id_activities_id_fk FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;


--
-- Name: invitaciones invitaciones_invitado_id_participants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.invitaciones
    ADD CONSTRAINT invitaciones_invitado_id_participants_id_fk FOREIGN KEY (invitado_id) REFERENCES public.participants(id) ON DELETE CASCADE;


--
-- Name: invitaciones invitaciones_invitador_id_participants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.invitaciones
    ADD CONSTRAINT invitaciones_invitador_id_participants_id_fk FOREIGN KEY (invitador_id) REFERENCES public.participants(id) ON DELETE CASCADE;


--
-- Name: juego_posiciones juego_posiciones_juego_id_juegos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.juego_posiciones
    ADD CONSTRAINT juego_posiciones_juego_id_juegos_id_fk FOREIGN KEY (juego_id) REFERENCES public.juegos(id) ON DELETE CASCADE;


--
-- Name: juegos juegos_activity_id_activities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.juegos
    ADD CONSTRAINT juegos_activity_id_activities_id_fk FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;


--
-- Name: partidos partidos_activity_id_activities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: santymrk
--

ALTER TABLE ONLY public.partidos
    ADD CONSTRAINT partidos_activity_id_activities_id_fk FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 36N04NtYZD8dVft2arwVTV3LlDavA6rgPrJMepvNoYeiWhQLlIscfxJEecsqSO2

