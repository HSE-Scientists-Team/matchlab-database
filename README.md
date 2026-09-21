# MatchLab Database

Репозиторий содержит актуальную модель данных проекта MatchLab.

## ER-диаграмма

```mermaid
erDiagram
	user_account }o--|| user_account : references
	user_profile ||--|| user_account : references
	project }o--|| user_account : references
	project }o--|| user_account : references
	project_position }o--|| project : references
	project_member }o--|| project : references
	project_member }o--|| user_account : references
	project_member }o--|| project_position : references
	project_join_request }o--|| project_position : references
	project_join_request }o--|| user_account : references
	project_join_request }o--|| user_account : references
	project_join_request }o--|| user_account : references
	support_ticket }o--|| user_account : references
	support_ticket }o--|| user_account : references
	support_ticket }o--|| user_account : references
	support_ticket }o--|| project : references
	message }o--|| user_account : references
	message }o--|| project_join_request : references
	message }o--|| support_ticket : references
	notification }o--|| user_account : references
	review }o--|| project : references
	review }o--|| user_account : references
	review }o--|| user_account : references

	user_account {
		UUID id
		VARCHAR(320) email
		VARCHAR(255) email_domain
		VARCHAR(255) password_hash
		SYSTEM_ROLE_CODE role
		USER_ACCOUNT_STATUS status
		TIMESTAMPTZ email_verified_at
		VARCHAR(64) email_verification_token_hash
		TIMESTAMPTZ email_verification_expires_at
		UUID status_changed_by_user_id
		TIMESTAMPTZ status_changed_at
		TEXT status_comment
		TIMESTAMPTZ last_login_at
		TIMESTAMPTZ created_at
		TIMESTAMPTZ updated_at
	}

	trusted_email_domain {
		UUID id
		VARCHAR(255) domain
		VARCHAR(255) organization_name
		BOOLEAN is_active
		TIMESTAMPTZ created_at
		TIMESTAMPTZ updated_at
	}

	user_profile {
		UUID user_id
		INTEGER schema_version
		JSONB data
		TIMESTAMPTZ created_at
		TIMESTAMPTZ updated_at
	}

	project {
		UUID id
		UUID owner_user_id
		VARCHAR(255) title
		TEXT summary
		JSONB data
		PROJECT_STATUS status
		DATE planned_start_date
		DATE planned_end_date
		TIMESTAMPTZ started_at
		TIMESTAMPTZ completed_at
		TIMESTAMPTZ published_at
		UUID moderated_by_user_id
		TIMESTAMPTZ moderated_at
		TEXT moderation_comment
		TIMESTAMPTZ created_at
		TIMESTAMPTZ updated_at
	}

	project_position {
		UUID id
		UUID project_id
		VARCHAR(255) title
		TEXT description
		INTEGER slots_count
		BOOLEAN is_open
		JSONB data
		TIMESTAMPTZ created_at
		TIMESTAMPTZ updated_at
	}

	project_member {
		UUID id
		UUID project_id
		UUID user_id
		UUID project_position_id
		PROJECT_MEMBER_STATUS status
		TIMESTAMPTZ joined_at
		TIMESTAMPTZ left_at
	}

	project_join_request {
		UUID id
		UUID project_position_id
		UUID candidate_user_id
		JOIN_REQUEST_TYPE type
		JOIN_REQUEST_STATUS status
		UUID initiated_by_user_id
		TEXT message
		UUID responded_by_user_id
		TIMESTAMPTZ responded_at
		TIMESTAMPTZ created_at
		TIMESTAMPTZ updated_at
	}

	support_ticket {
		UUID id
		UUID author_user_id
		UUID assigned_user_id
		SUPPORT_TICKET_TYPE type
		SUPPORT_TICKET_STATUS status
		SUPPORT_TICKET_SOURCE source
		VARCHAR(255) subject
		TEXT description
		UUID target_user_id
		UUID target_project_id
		TEXT resolution
		INTEGER feedback_rating
		TEXT feedback_comment
		TIMESTAMPTZ created_at
		TIMESTAMPTZ updated_at
		TIMESTAMPTZ resolved_at
		TIMESTAMPTZ closed_at
	}

	message {
		UUID id
		UUID sender_user_id
		UUID join_request_id
		UUID support_ticket_id
		TEXT body
		JSONB attachments
		TIMESTAMPTZ created_at
		TIMESTAMPTZ edited_at
		TIMESTAMPTZ deleted_at
	}

	notification {
		UUID id
		UUID user_id
		VARCHAR(100) type
		JSONB data
		TIMESTAMPTZ created_at
		TIMESTAMPTZ read_at
	}

	review {
		UUID id
		UUID project_id
		UUID author_user_id
		REVIEW_TARGET_TYPE target_type
		UUID target_user_id
		INTEGER rating
		TEXT comment
		TIMESTAMPTZ created_at
		TIMESTAMPTZ updated_at
	}
```

## Содержимое

- `schema/matchlab.dbml` — основной источник истины
- `schema/matchlab.drawdb.json` — визуальное представление схемы для drawDB

## Принцип работы

Схема проектируется визуально в drawDB или редактируется напрямую в DBML.

Алгоритм внесения изменений:
1) загружаем `schema/matchlab.drawdb.json` в [DrawDB](https://www.drawdb.app/editor)
2) вносим необходимые изменения
3) экспортируем DBML и JSON в директорию `schema` и заменяем прежнюю версию
4) экспортируем Mermaid схему и кладем в этот readme
5) пушим изменения в мастер
