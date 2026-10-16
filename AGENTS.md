# MatchLab Database

DBML в schema/matchlab.dbml — источник истины. Исполняемые миграции находятся в backend.

После изменения схемы запускайте `npm ci --ignore-scripts`, затем `npm run generate` и коммитьте обновлённую Mermaid-диаграмму README.md. Не редактируйте её вручную. Синхронизируйте DATA_MODEL.md с изменёнными сущностями.

Перед каждым push и merge обязательно запускайте `npm run check`: он проверяет DBML, экспорт PostgreSQL, соответствие диаграммы DBML и синтаксис всех Mermaid-блоков в Markdown. Перед merge также проверяйте успешный CI `Validate database schema / schema` для последнего коммита. Если проверка не прошла, исправьте ошибку до слияния. Не сливайте PR без разрешения пользователя.

Не коммитьте node_modules, локальные настройки IDE, dbml-error.log или секреты.
