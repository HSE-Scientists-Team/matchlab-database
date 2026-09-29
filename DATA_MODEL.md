# Модель данных MatchLab

Короткий справочник по таблицам и правилам хранения. Имена таблиц и полей совпадают с DBML. Таблицы аккаунтов и подтверждения адресов принадлежат схеме `users`. Письма отправляются синхронно и не хранятся в БД.


## Сущности

| Таблица | Что хранит |
| --- | --- |
| `user_account` | Учётную запись и уникальный логин. Пароль хранится только как хеш; email вынесен в отдельные таблицы. |
| `user_email` | Подтверждённый email аккаунта. Email хранится в нормализованном нижнем регистре; адрес может быть только у одного аккаунта. |
| `email_verification_request` | Ожидающий подтверждения email и хеш одноразового токена. У одного аккаунта одна активная заявка; один адрес может быть заявлен разными аккаунтами. |
| `trusted_email_domain` | Разрешённые домены организаций для регистрации. |
| `user_profile` | Короткое описание и контактные данные в JSONB. Строка создаётся для каждого пользователя. |
| `profile_skill` | Навыки пользователя в виде отдельных строк для поиска. |
| `profile_interest` | Интересы пользователя в виде отдельных строк для поиска. |
| `profile_credential` | Образование и сертификаты с файлами-доказательствами и статусом проверки. |
| `user_privacy_settings` | Переключатели видимости проектов с участием пользователя и контактов. Одна строка на пользователя. |
| `user_block` | Кто кого заблокировал. Пара блокирующий/заблокированный уникальна. |
| `portfolio_item` | Одну работу в портфолио, ссылку и файл-доказательство, а также состояние проверки. |
| `project` | Проект, его владелец, описание, сроки, жизненный цикл и результат модерации. |
| `project_position` | Роль в проекте: описание, число мест и дополнительные требования в JSONB. |
| `project_position_skill` | Навыки, нужные для роли, в виде отдельных строк для поиска. |
| `project_tag` | Теги проекта в виде отдельных строк для поиска. |
| `project_member` | Участие пользователя в проекте и назначенная роль. |
| `project_join_request` | Отклик кандидата или приглашение в конкретную роль; хранит решение и участников действия. |
| `support_ticket` | Обращение, жалобу или задачу модерации, её адресата, исполнителя и результат. |
| `support_ticket_attachment` | Файлы, приложенные к обращению или жалобе. Сам файл хранится в объектном хранилище, в БД — ссылка и метаданные. |
| `chat_conversation` | Диалог. Может быть привязан к отклику/приглашению или обращению в поддержку; без такой ссылки — обычный диалог пользователей. |
| `chat_participant` | Участники диалога, время последнего прочтения и архивирования для каждого участника отдельно. |
| `message` | Сообщение в диалоге, автор, текст, вложения и отметки редактирования/удаления. |
| `notification` | Уведомление пользователя, его тип, данные и время прочтения. |
| `review` | Оценку проекта или пользователя после совместной работы. |


## Связи
- У пользователя одна запись профиля и одна запись настроек приватности. У аккаунта может быть один подтверждённый email и одна ожидающая заявка.
- Несколько аккаунтов могут запросить один email. Подтверждённый адрес уникален: первый успешный токен закрепляет адрес за своим аккаунтом; остальные попытки получают конфликт. Токен связан с аккаунтом, хеш хранится в `email_verification_request`.
- Пользователь может создать много проектов. У проекта есть роли (`project_position`), теги (`project_tag`), участники (`project_member`) и заявки/приглашения (`project_join_request`). У ролей есть навыки через `project_position_skill`.
- Заявка относится к одной роли и хранит кандидата и инициатора. На пару «роль + кандидат» создаётся одна запись; повторный отклик или приглашение обновляет её статус и тип. После принятия участник команды записывается в `project_member`.
- Диалог имеет участников через `chat_participant` и содержит сообщения через `message`. Заявка или тикет может иметь не более одного привязанного диалога. У диалога может быть не больше одного такого контекста одновременно.
- Тикет принадлежит автору, может иметь назначенного сотрудника и цель (пользователя или проект), а файлы вынесены в `support_ticket_attachment`.
- Отзыв относится к проекту и автору. Для отзыва о человеке заполнен `target_user_id`; для отзыва о проекте он пуст.
- Внешние ключи сейчас используют `ON DELETE NO ACTION`: связанные записи нельзя случайно удалить каскадом. Удаление аккаунта должно проходить через предусмотренный статус `deleted` и отдельную процедуру обезличивания.


## Статусы и типы
- `user_account.status`: `active`, `blocked`, `deleted`. Email-статус не хранится в этом поле: он определяется по `user_email` и `email_verification_request`.
- `project.status`: `draft`, `pending_moderation`, `recruiting`, `active`, `completed`, `cancelled`, `rejected`, `hidden`.
- `project_join_request.status`: `pending`, `accepted`, `rejected`, `cancelled`; `type` — `application` или `invitation`.
- `project_member.status`: `active`, `left`, `removed`.
- `portfolio_item.status` и `profile_credential.status`: `draft`, `pending_review`, `verified`, `rejected`.
- `support_ticket.status`: `open`, `in_progress`, `waiting_for_user`, `resolved`, `closed`.


## Все внешние ключи
Каждый внешний ключ в модели перечислен ниже. `NO ACTION` означает, что БД не удалит связанные записи автоматически.

| Поле | Ссылается на |
| --- | --- |
| `user_privacy_settings.user_id` | `user_account.id` |
| `user_block.blocker_user_id` | `user_account.id` |
| `user_block.blocked_user_id` | `user_account.id` |
| `profile_credential.user_id` | `user_account.id` |
| `profile_credential.moderated_by_user_id` | `user_account.id` |
| `portfolio_item.user_id` | `user_account.id` |
| `portfolio_item.moderated_by_user_id` | `user_account.id` |
| `chat_conversation.created_by_user_id` | `user_account.id` |
| `chat_conversation.join_request_id` | `project_join_request.id` |
| `chat_conversation.support_ticket_id` | `support_ticket.id` |
| `chat_participant.conversation_id` | `chat_conversation.id` |
| `chat_participant.user_id` | `user_account.id` |
| `support_ticket_attachment.support_ticket_id` | `support_ticket.id` |
| `message.conversation_id` | `chat_conversation.id` |
| `user_account.status_changed_by_user_id` | `user_account.id` |
| `user_email.user_id` | `user_account.id` |
| `email_verification_request.user_id` | `user_account.id` |
| `user_profile.user_id` | `user_account.id` |
| `project_tag.project_id` | `project.id` |
| `project_position_skill.project_position_id` | `project_position.id` |
| `profile_skill.user_id` | `user_account.id` |
| `profile_interest.user_id` | `user_account.id` |
| `project.owner_user_id` | `user_account.id` |
| `project.moderated_by_user_id` | `user_account.id` |
| `project_position.project_id` | `project.id` |
| `project_member.project_id` | `project.id` |
| `project_member.user_id` | `user_account.id` |
| `project_member.project_position_id` | `project_position.id` |
| `project_join_request.project_position_id` | `project_position.id` |
| `project_join_request.candidate_user_id` | `user_account.id` |
| `project_join_request.initiated_by_user_id` | `user_account.id` |
| `project_join_request.responded_by_user_id` | `user_account.id` |
| `support_ticket.author_user_id` | `user_account.id` |
| `support_ticket.assigned_user_id` | `user_account.id` |
| `support_ticket.target_user_id` | `user_account.id` |
| `support_ticket.target_project_id` | `project.id` |
| `message.sender_user_id` | `user_account.id` |
| `notification.user_id` | `user_account.id` |
| `review.project_id` | `project.id` |
| `review.author_user_id` | `user_account.id` |
| `review.target_user_id` | `user_account.id` |


## JSONB: правила и форма данных
JSONB используем для небольших изменяемых наборов полей, форма которых может развиваться. Основные поля для фильтрации, сортировки, связей, прав доступа и модерации должны оставаться обычными колонками или отдельными таблицами. Файлы в JSONB не кладём — сохраняем ссылку на объектное хранилище.
- `user_profile.data`, например `{"about":"Ищу команду для проекта","contacts":{"email":"me@example.com","telegram":"@me"}}`: короткое описание и контакты. Образование и сертификаты хранятся в `profile_credential`, чтобы для каждой записи хранить статус проверки и файл-доказательство. Видимость контактов задаёт `user_privacy_settings.show_contacts`. Навыки и интересы вынесены в `profile_skill` и `profile_interest`, потому что по ним ищут людей. Работы портфолио хранятся в `portfolio_item`, не в этом JSON.
- `project.data`, например `{"problem":"...","goal":"..."}`: описание проблемы и цели. Тип (`scientific` или `practical`) и сфера находятся в колонках, теги — в `project_tag`, потому что интерфейс фильтрует проекты по ним.
- `project_position.data`, например `{"requirements":["Опыт с Python","2 часа в неделю"]}`: дополнительные требования к роли. Навыки вынесены в `project_position_skill`, число мест и открытость роли — отдельные поля.
- `message.attachments`: список объектов вида `{"url":"...","name":"...","content_type":"..."}`. Файлы размещаются в объектном хранилище.
- `notification.data`: небольшой объект контекста уведомления, например `{"project_id":"...","request_id":"..."}`. Получатель, тип и прочитано ли уведомление — отдельные поля.
Версия формата профиля хранится в `user_profile.schema_version`. При изменении формата `project.data` и `project_position.data` поддерживайте совместимость в коде сервиса. Проверяйте JSON при записи. Не помещайте туда секреты, значения для поиска, дублирующие статусы, счётчики мест или большие списки вложений.


## Важные ограничения и поведение
DrawDB DBML не принимает SQL `CHECK`, поэтому правила ниже нужно проверять в сервисе. При добавлении миграций их также следует закрепить `CHECK`-ограничениями в PostgreSQL, где это возможно.
- `project.type` принимает `scientific` или `practical`; `portfolio_item.type` — `scientific` или `project`.
- `user_block` не позволяет создать повторную блокировку одной и той же пары. Нельзя блокировать самого себя; проверяйте это при обработке запроса и добавьте SQL `CHECK` в миграцию.
- `portfolio_item.status` проходит путь `draft → pending_review → verified/rejected`. Ссылка на файл — URL/ключ объекта, не содержимое файла.
- `project_position.slots_count` должно быть больше нуля; сервис проверяет значение, миграция должна добавить SQL `CHECK`. Нельзя принять больше активных участников, чем мест; проверка и создание участника выполняются в одной транзакции.
- На пару «роль + кандидат» есть уникальное ограничение, поэтому повторный отклик или приглашение обновляет существующую заявку. При принятии заявки атомарно создавайте `project_member` и закрывайте другие ожидающие заявки того же кандидата на роль.
- Для сообщения автор должен быть участником диалога. Этот инвариант проверяется сервисом при отправке.
- `review.rating` — целое от 1 до 5; проверка выполняется сервисом и должна быть закреплена SQL `CHECK`. Отзывы разрешены после завершения проекта; сервис должен запрещать повторную оценку одной цели по одному проекту.
- `review.target_type=user` требует `target_user_id`; `review.target_type=project` требует пустой `target_user_id`. Проверяйте согласованность в сервисе и добавьте SQL `CHECK` в миграцию.
- Тикет может ссылаться максимум на одну цель: пользователя или проект; проверяйте это в сервисе и добавьте SQL `CHECK` в миграцию. Жалоба требует описания и адресата; это проверяется при создании.
- Настройки приватности применяются при выдаче API-ответа: наличие контакта в профиле само по себе не означает, что его можно показывать.


## Как менять модель
1. Сначала обновите `schema/matchlab.dbml`.
2. Синхронизируйте ER-диаграмму в `README.md`.
3. Обновите этот документ, если поменялись сущности, связи или формат JSONB.
4. Изменения в рабочей БД оформляйте отдельными миграциями в репозитории соответствующего сервиса.
