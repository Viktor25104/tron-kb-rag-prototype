# TRON KB → RAG → AI Agent: прототип

Кликабельный прототип двух узлов SEO/AI-платформы для проекта `tron-pool-energy`: Knowledge Base (хранение и структура контента) и RAG (поиск и сборка контекста для агента). Данные фейковые, эмбеддинги, реранкер и LLM замоканы, внешних API нет. Пайплайн реализован один раз, на Python. Фронтенд в статическом режиме показывает его заранее посчитанные прогоны.

Решения, границы узлов и спорные моменты описаны в [docs/architecture.md](docs/architecture.md).

**Деплой:** https://viktor25104.github.io/tron-kb-rag-prototype/ — статическая сборка в memory-режиме, бэкенд не нужен.

## Запуск

Требования: Python 3.12+, [uv](https://docs.astral.sh/uv/), Node.js 22, Docker (опционально).

```bash
# всё в Docker: backend на :8000, frontend (dev, http-режим) на :5173
docker compose up

# или локально
make install
make dev            # uvicorn --reload на :8000 + vite на :5173 в http-режиме
```

- UI: http://localhost:5173
- OpenAPI: http://localhost:8000/docs
- Health: http://localhost:8000/api/v1/health

Только фронтенд, без бэкенда:

```bash
cd frontend && npm ci && npm run dev    # VITE_API_MODE по умолчанию memory
```

## Режимы фронтенда

| `VITE_API_MODE` | Клиент | Откуда данные |
|---|---|---|
| `memory` (по умолчанию, деплой) | `InMemoryApiClient` | `frontend/public/fixtures/api.json` и `traces.json` |
| `http` | `HttpApiClient` | FastAPI по `VITE_API_URL` (по умолчанию `http://localhost:8000/api/v1`) |

Выбор клиента происходит в одном месте: `frontend/src/shared/api/createApiClient.ts`. Текущий режим виден бейджем в шапке.

Оба JSON генерирует бэкенд из `fixtures/` командой `make export-fixtures` (`backend/scripts/export_traces.py`):

- `api.json` содержит снапшот read-моделей: список статей, детали, задачи процессинга, очередь, опции фильтров. In-memory-клиент делает по нему только выборки и простую фильтрацию списка, логика сборки на TypeScript не дублируется.
- `traces.json` содержит полные ответы `POST /rag/query` для четырёх canned-запросов из `fixtures/queries.json`. Скрипт падает, если уровень confidence не совпал с ожидаемым в `queries.json`, поэтому правка фикстур или весов не может незаметно сломать демо.

### Как in-memory-клиент отвечает на произвольный запрос

Честно: он не выполняет пайплайн. Он ищет canned-запрос, у которого совпадают фильтры и `top_k`, а текст похож на введённый (коэффициент Жаккара по токенам ≥ 0.5, без учёта регистра, дефисов и множественного числа). Если такой нашёлся, отдаётся его сохранённый прогон. Если нет, отдаётся LOW-ответ с сообщением, что в memory-режиме доступны только заранее посчитанные прогоны. Поэтому в деплое смена фильтров у canned-запроса тоже даёт этот ответ. Для произвольных запросов и фильтров нужен `http`-режим.

## Canned-запросы

| # | Запрос | Фильтры | Результат |
|---|---|---|---|
| 1 | How can I reduce USDT TRC-20 transaction fees? | нет | HIGH 0.86, ответ агента с цитатами; 1 из 4 фактов не проверен |
| 2 | What will Energy rental cost in 2027? | нет | LOW, помечено «blocked»: формула даёт 0.62, но данных за 2027 нет; факты о цене аренды конфликтуют |
| 3 | How does multisig affect transaction fees? | нет | MEDIUM 0.64: один источник, CONFLICTING-факт, ответ с оговоркой |
| 4 | запрос 1 | `language = TR` | LOW 0.00: corpus after filters: 0 processed chunks |

Экран Low Confidence открывается для запросов 2 и 4 по цепочке RAG Search → Build context → Answer.

## Что замокано

- **Хранилище**: in-memory репозитории, которые при старте загружают `fixtures/*.json` через `FixtureLoader`.
- **Векторный поиск** (`MockVectorSearch`): доля токенов запроса, совпавших с `semantic_tags` чанка, плюс косинус по TF-векторам текста. Детерминированно, без моделей.
- **Полнотекстовый поиск** (`Bm25FullTextSearch`): настоящий BM25 из `rank-bm25` по отфильтрованному корпусу. IDF взят в варианте Lucene, потому что у Okapi он обнуляется для терминов, встречающихся в половине документов, а на маленьком корпусе после префильтра это частый случай.
- **Реранкер** (`MockReranker`): `(0.6 · fused_score_norm + 0.3 · entity_overlap + 0.1 · source.reliability)⁴`, порог отсечения 0.24. Возведение в степень монотонно, порядок кандидатов не меняется: оно только разводит верх шкалы, где взвешенная сумма у всех кандидатов из обоих поисков близка к 1.
- **Агент** (`TemplateAgent`): собирает ответ из проверенных фактов и первых предложений чанков с маркерами `[1]…[3]`. Токены считаются как `len(text) // 4`, стоимость по фиксированной цене, модель `gpt-4.1-mini (mock)`, `prompt_version = answer_v1`.
- **Тайминги**: синтетические, детерминированные, пропорциональны объёму работы на стадии.

Числа в трейсе вычислены, а не захардкожены: другой запрос или другие фильтры в http-режиме дают другие кандидаты, скоры и confidence.

Известное ограничение: векторный мок опирается на английские `semantic_tags` и не стеммит русский, поэтому произвольные запросы на русском в http-режиме обычно уходят в LOW.

## Структура

```
fixtures/                 единый источник данных: статьи, знания, процессинг, canned-запросы
backend/
  app/domain/             dataclass-модели и enum'ы, без зависимостей от других слоёв
  app/application/        use cases, порты (Protocol), RRF, префильтр, confidence, config
  app/infrastructure/     in-memory репозитории, моки поиска/реранкера/агента, сборка зависимостей
  app/api/                FastAPI: роутеры, pydantic-схемы, deps
  scripts/export_traces.py
  tests/
frontend/src/
  app/                    роутер, провайдеры, layout
  shared/api/             ApiClient, HttpApiClient, InMemoryApiClient, DTO
  shared/ui/              Badge, StatusPill, Table, Tree, ScoreBar, Panel, Stepper, TraceStage
  entities/               доменные типы и маппинг DTO → entities
  features/               knowledge-base, document, processing, rag-search,
                          retrieved-context, ai-answer, architecture
  pages/
docs/architecture.md
```

Зависимости направлены внутрь: `api → infrastructure → application → domain`. В `domain` и `application` нет импортов FastAPI и pydantic, mypy для них работает в `strict`.

На фронтенде результат RAG живёт в кэше TanStack Query по ключу запроса. Запрос (текст и изменённые фильтры) кодируется в URL, поэтому экраны `/rag/context` и `/rag/answer` читают тот же ключ из кэша без второго запроса. При прямом заходе без данных они редиректят на `/rag` с тем же запросом. Глобального стора нет.

## API

`/api/v1`, схема на `/docs`.

| Метод | Путь | |
|---|---|---|
| GET | `/articles?language&source_id&status&topic_id` | список статей с количеством фактов по статусам |
| GET | `/articles/{id}` | дерево статьи и связанные факты, claims, сущности, топики, источники |
| GET | `/articles/{id}/processing` | задача процессинга статьи |
| GET | `/processing/queue` | FAILED, PROCESSING, QUEUED, затем последние PROCESSED |
| GET | `/meta/filters` | значения для фильтров |
| POST | `/rag/query` | `{ trace, results, context, answer \| low_confidence }` |
| GET | `/health` | |

## Тесты и линтеры

```bash
make test             # pytest + vitest
make lint             # ruff check, ruff format --check, mypy, eslint, prettier, tsc
make export-fixtures  # пересобрать frontend/public/fixtures из fixtures/
```

Backend (pytest): RRF (порядок, k, дубликаты), префильтр (до поиска, пустой корпус), confidence (формула, уровни, reasons, `exclude_outdated`), `RunRagQuery` на canned-запросах (агент не вызывается при LOW), целостность фикстур, API.

Frontend (vitest): подбор canned-запроса в `InMemoryApiClient` и LOW на нерелевантный ввод, маппинг DTO → entities, кодирование запроса в URL.

## Деплой фронтенда

Статическая сборка в memory-режиме, бэкенд не нужен:

```bash
make build    # frontend/dist
```

Основной вариант — GitHub Pages: workflow `.github/workflows/deploy-pages.yml` на каждый push в `main` (при изменениях во `frontend/`) собирает с `VITE_BASE_PATH=/<repo>/` и кладёт `404.html`, чтобы глубокие ссылки работали при клиентском роутинге. В настройках репозитория нужно один раз выбрать Settings → Pages → Source: GitHub Actions.

```bash
git remote add origin git@github.com:viktor25104/tron-kb-rag-prototype.git
git push -u origin main
```

Запасной вариант — Vercel: корень проекта `frontend/`, `vercel.json` уже настраивает SPA-rewrite.
