-- Synthetic demo data only (invented names). Safe to share; contains nothing from production.
DO $$
DECLARE
  f_names text[] := ARRAY['Sofia','Valentina','Camila','Martina','Lucia','Julieta','Emma','Mia','Abril','Renata','Olivia','Alma'];
  m_names text[] := ARRAY['Mateo','Benjamin','Santiago','Thiago','Lucas','Joaquin','Bautista','Tomas','Franco','Lautaro','Ian','Ciro'];
  surnames text[] := ARRAY['Gomez','Rojas','Diaz','Perez','Sosa','Torres','Ruiz','Acosta','Medina','Herrera','Suarez','Romero','Flores','Benitez','Castro','Molina'];
  n int := 48;
  i int; a int; g int; t int;
  act_id int; game_id int; part_ids int[];
  titles text[] := ARRAY['Especial primavera','Tarde de juegos','Noche de talentos'];
  dates text[] := ARRAY['2026-09-19','2026-09-26','2026-10-03'];
  teams text[] := ARRAY['E1','E2','E3','E4'];
  game_names text[] := ARRAY['Carrera de postas','Tira y afloje','Mimica','Caza del tesoro'];
  pid int; team text;
BEGIN
  FOR i IN 1..n LOOP
    INSERT INTO participants (nombre, apellido, fecha_nacimiento, sexo, telefono)
    VALUES (
      CASE WHEN i % 2 = 0 THEN f_names[1 + (i / 2) % 12] ELSE m_names[1 + (i / 2) % 12] END,
      surnames[1 + (i * 7) % 16],
      make_date(2008 + (i % 7), 1 + (i % 12), 1 + (i % 27))::text,
      CASE WHEN i % 2 = 0 THEN 'F' ELSE 'M' END,
      '11' || lpad((40000000 + i * 1237)::text, 8, '0')
    );
  END LOOP;
  SELECT array_agg(id ORDER BY id) INTO part_ids FROM participants;

  FOR a IN 1..3 LOOP
    INSERT INTO activities (fecha, titulo, cant_equipos) VALUES (dates[a], titles[a], 4) RETURNING id INTO act_id;

    -- attendance with round-robin teams
    FOR i IN 1..n LOOP
      IF i % 5 <> a THEN
        pid := part_ids[i];
        INSERT INTO activity_participants (activity_id, participant_id, equipo, es_puntual, tiene_biblia, es_social)
        VALUES (act_id, pid, teams[1 + (i % 4)], i % 3 = 0, i % 4 = 0, i % 9 = 0);
      END IF;
    END LOOP;

    -- group games with a rotating ranking per game
    FOR g IN 1..4 LOOP
      INSERT INTO juegos (activity_id, nombre, tipo) VALUES (act_id, game_names[g], 'grupal') RETURNING id INTO game_id;
      FOR t IN 1..4 LOOP
        INSERT INTO juego_posiciones (juego_id, equipo, posicion) VALUES (game_id, teams[t], 1 + ((t + g + a) % 4));
      END LOOP;
    END LOOP;

    -- goals (f = futbol, h = handball, b = basquet)
    FOR i IN 1..10 LOOP
      INSERT INTO goles (activity_id, participant_id, team, tipo, cant)
      VALUES (act_id, part_ids[1 + (i * 5 + a) % n], teams[1 + (i % 4)], (ARRAY['f','h','b'])[1 + (i % 3)], 1 + (i % 3));
    END LOOP;

    -- team point adjustments
    INSERT INTO extras (activity_id, team, tipo, puntos, motivo) VALUES
      (act_id, teams[1 + a % 4], 'extra', 5, 'Mejor aliento'),
      (act_id, teams[1 + (a + 1) % 4], 'descuento', -3, 'Llegaron tarde al juego');

    -- partidos
    INSERT INTO partidos (activity_id, deporte, genero, eq1, eq2, resultado) VALUES
      (act_id, 'Fútbol', 'M', 'E1', 'E2', '2-1'),
      (act_id, 'Vóley', 'F', 'E3', 'E4', '2-0');

    -- invitations: different people and a different count in each activity, so filtering by activity changes the ranking
    FOR i IN 1..(4 + a) LOOP
      INSERT INTO invitaciones (activity_id, invitador_id, invitado_id)
      VALUES (act_id, part_ids[((i + 3 * (a - 1)) % 8) + 1], part_ids[n - i - a]);
    END LOOP;
  END LOOP;
END $$;

SELECT 'participants=' || (SELECT count(*) FROM participants)
  || ' activities=' || (SELECT count(*) FROM activities)
  || ' asistencias=' || (SELECT count(*) FROM activity_participants)
  || ' juegos=' || (SELECT count(*) FROM juegos)
  || ' goles=' || (SELECT count(*) FROM goles)
  || ' extras=' || (SELECT count(*) FROM extras);
