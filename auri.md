# 📋 DOCUMENTO DE REQUISITOS - Tinder para Músicos (V1 REVISADO)

---

## 🎯 1. VISÃO GERAL DO PRODUTO

**Nome:** Tinder para Músicos  
**Propósito:** Plataforma de networking para músicos se conectarem através de vídeos musicais (estilo TikTok + Tinder)  
**Público-alvo:** Músicos, produtores, DJs, beatmakers (+18 anos inicialmente)

---

## 🏗️ 2. ARQUITETURA DE MÓDULOS

### **V1 - MVP (Prioridade MÁXIMA)**

| #   | Módulo               | Responsabilidade               | Tabelas                                             |
| --- | -------------------- | ------------------------------ | --------------------------------------------------- |
| 1   | **AuthModule**       | Autenticação via Supabase      | `users`                                             |
| 2   | **ProfilesModule**   | Gestão de perfil básico        | `profiles`                                          |
| 3   | **CategoriesModule** | Categorias musicais do usuário | `profile_categories`, `user_profile_categories`     |
| 4   | **SkillsModule**     | Skills específicas (opcional)  | `skill_categories`, `skills`, `user_skills`         |
| 5   | **GenresModule**     | Gêneros musicais               | `genres`, `user_genres`                             |
| 6   | **VideosModule**     | Upload e gestão de vídeos      | `videos`                                            |
| 7   | **MatchingModule**   | Feed, swipes, matches          | `swipes`, `matches`, `user_matches`, `daily_limits` |
| 8   | **MessagesModule**   | Chat entre matches             | `conversations`, `messages`                         |

### **V1.5 - Pós-MVP**

| #   | Módulo                  | Responsabilidade        |
| --- | ----------------------- | ----------------------- |
| 9   | **NotificationsModule** | Push notifications      |
| 10  | **AnalyticsModule**     | Estatísticas e métricas |
| 11  | **ModerationModule**    | Denúncias e bloqueios   |

### **V2 - Futuro**

| #   | Módulo                  | Responsabilidade                |
| --- | ----------------------- | ------------------------------- |
| 12  | **SubscriptionsModule** | Planos e pagamentos (Stripe)    |
| 13  | **ServicesModule**      | Serviços oferecidos por músicos |
| 14  | **LocationModule**      | Sistema de geolocalização       |

---

## 🗄️ 3. SCHEMA DO BANCO DE DADOS REVISADO

### **📊 Schema Completo (V1)**

```sql
-- ============================================
-- AUTH (Supabase)
-- ============================================

-- Objetivo: Armazenar dados de autenticação dos usuários
users
  - id (UUID PRIMARY KEY)
  - email (TEXT NOT NULL UNIQUE)
    -- Exemplo: "joao.silva@email.com"

  - name (TEXT NOT NULL)
    -- Exemplo: "João Silva"

  - date_of_birth (DATE NOT NULL)
    -- Exemplo: '1995-03-15'
    -- Usado para validar idade mínima de 18 anos

  - is_active (BOOLEAN DEFAULT true)
    -- true = conta ativa, false = conta deletada (soft delete)

  - deleted_at (TIMESTAMP)
    -- Exemplo: '2024-03-15 14:30:00'
    -- Preenchido quando usuário deleta a conta

  - created_at (TIMESTAMP DEFAULT NOW())
  - updated_at (TIMESTAMP DEFAULT NOW())

  CREATE INDEX idx_users_email ON users(email);
  CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- ============================================
-- PERFIL BASE
-- ============================================

-- Objetivo: Dados básicos do perfil do músico
profiles
  - user_id (UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE)

  - bio (TEXT)
    -- Exemplo: "Guitarrista de rock com 10 anos de experiência, procurando banda para projetos autorais"
    -- Máximo: 500 caracteres

  - profile_picture_url (TEXT)
    -- Exemplo: "https://storage.supabase.co/avatars/user123.jpg"

  - accept_messages_from_non_matches (BOOLEAN DEFAULT false)
    -- true = aceita mensagens de quem não deu match (feature premium V2)
    -- false = só aceita de matches

  - created_at (TIMESTAMP DEFAULT NOW())
  - updated_at (TIMESTAMP DEFAULT NOW())

  CHECK (LENGTH(bio) <= 500)

-- ============================================
-- CATEGORIAS DE PERFIL
-- ============================================

-- Objetivo: Lista de categorias/tipos de músico disponíveis na plataforma
profile_categories
  - id (BIGSERIAL PRIMARY KEY)

  - name (TEXT NOT NULL UNIQUE)
    -- Exemplo: "Guitarrista", "Produtor Musical", "DJ"

  - slug (TEXT NOT NULL UNIQUE)
    -- Exemplo: "guitarist", "producer", "dj"
    -- Usado em URLs e filtros

  - description (TEXT)
    -- Exemplo: "Músicos que tocam guitarra elétrica, acústica ou clássica"

  - icon_url (TEXT)
    -- Exemplo: "https://cdn.app.com/icons/guitar.svg"

  - created_at (TIMESTAMP DEFAULT NOW())

  CREATE INDEX idx_profile_categories_slug ON profile_categories(slug);

-- Objetivo: Categorias que cada usuário possui (ex: Guitarrista + Produtor)
user_profile_categories
  - user_id (UUID REFERENCES users(id) ON DELETE CASCADE)
  - category_id (BIGINT REFERENCES profile_categories(id) ON DELETE CASCADE)

  - is_primary (BOOLEAN DEFAULT false)
    -- true = categoria principal (aparece no badge do feed)
    -- Apenas 1 categoria pode ser primária por usuário

  - years_experience (INT)
    -- Exemplo: 5 (5 anos como guitarrista)

  - proficiency_level (TEXT)
    -- Valores: 'beginner', 'intermediate', 'advanced', 'expert'

  - created_at (TIMESTAMP DEFAULT NOW())
  - updated_at (TIMESTAMP DEFAULT NOW())

  PRIMARY KEY(user_id, category_id)
  CREATE INDEX idx_user_profile_categories_user ON user_profile_categories(user_id);
  CREATE INDEX idx_user_profile_categories_category ON user_profile_categories(category_id);
  CREATE UNIQUE INDEX idx_user_one_primary_category ON user_profile_categories(user_id) WHERE is_primary = true;

  CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert'))
  CHECK (years_experience >= 0 AND years_experience <= 100)

-- ============================================
-- SKILLS
-- ============================================

-- Objetivo: Categorias para organizar skills (ex: DAWs, Guitarras, Técnicas)
skill_categories
  - id (BIGSERIAL PRIMARY KEY)

  - name (TEXT NOT NULL UNIQUE)
    -- Exemplo: "DAWs", "Guitarras", "Técnicas de Produção"

  - slug (TEXT NOT NULL UNIQUE)
    -- Exemplo: "daws", "guitars", "production-techniques"

  - description (TEXT)
  - icon_url (TEXT)
  - created_at (TIMESTAMP DEFAULT NOW())

  CREATE INDEX idx_skill_categories_slug ON skill_categories(slug);

-- Objetivo: Lista de skills específicas disponíveis
skills
  - id (BIGSERIAL PRIMARY KEY)
  - category_id (BIGINT REFERENCES skill_categories(id))

  - name (TEXT NOT NULL UNIQUE)
    -- Exemplo: "Electric Guitar", "FL Studio", "Mixing"

  - slug (TEXT NOT NULL UNIQUE)
    -- Exemplo: "electric-guitar", "fl-studio", "mixing"

  - description (TEXT)
  - icon_url (TEXT)
  - created_at (TIMESTAMP DEFAULT NOW())

  CREATE INDEX idx_skills_category ON skills(category_id);
  CREATE INDEX idx_skills_slug ON skills(slug);

-- Objetivo: Skills que cada usuário possui
user_skills
  - user_id (UUID REFERENCES users(id) ON DELETE CASCADE)
  - skill_id (BIGINT REFERENCES skills(id) ON DELETE CASCADE)

  - proficiency_level (TEXT)
    -- Valores: 'beginner', 'intermediate', 'advanced', 'expert'

  - years_experience (INT)
    -- Exemplo: 3 (3 anos usando FL Studio)
    -- NULL = não especificado

  - created_at (TIMESTAMP DEFAULT NOW())
  - updated_at (TIMESTAMP DEFAULT NOW())

  PRIMARY KEY(user_id, skill_id)
  CREATE INDEX idx_user_skills_user ON user_skills(user_id);
  CREATE INDEX idx_user_skills_skill ON user_skills(skill_id);

  CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert'))
  CHECK (years_experience IS NULL OR (years_experience >= 0 AND years_experience <= 100))

-- ============================================
-- GÊNEROS MUSICAIS
-- ============================================

-- Objetivo: Lista de gêneros musicais disponíveis
genres
  - id (BIGSERIAL PRIMARY KEY)

  - name (TEXT NOT NULL UNIQUE)
    -- Exemplo: "Rock", "Trap", "Jazz"

  - slug (TEXT NOT NULL UNIQUE)
    -- Exemplo: "rock", "trap", "jazz"

  - category (TEXT)
    -- Valores: 'main' (Rock, Jazz), 'sub' (Pop Punk, Trap), 'fusion', 'niche'

  - search_tags (TEXT[])
    -- Exemplo: ARRAY['rock', 'alternative', 'indie']
    -- Usado para melhorar busca/filtros

  - icon_url (TEXT)
  - color (TEXT)
    -- Exemplo: "#FF5733" (cor temática para UI)

  - created_at (TIMESTAMP DEFAULT NOW())

  CREATE INDEX idx_genres_search_tags ON genres USING GIN(search_tags);
  CREATE INDEX idx_genres_category ON genres(category);
  CREATE INDEX idx_genres_slug ON genres(slug);

  CHECK (category IN ('main', 'sub', 'fusion', 'niche'))

-- Objetivo: Gêneros que cada usuário toca/produz
user_genres
  - user_id (UUID REFERENCES users(id) ON DELETE CASCADE)
  - genre_id (BIGINT REFERENCES genres(id) ON DELETE CASCADE)

  - is_primary (BOOLEAN DEFAULT false)
    -- true = gênero principal do usuário

  - created_at (TIMESTAMP DEFAULT NOW())

  PRIMARY KEY(user_id, genre_id)
  CREATE INDEX idx_user_genres_user ON user_genres(user_id);
  CREATE INDEX idx_user_genres_genre ON user_genres(genre_id);

-- ============================================
-- VÍDEOS
-- ============================================

-- Objetivo: Vídeos musicais dos usuários (portfolio)
videos
  - id (UUID PRIMARY KEY DEFAULT gen_random_uuid())
  - user_id (UUID REFERENCES users(id) ON DELETE CASCADE)

  - storage_key (TEXT NOT NULL)
    -- Exemplo: "users/abc123/videos/video-456.mp4"
    -- Chave para buscar no Supabase Storage ou S3

  - thumbnail_url (TEXT)
    -- Exemplo: "https://storage.app.com/thumbnails/video-456.jpg"

  - title (TEXT)
    -- Exemplo: "Solo de guitarra - Stairway to Heaven"

  - description (TEXT)
    -- Exemplo: "Improviso de blues no meu estúdio 🎸"

  - duration (INT)
    -- Exemplo: 120 (120 segundos = 2 minutos)

  - file_size (BIGINT)
    -- Exemplo: 52428800 (50MB em bytes)

  - mime_type (TEXT)
    -- Exemplo: "video/mp4", "video/webm"

  - view_count (INT DEFAULT 0)
    -- Contador de visualizações no feed

  - order_position (INT DEFAULT 0)
    -- Ordem de exibição no perfil (0 = primeiro)

  - is_public (BOOLEAN DEFAULT true)
    -- true = aparece no feed, false = privado

  - created_at (TIMESTAMP DEFAULT NOW())
  - updated_at (TIMESTAMP DEFAULT NOW())

  CREATE INDEX idx_videos_user ON videos(user_id);
  CREATE INDEX idx_videos_created ON videos(created_at DESC);
  CREATE INDEX idx_videos_public ON videos(is_public) WHERE is_public = true;

  -- Validações
  CHECK (duration >= 15 AND duration <= 180) -- 15seg a 3min
  CHECK (file_size <= 524288000) -- 500MB

-- ============================================
-- SISTEMA DE MATCHING
-- ============================================

-- Objetivo: Registrar swipes (likes/passes) entre usuários
swipes
  - id (UUID PRIMARY KEY DEFAULT gen_random_uuid())
  - from_user_id (UUID REFERENCES users(id) ON DELETE CASCADE)
  - to_user_id (UUID REFERENCES users(id) ON DELETE CASCADE)

  - to_video_id (UUID REFERENCES videos(id) ON DELETE SET NULL)
    -- Exemplo: UUID do vídeo que estava sendo exibido quando deu o swipe
    -- Útil para analytics: qual vídeo gera mais likes?

  - action (TEXT NOT NULL)
    -- Valores: 'like', 'pass', 'super_like' (V2)

  - expires_at (TIMESTAMP)
    -- Exemplo: '2024-04-01 10:00:00'
    -- Swipes de 'pass' expiram após 15 dias
    -- NULL = swipe de 'like' (não expira)

  - is_active (BOOLEAN GENERATED ALWAYS AS (expires_at IS NULL OR expires_at > NOW()) STORED)
    -- Coluna computada: true se swipe ainda está ativo

  - created_at (TIMESTAMP DEFAULT NOW())

  UNIQUE(from_user_id, to_user_id)
  CREATE INDEX idx_swipes_from_user ON swipes(from_user_id);
  CREATE INDEX idx_swipes_to_user ON swipes(to_user_id);
  CREATE INDEX idx_swipes_action ON swipes(action) WHERE action = 'like';
  CREATE INDEX idx_swipes_active ON swipes(is_active) WHERE is_active = true;

  CHECK (from_user_id != to_user_id)
  CHECK (action IN ('like', 'pass', 'super_like'))

-- Objetivo: Armazenar matches (quando ambos deram like)
matches
  - id (UUID PRIMARY KEY DEFAULT gen_random_uuid())

  - status (TEXT DEFAULT 'active')
    -- Valores: 'active', 'deleted', 'blocked'

  - matched_at (TIMESTAMP DEFAULT NOW())
    -- Quando o match foi criado

  - last_message_at (TIMESTAMP)
    -- Última mensagem enviada (para ordenação)

  - created_at (TIMESTAMP DEFAULT NOW())
  - updated_at (TIMESTAMP DEFAULT NOW())

  CREATE INDEX idx_matches_status ON matches(status) WHERE status = 'active';
  CREATE INDEX idx_matches_recent ON matches(last_message_at DESC NULLS LAST);

  CHECK (status IN ('active', 'deleted', 'blocked'))

-- Objetivo: Relacionar usuários com matches (many-to-many)
-- Resolve problema de user_id_1/user_id_2
user_matches
  - match_id (UUID REFERENCES matches(id) ON DELETE CASCADE)
  - user_id (UUID REFERENCES users(id) ON DELETE CASCADE)

  - has_deleted_conversation (BOOLEAN DEFAULT false)
    -- true = usuário deletou a conversa (mas match ainda existe)

  - created_at (TIMESTAMP DEFAULT NOW())

  PRIMARY KEY(match_id, user_id)
  CREATE INDEX idx_user_matches_user ON user_matches(user_id);
  CREATE INDEX idx_user_matches_match ON user_matches(match_id);

-- Objetivo: Controlar limites diários de ações (plano grátis V2)
daily_limits
  - user_id (UUID REFERENCES users(id) ON DELETE CASCADE)

  - date (DATE NOT NULL DEFAULT CURRENT_DATE)
    -- Exemplo: '2024-03-15'

  - swipes_count (INT DEFAULT 0)
    -- Quantos swipes (like + pass) o usuário deu hoje

  - likes_viewed_count (INT DEFAULT 0)
    -- Quantos perfis de "quem curtiu você" desbloqueou hoje

  - created_at (TIMESTAMP DEFAULT NOW())
  - updated_at (TIMESTAMP DEFAULT NOW())

  PRIMARY KEY(user_id, date)
  CREATE INDEX idx_daily_limits_date ON daily_limits(date DESC);

-- Trigger: Cleanup automático de registros > 30 dias
CREATE OR REPLACE FUNCTION cleanup_old_daily_limits()
RETURNS trigger AS $$
BEGIN
  DELETE FROM daily_limits WHERE date < CURRENT_DATE - INTERVAL '30 days';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_daily_limits
  AFTER INSERT ON daily_limits
  EXECUTE FUNCTION cleanup_old_daily_limits();

-- ============================================
-- CHAT
-- ============================================

-- Objetivo: Conversas entre matches
conversations
  - id (UUID PRIMARY KEY DEFAULT gen_random_uuid())

  - match_id (UUID REFERENCES matches(id) ON DELETE SET NULL)
    -- SET NULL = mantém conversa mesmo se match for deletado
    -- Útil para histórico/moderação

  - is_active (BOOLEAN DEFAULT true)
    -- false = conversa fechada (match deletado ou bloqueio)

  - created_at (TIMESTAMP DEFAULT NOW())
  - updated_at (TIMESTAMP DEFAULT NOW())

  CREATE INDEX idx_conversations_match ON conversations(match_id);
  CREATE INDEX idx_conversations_active ON conversations(is_active) WHERE is_active = true;

-- Objetivo: Mensagens trocadas entre usuários
messages
  - id (UUID PRIMARY KEY DEFAULT gen_random_uuid())
  - conversation_id (UUID REFERENCES conversations(id) ON DELETE CASCADE)
  - sender_id (UUID REFERENCES users(id) ON DELETE CASCADE)

  - content_type (TEXT NOT NULL)
    -- Valores: 'text', 'image', 'audio', 'link'

  - content (TEXT NOT NULL)
    -- Se text: o texto da mensagem
    -- Se image/audio: URL do arquivo
    -- Se link: URL do link

  - metadata (JSONB)
    -- Exemplo para imagem: {"filename": "photo.jpg", "size": 1024000}
    -- Exemplo para áudio: {"duration": 30, "format": "mp3"}

  - is_read (BOOLEAN DEFAULT false)
    -- true = destinatário já leu a mensagem

  - created_at (TIMESTAMP DEFAULT NOW())

  CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
  CREATE INDEX idx_messages_sender ON messages(sender_id);

  CHECK (content_type IN ('text', 'image', 'audio', 'link'))

-- ============================================
-- BLOQUEIOS (V1.5)
-- ============================================

-- Objetivo: Registro de usuários bloqueados
blocks
  - id (UUID PRIMARY KEY DEFAULT gen_random_uuid())
  - blocker_user_id (UUID REFERENCES users(id) ON DELETE CASCADE)
  - blocked_user_id (UUID REFERENCES users(id) ON DELETE CASCADE)

  - reason (TEXT)
    -- Exemplo: "spam", "comportamento_inadequado"

  - created_at (TIMESTAMP DEFAULT NOW())

  UNIQUE(blocker_user_id, blocked_user_id)
  CREATE INDEX idx_blocks_blocker ON blocks(blocker_user_id);
  CREATE INDEX idx_blocks_blocked ON blocks(blocked_user_id);

  CHECK (blocker_user_id != blocked_user_id)

-- ============================================
-- DENÚNCIAS (V1.5)
-- ============================================

-- Objetivo: Denúncias de perfis/vídeos inapropriados
reports
  - id (UUID PRIMARY KEY DEFAULT gen_random_uuid())
  - reporter_user_id (UUID REFERENCES users(id) ON DELETE CASCADE)
  - reported_user_id (UUID REFERENCES users(id) ON DELETE CASCADE)
  - reported_video_id (UUID REFERENCES videos(id) ON DELETE SET NULL)

  - reason (TEXT NOT NULL)
    -- Exemplo: "spam", "conteudo_inapropriado", "fake_profile"

  - description (TEXT)
    -- Detalhes da denúncia

  - status (TEXT DEFAULT 'pending')
    -- Valores: 'pending', 'reviewed', 'resolved', 'dismissed'

  - reviewed_by (UUID REFERENCES users(id) ON DELETE SET NULL)
    -- ID do moderador que revisou

  - reviewed_at (TIMESTAMP)
  - created_at (TIMESTAMP DEFAULT NOW())

  CREATE INDEX idx_reports_reported_user ON reports(reported_user_id);
  CREATE INDEX idx_reports_status ON reports(status) WHERE status = 'pending';

  CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed'))

-- ============================================
-- ANALYTICS (V1.5)
-- ============================================

-- Objetivo: Rastrear interações para analytics e algoritmo de feed
user_interactions
  - id (UUID PRIMARY KEY DEFAULT gen_random_uuid())
  - user_id (UUID REFERENCES users(id) ON DELETE CASCADE)
  - target_user_id (UUID REFERENCES users(id) ON DELETE CASCADE)

  - interaction_type (TEXT NOT NULL)
    -- Valores: 'profile_view', 'video_view', 'video_complete'

  - metadata (JSONB)
    -- Exemplo: {"video_id": "abc123", "watch_time": 45}

  - created_at (TIMESTAMP DEFAULT NOW())

  CREATE INDEX idx_interactions_user ON user_interactions(user_id);
  CREATE INDEX idx_interactions_target ON user_interactions(target_user_id);
  CREATE INDEX idx_interactions_type ON user_interactions(interaction_type);
  CREATE INDEX idx_interactions_created ON user_interactions(created_at DESC);

  CHECK (interaction_type IN ('profile_view', 'video_view', 'video_complete'))

-- Objetivo: Estatísticas agregadas por usuário
user_activity
  - user_id (UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE)

  - last_seen_at (TIMESTAMP DEFAULT NOW())
    -- Última vez online

  - last_swipe_at (TIMESTAMP)
  - last_match_at (TIMESTAMP)

  - total_swipes (INT DEFAULT 0)
  - total_matches (INT DEFAULT 0)
  - total_profile_views (INT DEFAULT 0)
  - total_video_views (INT DEFAULT 0)

  - updated_at (TIMESTAMP DEFAULT NOW())

  CREATE INDEX idx_activity_last_seen ON user_activity(last_seen_at DESC);
```

---

## 📋 4. REQUISITOS FUNCIONAIS POR MÓDULO

### **1. AuthModule**

#### **RF-AUTH-001: Cadastro de usuário**

- **Entrada:** email, password, name, date_of_birth
- **Validações:**
  - Email único
  - Senha mínima 8 caracteres
  - Data de nascimento ≥ 18 anos
- **Saída:** JWT token + user object
- **Endpoint:** `POST /auth/register`

#### **RF-AUTH-002: Login**

- **Entrada:** email, password
- **Saída:** JWT token + user object
- **Endpoint:** `POST /auth/login`

#### **RF-AUTH-003: Refresh token**

- **Endpoint:** `POST /auth/refresh`

#### **RF-AUTH-004: Logout**

- **Endpoint:** `POST /auth/logout`

#### **RF-AUTH-005: Obter usuário atual**

- **Endpoint:** `GET /auth/me`

---

### **2. ProfilesModule**

#### **RF-PROF-001: Visualizar perfil**

- **Endpoint:** `GET /profiles/:userId`
- **Retorna:** Perfil completo (bio, foto, categorias, skills, gêneros, vídeos)

#### **RF-PROF-002: Atualizar bio**

- **Endpoint:** `PATCH /profiles/me/bio`
- **Validação:** Máximo 500 caracteres

#### **RF-PROF-003: Atualizar foto de perfil**

- **Endpoint:** `PATCH /profiles/me/photo`
- **Storage:** Supabase Storage

#### **RF-PROF-004: Visualizar meu perfil**

- **Endpoint:** `GET /profiles/me`

#### **RF-PROF-005: Deletar conta (soft delete)**

- **Endpoint:** `DELETE /profiles/me`
- **Regras:**
  - Marca `is_active = false`
  - Define `deleted_at = NOW()`
  - Matches ficam `status = 'deleted'`
  - Conversas são preservadas (usuário aparece como "[Conta Deletada]")

---

### **3. CategoriesModule**

#### **RF-CAT-001: Listar todas as categorias disponíveis**

- **Endpoint:** `GET /categories`
- **Retorna:** Lista de categorias (Guitarrista, Produtor, Vocalista, etc)

#### **RF-CAT-002: Adicionar categoria ao perfil**

- **Endpoint:** `POST /profiles/me/categories`
- **Entrada:** `{ category_id, years_experience, proficiency_level, is_primary }`
- **Validação:**
  - Apenas 1 categoria pode ser primária
  - `proficiency_level` in ['beginner', 'intermediate', 'advanced', 'expert']

#### **RF-CAT-003: Atualizar categoria**

- **Endpoint:** `PATCH /profiles/me/categories/:categoryId`

#### **RF-CAT-004: Remover categoria**

- **Endpoint:** `DELETE /profiles/me/categories/:categoryId`
- **Regra:** Não pode remover se for a única categoria

#### **RF-CAT-005: Obter categorias do usuário**

- **Endpoint:** `GET /profiles/:userId/categories`

---

### **4. SkillsModule**

#### **RF-SKILL-001: Listar todas as skills disponíveis**

- **Endpoint:** `GET /skills`
- **Query params:** `?category_id=X` (filtro opcional)

#### **RF-SKILL-002: Listar categorias de skills**

- **Endpoint:** `GET /skills/categories`

#### **RF-SKILL-003: Adicionar skill ao perfil**

- **Endpoint:** `POST /profiles/me/skills`
- **Entrada:** `{ skill_id, proficiency_level, years_experience }`

#### **RF-SKILL-004: Atualizar skill**

- **Endpoint:** `PATCH /profiles/me/skills/:skillId`

#### **RF-SKILL-005: Remover skill**

- **Endpoint:** `DELETE /profiles/me/skills/:skillId`

#### **RF-SKILL-006: Obter skills do usuário**

- **Endpoint:** `GET /profiles/:userId/skills`

---

### **5. GenresModule**

#### **RF-GEN-001: Listar todos os gêneros**

- **Endpoint:** `GET /genres`

#### **RF-GEN-002: Adicionar gênero ao perfil**

- **Endpoint:** `POST /profiles/me/genres`
- **Entrada:** `{ genre_id, is_primary }`

#### **RF-GEN-003: Remover gênero**

- **Endpoint:** `DELETE /profiles/me/genres/:genreId`

#### **RF-GEN-004: Obter gêneros do usuário**

- **Endpoint:** `GET /profiles/:userId/genres`

---

### **6. VideosModule**

#### **RF-VID-001: Upload de vídeo**

- **Endpoint:** `POST /videos/upload`
- **Validações:**
  - Máximo 10 vídeos por usuário
  - Duração: 15s - 180s
  - Tamanho: ≤ 500MB (ajustável)
  - Formatos: mp4, mov, webm, avi
- **Processo:**
  1. Upload para Supabase Storage
  2. Gerar thumbnail (opcional V1.5)
  3. Criar registro no banco

#### **RF-VID-002: Listar vídeos do usuário**

- **Endpoint:** `GET /profiles/:userId/videos`

#### **RF-VID-003: Obter vídeo específico**

- **Endpoint:** `GET /videos/:videoId`

#### **RF-VID-004: Atualizar vídeo (título/descrição)**

- **Endpoint:** `PATCH /videos/:videoId`

#### **RF-VID-005: Deletar vídeo**

- **Endpoint:** `DELETE /videos/:videoId`

#### **RF-VID-006: Reordenar vídeos**

- **Endpoint:** `PATCH /videos/reorder`
- **Entrada:** `{ video_ids: [id1, id2, id3...] }`

---

### **7. MatchingModule**

#### **RF-MATCH-001: Feed de descoberta**

- **Endpoint:** `GET /feed`
- **Query params (filtros):**
  - `category_ids` (array)
  - `skill_ids` (array)
  - `genre_ids` (array)
  - `proficiency_level` (beginner/intermediate/advanced/expert)
  - `min_years_experience` (int)
  - `max_years_experience` (int)
- **Algoritmo:**
  1. Buscar usuários não swipados ainda
  2. Remover usuários com swipe 'pass' ativo (is_active = true)
  3. Aplicar filtros selecionados
  4. Priorizar quem deu like (mas randomizar posição nos primeiros 30%)
  5. Para cada usuário, escolher 1 vídeo aleatório
  6. Retornar lista de 20 vídeos
- **Retorno:**

```typescript
{
  videos: [
    {
      video_id,
      user_id,
      name,
      primary_category,
      years_experience,
      proficiency_level,
      genres: [],
      video_url,
      thumbnail_url,
      description,
      has_liked_you: boolean
    }
  ],
  remaining_swipes: number // V2: plano grátis
}
```

#### **RF-MATCH-002: Dar swipe**

- **Endpoint:** `POST /swipes`
- **Entrada:** `{ to_user_id, to_video_id, action: 'like' | 'pass' }`
- **Regras:**
  - Não pode dar swipe em si mesmo
  - Se action = 'pass', define `expires_at = NOW() + 15 days`
  - Se action = 'like', verifica se o outro também curtiu → cria match
- **Retorno:**

```typescript
{
  swipe_id,
  action,
  matched: boolean,
  match_id?: string
}
```

#### **RF-MATCH-003: Listar matches**

- **Endpoint:** `GET /matches`
- **Query:** `SELECT m.* FROM matches m JOIN user_matches um ON m.id = um.match_id WHERE um.user_id = $1`
- **Ordenação:** `last_message_at DESC NULLS LAST`

#### **RF-MATCH-004: Deletar match**

- **Endpoint:** `DELETE /matches/:matchId`
- **Regras:**
  - Match fica `status = 'deleted'`
  - Conversa fica `is_active = false`
  - Histórico de mensagens é preservado

#### **RF-MATCH-005: Ver quem curtiu você**

- **Endpoint:** `GET /likes/received`
- **Regras V1 (plano grátis):**
  - Retorna lista completa de swipes tipo 'like' recebidos
  - Usuários aparecem **borrados** (foto borrada, nome oculto)
  - Mostra apenas: tipo de perfil, anos de experiência
  - Pode desbloquear 2 perfis por dia
- **Retorno:**

```typescript
{
  total_likes: number,
  blurred_profiles: [
    {
      swipe_id,
      category: "Guitarrista",
      years_experience: 5,
      genres: ["Rock", "Blues"],
      is_revealed: boolean
    }
  ],
  reveals_remaining_today: number // V2
}
```

#### **RF-MATCH-006: Desbloquear perfil de quem curtiu (V2)**

- **Endpoint:** `POST /likes/reveal/:swipeId`
- **Regra:** Máximo 2 por dia (plano grátis)

---

### **8. MessagesModule**

#### **RF-MSG-001: Listar conversas**

- **Endpoint:** `GET /conversations`
- **Query:**

```sql
SELECT c.*, m.*
FROM conversations c
JOIN user_matches um ON c.match_id = um.match_id
LEFT JOIN matches m ON c.match_id = m.id
WHERE um.user_id = $1
  AND um.has_deleted_conversation = false
  AND c.is_active = true
ORDER BY m.last_message_at DESC NULLS LAST;
```

#### **RF-MSG-002: Obter mensagens de uma conversa**

- **Endpoint:** `GET /conversations/:matchId/messages`
- **Query params:** `?limit=50&before=<message_id>`
- **Paginação:** Busca 50 mensagens antes do ID fornecido

#### **RF-MSG-003: Enviar mensagem**

- **Endpoint:** `POST /conversations/:matchId/messages`
- **Entrada:**

```typescript
{
  content_type: 'text' | 'image' | 'audio' | 'link',
  content: string,
  metadata?: { filename?, duration?, etc }
}
```

- **Validação:**
  - Só pode enviar se houver match ativo
  - Se for imagem/áudio, fazer upload antes
- **Após envio:** Atualizar `matches.last_message_at = NOW()`

#### **RF-MSG-004: Marcar mensagens como lidas**

- **Endpoint:** `PATCH /conversations/:matchId/read`

#### **RF-MSG-005: Deletar conversa (soft delete)**

- **Endpoint:** `DELETE /conversations/:matchId`
- **Regra:**
  - Marca `user_matches.has_deleted_conversation = true` apenas para o usuário atual
  - Match continua ativo
  - Outro usuário ainda vê as mensagens

#### **RF-MSG-006: WebSocket (real-time)**

- **Eventos:**
  - `message:new` - nova mensagem recebida
  - `message:read` - mensagens foram lidas
  - `typing:start` - outro usuário começou a digitar
  - `typing:stop` - outro usuário parou de digitar

---

## 🎯 5. REGRAS DE NEGÓCIO

### **RN-001: Onboarding obrigatório**

- Usuário deve ter pelo menos 1 categoria antes de acessar o feed

### **RN-002: Limite de vídeos**

- Máximo 10 vídeos por usuário (V1)

### **RN-003: Expiração de swipes negativos**

- Swipes com action = 'pass' expiram após 15 dias
- Coluna `is_active` é computada automaticamente
- Após expiração, usuário volta a aparecer no feed

### **RN-004: Criação de match**

- Match é criado quando user A curte user B E user B curte user A
- Match automático ao segundo like
- Cria registros em `matches` e `user_matches` (2 registros)

### **RN-005: Soft delete de conta**

- Conta deletada: `is_active = false`, `deleted_at = NOW()`
- Matches ficam `status = 'deleted'`
- Mensagens são preservadas (nome aparece como "[Conta Deletada]")

### **RN-006: Bloqueio de usuário (V1.5)**

- Ao bloquear:
  - Match fica `status = 'blocked'`
  - Conversa fica `is_active = false`
  - Registro criado em `blocks`
  - Usuários não aparecem mais no feed um do outro

### **RN-007: Limites diários (V2 - plano grátis)**

- Swipes: 50 por dia (like + pass)
- Revelar perfis de quem curtiu: 2 por dia
- Ao esgotar: bloqueia feed com mensagem para upgrade

### **RN-008: Cleanup automático de daily_limits**

- Trigger deleta automaticamente registros > 30 dias
- Executado após cada INSERT em `daily_limits`

---

## 📤 6. DTOs (Data Transfer Objects)

### **AuthModule**

```typescript
// POST /auth/register
class RegisterDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @MinLength(2)
  name: string;

  @IsDate()
  @MinAge(18) // custom validator
  date_of_birth: Date;
}

// POST /auth/login
class LoginDto {
  @IsEmail()
  email: string;

  password: string;
}
```

### **CategoriesModule**

```typescript
// POST /profiles/me/categories
class AddCategoryDto {
  @IsInt()
  category_id: number;

  @Min(0)
  @Max(100)
  years_experience: number;

  @IsIn(['beginner', 'intermediate', 'advanced', 'expert'])
  proficiency_level: string;

  @IsBoolean()
  is_primary: boolean;
}

// PATCH /profiles/me/categories/:id
class UpdateCategoryDto {
  @IsOptional()
  @Min(0)
  @Max(100)
  years_experience?: number;

  @IsOptional()
  @IsIn(['beginner', 'intermediate', 'advanced', 'expert'])
  proficiency_level?: string;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}
```

### **VideosModule**

```typescript
// POST /videos/upload
class UploadVideoDto {
  @IsFile()
  @MaxFileSize(524288000) // 500MB
  @AllowedMimeTypes(['video/mp4', 'video/webm', 'video/mov'])
  @VideoDuration(15, 180) // 15s - 3min
  file: Express.Multer.File;

  @IsOptional()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @MaxLength(500)
  description?: string;
}

// PATCH /videos/:id
class UpdateVideoDto {
  @IsOptional()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @MaxLength(500)
  description?: string;
}

// PATCH /videos/reorder
class ReorderVideosDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  video_ids: string[];
}
```

### **MatchingModule**

```typescript
// GET /feed
class FeedFiltersDto {
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  category_ids?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  skill_ids?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  genre_ids?: number[];

  @IsOptional()
  @IsIn(['beginner', 'intermediate', 'advanced', 'expert'])
  proficiency_level?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  min_years_experience?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  max_years_experience?: number;
}

// POST /swipes
class SwipeDto {
  @IsUUID()
  to_user_id: string;

  @IsUUID()
  to_video_id: string;

  @IsIn(['like', 'pass'])
  action: 'like' | 'pass';
}
```

### **MessagesModule**

```typescript
// POST /conversations/:matchId/messages
class SendMessageDto {
  @IsIn(['text', 'image', 'audio', 'link'])
  content_type: 'text' | 'image' | 'audio' | 'link';

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsObject()
  metadata?: {
    filename?: string;
    duration?: number;
    file_size?: number;
  };
}
```

---

## 🔐 7. AUTENTICAÇÃO E AUTORIZAÇÃO

### **Guards**

```typescript
// JWT Auth Guard (protege todas as rotas exceto /auth/*)
@UseGuards(JwtAuthGuard)

// Ownership Guard (garante que usuário só edita seus próprios dados)
@UseGuards(OwnershipGuard)
```

### **Decorators customizados**

```typescript
@CurrentUser() user: User // injeta usuário autenticado

@IsOwner('userId') // valida se o userId do param pertence ao user logado
```

---

## 🚀 8. ORDEM DE IMPLEMENTAÇÃO

### **Sprint 1: Base (1-2 semanas)**

1. ✅ Setup projeto NestJS + Prisma
2. ✅ AuthModule (Supabase)
3. ✅ Migrations do banco
4. ✅ ProfilesModule (CRUD básico)

### **Sprint 2: Perfil Musical (1 semana)**

5. ✅ CategoriesModule
6. ✅ SkillsModule
7. ✅ GenresModule
8. ✅ Seed de categorias/skills/gêneros

### **Sprint 3: Vídeos (1 semana)**

9. ✅ VideosModule
10. ✅ Integração Supabase Storage
11. ✅ Validações de upload

### **Sprint 4: Matching (2 semanas)**

12. ✅ MatchingModule
13. ✅ Algoritmo de feed
14. ✅ Sistema de swipes
15. ✅ Lógica de criação de matches

### **Sprint 5: Chat (1-2 semanas)**

16. ✅ MessagesModule
17. ✅ WebSocket setup
18. ✅ CRUD de mensagens
19. ✅ Real-time messaging

### **Sprint 6: Polish (1 semana)**

20. ✅ Testes E2E críticos
21. ✅ Deploy staging
22. ✅ Ajustes finais

---

## 📊 9. ENDPOINTS COMPLETOS

### **AuthModule**

```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me
```

### **ProfilesModule**

```
GET    /profiles/:userId
GET    /profiles/me
PATCH  /profiles/me/bio
PATCH  /profiles/me/photo
DELETE /profiles/me
```

### **CategoriesModule**

```
GET    /categories
GET    /profiles/:userId/categories
POST   /profiles/me/categories
PATCH  /profiles/me/categories/:categoryId
DELETE /profiles/me/categories/:categoryId
```

### **SkillsModule**

```
GET    /skills
GET    /skills/categories
GET    /profiles/:userId/skills
POST   /profiles/me/skills
PATCH  /profiles/me/skills/:skillId
DELETE /profiles/me/skills/:skillId
```

### **GenresModule**

```
GET    /genres
GET    /profiles/:userId/genres
POST   /profiles/me/genres
DELETE /profiles/me/genres/:genreId
```

### **VideosModule**

```
POST   /videos/upload
GET    /profiles/:userId/videos
GET    /videos/:videoId
PATCH  /videos/:videoId
DELETE /videos/:videoId
PATCH  /videos/reorder
```

### **MatchingModule**

```
GET    /feed
POST   /swipes
GET    /matches
DELETE /matches/:matchId
GET    /likes/received
POST   /likes/reveal/:swipeId (V2)
```

### **MessagesModule**

```
GET    /conversations
GET    /conversations/:matchId/messages
POST   /conversations/:matchId/messages
PATCH  /conversations/:matchId/read
DELETE /conversations/:matchId
```

---

## 🎯 10. MUDANÇAS PRINCIPAIS DA REVISÃO

### **✅ Problemas Corrigidos:**

1. **Matches agora é many-to-many**
   - Antes: `user_id_1 < user_id_2` (confuso)
   - Agora: `matches` + `user_matches` (limpo)
   - Query: `JOIN user_matches WHERE user_id = $1`

2. **Conversas mantêm histórico**
   - Antes: `ON DELETE CASCADE` (perdia histórico)
   - Agora: `ON DELETE SET NULL` + `is_active` (preserva mensagens)

3. **Soft delete em conversas simplificado**
   - Antes: `deleted_by_user_1/user_2` (confuso)
   - Agora: `user_matches.has_deleted_conversation` (por usuário)

4. **Swipes com expiração otimizada**
   - Adicionado: coluna computada `is_active`
   - Índice parcial para performance

5. **Cleanup automático**
   - `daily_limits` deleta registros > 30 dias automaticamente
   - Trigger após INSERT

6. **Índices compostos adicionados**
   - `messages(conversation_id, created_at DESC)` para queries de chat

---

## 🗄️ 11. CONFIGURAÇÕES IMPORTANTES

| Configuração            | Valor          | Observação                  |
| ----------------------- | -------------- | --------------------------- |
| Limite de bio           | 500 caracteres | Enforced via CHECK          |
| Limite de vídeos        | 10 por usuário | Enforced via aplicação      |
| Duração de vídeo        | 15s - 3min     | Enforced via CHECK          |
| Tamanho máximo          | 500MB          | Enforced via CHECK          |
| Idade mínima            | 18 anos        | Validação no DTO            |
| Expiração de passes     | 15 dias        | Automático via `expires_at` |
| Cleanup de daily_limits | 30 dias        | Automático via trigger      |

---

## 🔮 12. PREPARAÇÃO PARA V2

### **Sistema de Planos (já preparado):**

- ✅ `daily_limits` - controle de limites
- ✅ `profiles.accept_messages_from_non_matches` - feature premium
- ✅ Estrutura flexível para adicionar tabelas:
  - `subscription_plans`
  - `user_subscriptions`
  - `payment_transactions`

### **Funcionalidades Futuras:**

- Sistema de pagamentos (Stripe)
- Notificações push
- Sistema de localização
- Serviços oferecidos
- Super Likes
- Analytics avançado

---

**Documento gerado em:** 2024  
**Versão:** 1.1 (Revisado)  
**Status:** Pronto para implementação  
**Última revisão:** Schema otimizado para escalabilidade
