CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
total_users INT := 40;
idx INT;

first_names TEXT[] := ARRAY[
'Ana','Lucas','Marina','Pedro','Julia','Rafael','Larissa','Bruno','Camila','Thiago',
'Beatriz','Felipe','Isabela','Gabriel','Leticia','Matheus','Amanda','Vinicius','Clara','Joao',
'Helena','Caio','Bianca','Leonardo','Yasmin','Gustavo','Nina','Enzo','Melissa','Daniel'
];

last_names TEXT[] := ARRAY[
'Silva','Souza','Oliveira','Santos','Costa','Almeida','Pereira','Rodrigues','Ferreira','Gomes',
'Barbosa','Ribeiro','Carvalho','Melo','Martins','Rocha','Dias','Araujo','Monteiro','Teixeira'
];

bios TEXT[] := ARRAY[
'Musico versatil buscando novas collabs.',
'Curto experimentar sonoridades diferentes e criar junto.',
'Disponivel para projetos autorais, estudios e shows.',
'Foco em performance, arranjo e colaboracoes de longo prazo.',
'Sempre em busca de artistas com identidade forte.',
'Trabalho com composicao, producao e performance ao vivo.',
'Aberto a collabs presenciais e remotas.',
'Gosto de construir som com identidade e cuidado nos detalhes.',
'Buscando conexoes criativas com outros musicos.',
'Tenho experiencia em palco, estudio e producao independente.'
];

levels TEXT[] := ARRAY['beginner', 'intermediate', 'advanced', 'expert'];

category_total INT;
skill_total INT;
genre_total INT;

user_id users.id%TYPE;
full_name TEXT;
email TEXT;
bio TEXT;
collab_min INT;
collab_max INT;
category_count INT;
skill_count INT;
genre_count INT;

category*row RECORD;
skill_row RECORD;
genre_row RECORD;
BEGIN
SELECT COUNT(*) INTO category*total FROM profile_categories;
SELECT COUNT(*) INTO skill_total FROM skills;
SELECT COUNT(\*) INTO genre_total FROM genres;

IF category_total = 0 THEN
RAISE EXCEPTION 'Tabela profile_categories está vazia.';
END IF;

IF skill_total = 0 THEN
RAISE EXCEPTION 'Tabela skills está vazia.';
END IF;

IF genre_total = 0 THEN
RAISE EXCEPTION 'Tabela genres está vazia.';
END IF;

FOR idx IN 1..total_users LOOP
full_name :=
first_names[1 + floor(random() * array_length(first_names, 1))::INT] || ' ' ||
last_names[1 + floor(random() * array_length(last_names, 1))::INT];

    email :=
      lower(replace(full_name, ' ', '.')) || '.' ||
      to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '.' ||
      idx || '@seed.auri.local';

    bio :=
      bios[1 + floor(random() * array_length(bios, 1))::INT];

    INSERT INTO users (name, email, auth_id, is_active, deleted_at)
    VALUES (full_name, email, gen_random_uuid()::TEXT, true, NULL)
    RETURNING id INTO user_id;

    IF random() < 0.25 THEN
      collab_min := 0;
      collab_max := 0;
    ELSE
      collab_min := (ARRAY[50,100,150,200,250,300,400,500,700,1000])[1 + floor(random() * 10)::INT];
      collab_max := collab_min + (ARRAY[50,100,150,200,300,500])[1 + floor(random() * 6)::INT];
    END IF;

    INSERT INTO profiles (
      user_id,
      bio,
      profile_picture_url,
      accept_messages_from_non_matches,
      collab_price_min,
      collab_price_max
    )
    VALUES (
      user_id,
      bio,
      'https://ui-avatars.com/api/?name=' || replace(full_name, ' ', '+') || '&background=random',
      random() < 0.35,
      collab_min,
      collab_max
    );

    category_count := LEAST(category_total, 1 + floor(random() * 3)::INT);
    skill_count := LEAST(skill_total, 2 + floor(random() * 5)::INT);
    genre_count := LEAST(genre_total, 1 + floor(random() * 4)::INT);

    FOR category_row IN
      SELECT picked.id, row_number() OVER () AS rn
      FROM (
        SELECT id
        FROM profile_categories
        ORDER BY random()
        LIMIT category_count
      ) picked
    LOOP
      INSERT INTO user_profile_categories (
        user_id,
        category_id,
        is_primary,
        years_experience,
        proficiency_level
      )
      VALUES (
        user_id,
        category_row.id,
        category_row.rn = 1,
        floor(random() * 16)::INT,
        levels[1 + floor(random() * array_length(levels, 1))::INT]
      );
    END LOOP;

    FOR skill_row IN
      SELECT id
      FROM skills
      ORDER BY random()
      LIMIT skill_count
    LOOP
      INSERT INTO user_skills (
        user_id,
        skill_id,
        proficiency_level,
        years_experience
      )
      VALUES (
        user_id,
        skill_row.id,
        levels[1 + floor(random() * array_length(levels, 1))::INT],
        CASE
          WHEN random() < 0.2 THEN NULL
          ELSE floor(random() * 16)::INT
        END
      );
    END LOOP;

    FOR genre_row IN
      SELECT picked.id, row_number() OVER () AS rn
      FROM (
        SELECT id
        FROM genres
        ORDER BY random()
        LIMIT genre_count
      ) picked
    LOOP
      INSERT INTO user_genres (
        user_id,
        genre_id,
        is_primary
      )
      VALUES (
        user_id,
        genre_row.id,
        genre_row.rn = 1
      );
    END LOOP;

END LOOP;
END $$;
