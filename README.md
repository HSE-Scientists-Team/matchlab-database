# MatchLab Database

Репозиторий содержит актуальную модель данных проекта MatchLab. Email обязателен при регистрации и служит единственным идентификатором входа. В `user_account` хранится уникальный нормализованный email; `user_email` фиксирует его подтверждение, а независимая `registration_request` хранит email, хеш пароля и хеш одноразового токена до создания аккаунта. Регистрация сразу отправляет письмо; повтор заменяет пароль и токен заявки. Аккаунт создаётся только при подтверждении актуальной ссылки, поэтому чужая незавершённая заявка не занимает email. Существующие аккаунты регистрация не меняет. Письма отправляются синхронно и не сохраняются в модели данных.

Служебные аккаунты администраторов и модераторов изолированы в схеме `admin`; их сеансы, пароли и регистрация не связаны с публичными профилями. Операции над жалобами, достижениями, доменами и проектами выполняют сервисы — владельцы данных с атомарной историей решений.

## ER-диаграмма

```mermaid
erDiagram
  chat_message }o--|| chat_conversation : chat_message_conversation
  support_support_ticket_attachment }o--|| support_support_ticket : support_ticket_attachment_ticket
  users_user_account }o--o| users_user_account : user_account_status_changed_by
  users_user_email |o--|| users_user_account : user_email_account
  public_notification }o--|| users_user_account : notification_user
  media_multipart_upload |o--|| media_file : file_id
  users_user_profile |o--|| users_user_account : user_id
  users_achievement }o--|| users_user_account : user_id
  users_achievement_decision }o--|| users_achievement : achievement_id
  users_achievement_decision }o--o| users_user_account : reviewer_user_id
  users_user_block }o--|| users_user_account : blocker_user_id
  users_user_block }o--|| users_user_account : blocked_user_id
  users_project_context }o--|| users_user_account : initiator_user_id
  users_project_context_member }o--|| users_project_context : project_id
  users_project_context_member }o--|| users_user_account : user_id
  users_profile_review }o--|| users_project_context : project_id
  users_profile_review }o--|| users_user_account : author_user_id
  users_profile_review }o--|| users_user_account : target_user_id
  users_profile_review }o--|| users_project_context_member : project_id_author_user_id
  users_profile_review }o--|| users_project_context_member : project_id_target_user_id
  projects_role }o--|| projects_project : project_id
  projects_member }o--|| projects_project : project_id
  projects_member }o--o| projects_role : project_id_role_id
  projects_join_request }o--|| projects_project : project_id
  projects_join_request }o--|| projects_role : project_id_role_id
  projects_moderation }o--|| projects_project : project_id
  projects_context_outbox }o--|| projects_project : project_id
  admin_account }o--o| admin_account : created_by_admin_id
  admin_session }o--|| admin_account : admin_id
  admin_audit_event }o--o| admin_account : actor_admin_id
  support_ticket_event }o--|| support_support_ticket : ticket_id
  public_notification {
    uuid id PK
    uuid user_id FK
    varchar(100) type
    jsonb data
    timestamptz created_at
    timestamptz read_at
  }
  support_support_ticket {
    uuid id PK
    uuid author_user_id
    uuid assigned_user_id
    uuid assigned_admin_id
    integer revision
    text resolution_comment
    support_ticket_status status
    varchar(255) subject
    text description
    uuid target_user_id
    uuid target_project_id
    timestamptz created_at
    timestamptz updated_at
    timestamptz resolved_at
  }
  support_support_ticket_attachment {
    uuid id PK
    uuid support_ticket_id FK
    uuid file_id
  }
  support_ticket_event {
    uuid id PK
    uuid ticket_id FK
    uuid actor_admin_id
    text action
    text comment
    text previous_status
    text status
    integer revision
    uuid previous_assigned_admin_id
    uuid assigned_admin_id
    timestamptz created_at
  }
  media_file {
    uuid id PK
    uuid owner_user_id
    boolean is_public
    varchar(63) bucket_name
    text object_key
    varchar(255) original_name
    varchar(255) content_type
    bigint size_bytes
    bigint expected_size_bytes
    text etag
    char(64) checksum_sha256
    file_status status
    timestamptz created_at
    timestamptz updated_at
    timestamptz uploaded_at
    timestamptz deleted_at
  }
  media_multipart_upload {
    uuid file_id PK, FK
    text s3_upload_id
    bigint expected_size_bytes
    bigint part_size_bytes
    text status
    jsonb completion_manifest
    timestamptz created_at
    timestamptz updated_at
    timestamptz expires_at
  }
  users_user_account {
    uuid id PK
    varchar(320) email UK
    varchar(255) password_hash
    system_role_code role
    user_account_status status
    integer revision
    uuid status_changed_by_admin_id
    uuid status_changed_by_user_id FK
    timestamptz status_changed_at
    text status_comment
    timestamptz last_login_at
    timestamptz created_at
    timestamptz updated_at
  }
  users_user_email {
    uuid user_id PK, FK
    varchar(320) email FK, UK
    timestamptz verified_at
  }
  users_registration_request {
    varchar(320) email PK
    varchar(255) password_hash
    char(64) token_hash UK
    timestamptz expires_at
    timestamptz created_at
  }
  users_trusted_email_domain {
    uuid id PK
    varchar(255) domain UK
    varchar(255) organization_name
    boolean is_active
    integer revision
    timestamptz created_at
    timestamptz updated_at
  }
  users_user_profile {
    uuid user_id PK, FK
    jsonb data
    boolean show_contacts
    boolean show_participating_projects
    timestamptz updated_at
  }
  users_achievement {
    uuid id PK
    uuid user_id FK
    text kind
    jsonb data
    uuid evidence_file_id
    text status
    integer revision
    text moderation_comment
    timestamptz submitted_at
    timestamptz deleted_at
    timestamptz created_at
    timestamptz updated_at
  }
  users_achievement_decision {
    uuid id PK
    uuid achievement_id FK
    integer revision
    uuid reviewer_user_id FK
    uuid reviewer_admin_id
    boolean approved
    jsonb reviewed_data
    uuid evidence_file_id
    text comment
    timestamptz created_at
  }
  users_user_block {
    uuid blocker_user_id PK, FK
    uuid blocked_user_id PK, FK
    timestamptz created_at
  }
  users_project_context {
    bigint source_revision
    text state
    uuid project_id PK
    varchar(255) title
    uuid initiator_user_id FK
    timestamptz completed_at
  }
  users_project_context_member {
    uuid project_id PK, FK
    uuid user_id PK, FK
  }
  users_profile_review {
    uuid id PK
    uuid project_id FK
    uuid author_user_id FK
    uuid target_user_id FK
    varchar(255) title
    text text
    integer rating
    timestamptz created_at
  }
  users_admin_event {
    uuid id PK
    uuid actor_admin_id
    text action
    uuid resource_id
    text comment
    text previous_status
    text status
    integer revision
    timestamptz created_at
  }
  chat_conversation {
    uuid id PK
    uuid user_low_id
    uuid user_high_id
    bigint last_message_seq
    bigint user_low_last_read_seq
    bigint user_high_last_read_seq
    timestamptz created_at
    timestamptz last_message_at
  }
  chat_message {
    uuid id PK
    uuid conversation_id FK
    bigint seq
    uuid sender_user_id
    uuid client_message_id
    text body
    timestamptz created_at
  }
  projects_project {
    uuid id PK
    uuid owner_user_id
    jsonb data
    text status
    boolean moderation_hidden
    integer revision
    timestamptz created_at
    timestamptz completed_at
    timestamptz updated_at
  }
  projects_role {
    uuid id PK
    uuid project_id FK
    varchar(255) title
    text description
    jsonb skills
    timestamptz deleted_at
    integer slots
  }
  projects_member {
    uuid project_id PK, FK
    uuid user_id PK
    uuid role_id FK
    text status
  }
  projects_join_request {
    uuid id PK
    uuid project_id FK
    uuid role_id FK
    uuid candidate_user_id
    text type
    text status
    text message
    timestamptz created_at
  }
  projects_moderation {
    bigint id PK
    uuid project_id FK
    uuid actor_user_id
    uuid actor_admin_id
    boolean hidden
    text reason
    timestamptz created_at
  }
  projects_context_outbox {
    uuid project_id PK, FK
    integer revision PK
    jsonb payload
    timestamptz created_at
    timestamptz delivered_at
  }
  admin_account {
    uuid id PK
    varchar(320) email UK
    varchar(120) display_name
    varchar(255) password_hash
    text role
    boolean active
    integer revision
    integer session_version
    uuid created_by_admin_id FK
    timestamptz last_login_at
    timestamptz created_at
    timestamptz updated_at
  }
  admin_session {
    char(64) token_hash PK
    uuid admin_id FK
    integer session_version
    timestamptz expires_at
    timestamptz created_at
  }
  admin_login_throttle {
    char(64) key_hash PK
    integer failures
    timestamptz window_started_at
  }
  admin_audit_event {
    uuid id PK
    uuid actor_admin_id FK
    text action
    text resource_id
    text comment
    text result
    timestamptz created_at
    timestamptz completed_at
  }
```

Диаграмма генерируется из DBML командой `npm run generate`. Имена сущностей имеют префикс схемы: `users_user_profile` — это `users.user_profile`, `chat_conversation` — `chat.conversation`, `media_file` — `media.file`, `support_support_ticket` — `support.support_ticket`. Составные ключи и связи описаны точно в DBML; значок UK у атрибута означает уникальность одного поля, а не участие в составном уникальном индексе.

Для Media уникальна пара `(bucket_name, object_key)`, а не ключ отдельно. `owner_user_id` не имеет FK на User: идентификатор передаётся через проверенный сеанс Gateway. В Support поля пользователей, проекта и файла также являются межсервисными идентификаторами без FK; внешний ключ есть только от вложения к тикету.

## Содержимое

- `schema/matchlab.dbml` — основной источник истины
- `DATA_MODEL.md` — понятное описание сущностей, связей, ограничений и JSONB

## Принцип работы

Схема поддерживается только в DBML.

Алгоритм внесения изменений:

1. Установить зависимости: `npm ci --ignore-scripts`.
2. Обновить `schema/matchlab.dbml` и `DATA_MODEL.md`.
3. Выполнить `npm run generate` для обновления диаграммы README.
4. Выполнить `npm run check`: проверяются DBML, экспорт PostgreSQL, синхронизация README и парсинг Mermaid.
5. Запушить изменения в отдельную ветку и создать PR. Перед слиянием убедиться, что CI `Validate database schema / schema` прошёл для последнего коммита.

Mermaid-блок не редактируется вручную. Зависимости и их версии закреплены в package-lock.json.

Профили KAN-38 соответствуют миграции 00005 backend: достижения, аудит, блокировки, приватность, контексты проектов и отзывы. Подробнее — [DATA_MODEL.md](DATA_MODEL.md).

Проекты KAN-39 принадлежат схеме `projects`; User хранит только версионированную проекцию команды для контактов и отзывов. Search/Recommendation используют API владельцев и не имеют бизнес-таблиц.

Личные чаты KAN-37 соответствуют миграции backend `00008`: `chat.conversation` и
`chat.message`. Только обычный текст, без вложений, редактирования и удаления.
Уникальная пара пользователей, последовательные номера, отметки прочтения и ID отправки
вместо прежних трёх таблиц в public. Межсервисных FK к User нет; внутренний FK связывает
сообщение с диалогом. Ограничения и транзакционные правила — в [DATA_MODEL.md](DATA_MODEL.md).
