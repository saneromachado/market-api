# Market API

API de um pequeno mercado criada como laboratório para estudar testes de API.
O projeto permite praticar autenticação, CRUD, validação de contrato, paginação,
regras de estoque, conflitos, transações e testes automatizados com Playwright.

## Sistema publicado e integração

- Frontend: <https://saneromachado.github.io/mercatto-market-web/>
- Base REST usada pelo frontend: <https://market-api-njmw.onrender.com/api>
- Saúde: <https://market-api-njmw.onrender.com/api/health>
- Swagger: <https://market-api-njmw.onrender.com/docs>
- Frontend no GitHub: <https://github.com/saneromachado/mercatto-market-web>

Consulte [a documentação completa da integração](docs/INTEGRACAO.md) para
entender arquitetura, autenticação, CORS, variáveis, deploy e diagnóstico.

## O que o sistema faz

- Autentica usuários com JWT.
- Cadastra e consulta categorias.
- Cadastra, pesquisa, altera e inativa produtos.
- Controla entrada, saída e ajuste de estoque.
- Mantém o histórico das movimentações.
- Consulta produtos com estoque baixo.
- Realiza vendas com um ou vários produtos.
- Impede vendas acima do estoque disponível.
- Cancela vendas e devolve os produtos ao estoque.
- Protege o cancelamento contra devolução duplicada.
- Documenta os endpoints com Swagger.
- Padroniza as respostas de erro.

## Tecnologias

- Node.js 20 ou superior
- NestJS e TypeScript
- PostgreSQL 16
- Prisma ORM
- Swagger/OpenAPI
- Playwright
- Docker Compose

## Estrutura do projeto

```text
market-api/
|-- prisma/
|   |-- migrations/         # versionamento do banco de produção
|   |-- schema.prisma       # tabelas, relacionamentos e enums
|   `-- seed.ts             # usuário e produtos iniciais
|-- docs/
|   `-- INTEGRACAO.md       # frontend, API, banco e deploys
|-- src/
|   |-- auth/               # login e validação do JWT
|   |-- categories/         # categorias
|   |-- products/           # catálogo de produtos
|   |-- inventory/          # estoque e movimentações
|   |-- sales/              # vendas e cancelamentos
|   |-- common/             # tratamento padronizado de erros
|   `-- prisma/             # conexão com o banco
|-- tests/api/
|   |-- auth.spec.ts
|   |-- health.spec.ts
|   |-- market-flow.spec.ts
|   |-- validation.spec.ts
|   `-- helpers.ts
|-- docker-compose.yml
|-- playwright.config.ts
|-- render.yaml             # Blueprint da API e do PostgreSQL no Render
`-- package.json
```

## Pré-requisitos

Instale:

1. Node.js 20 ou superior.
2. npm, normalmente instalado junto com o Node.js.
3. Docker Desktop, que fornecerá o PostgreSQL.

Confirme as instalações:

```powershell
node --version
npm --version
docker --version
docker compose version
```

## Instalação inicial

Abra o PowerShell e entre no projeto:

```powershell
cd C:\Users\saner.machado\Documents\PlaywrightDemo\market-api
```

Instale as dependências:

```powershell
npm install
```

Inicie o PostgreSQL:

```powershell
docker compose up -d
```

Confira se o contêiner está ativo:

```powershell
docker compose ps
```

Prepare o banco. Esse comando gera o cliente do Prisma, cria as tabelas e
executa o seed:

```powershell
npm run setup
```

Inicie a API:

```powershell
npm run start:dev
```

O modo `start:dev` acompanha mudanças nos arquivos e reinicia a aplicação
automaticamente.

## Endereços locais

Depois de iniciar a API:

| Recurso      | Endereço                           |
| ------------ | ---------------------------------- |
| API          | `http://localhost:3000/api`        |
| Swagger      | `http://localhost:3000/docs`       |
| Health check | `http://localhost:3000/api/health` |

Para verificar rapidamente se a aplicação está disponível:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "service": "market-api",
  "timestamp": "2026-01-01T12:00:00.000Z"
}
```

## Usuário inicial

O seed cria o seguinte administrador:

```text
E-mail: admin@market.local
Senha:  admin123
Perfil: ADMIN
```

Essas credenciais são somente para estudo local. Não use essa senha ou a chave
JWT do arquivo `.env` em produção.

## Tutorial pelo Swagger

Esta é a maneira mais simples de conhecer a API:

1. Execute `npm run start:dev`.
2. Abra `http://localhost:3000/docs`.
3. Expanda `POST /api/auth/login`.
4. Clique em **Try it out**.
5. Informe:

```json
{
  "email": "admin@market.local",
  "password": "admin123"
}
```

6. Clique em **Execute**.
7. Copie o valor de `accessToken` da resposta.
8. Clique no botão **Authorize**, no topo do Swagger.
9. Cole somente o token ou informe `Bearer SEU_TOKEN`, conforme solicitado pela
   interface.
10. Execute os endpoints de categoria, produto, estoque e venda.

O endpoint de saúde e o login são públicos. Todos os outros exigem um token
válido.

## Tutorial completo pelo PowerShell

Os exemplos abaixo constroem um fluxo completo. Execute-os na mesma janela do
PowerShell para preservar as variáveis.

### 1. Fazer login

```powershell
$loginBody = @{
  email = "admin@market.local"
  password = "admin123"
} | ConvertTo-Json

$login = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/auth/login" `
  -ContentType "application/json" `
  -Body $loginBody

$headers = @{
  Authorization = "Bearer $($login.accessToken)"
}
```

### 2. Cadastrar uma categoria

```powershell
$categoryBody = @{
  name = "Bebidas"
  description = "Sucos, refrigerantes e água"
} | ConvertTo-Json

$category = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/categories" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $categoryBody

$category
```

O identificador ficará disponível em `$category.id`.

### 3. Cadastrar um produto

SKU e código de barras precisam ser únicos:

```powershell
$productBody = @{
  name = "Suco de uva 1L"
  sku = "SUCO-UVA-001"
  barcode = "7891234567890"
  price = 12.50
  minimumStock = 3
  categoryId = $category.id
} | ConvertTo-Json

$product = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/products" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $productBody

$product
```

Um produto é criado com estoque igual a zero. O estoque só pode mudar por meio
de uma movimentação ou venda.

### 4. Dar entrada no estoque

```powershell
$movementBody = @{
  productId = $product.id
  type = "ENTRY"
  quantity = 10
  reason = "Compra do fornecedor"
} | ConvertTo-Json

$movement = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/inventory/movements" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $movementBody

$movement
```

O produto agora terá dez unidades.

### 5. Realizar uma venda

```powershell
$saleBody = @{
  paymentMethod = "PIX"
  discount = 2.00
  items = @(
    @{
      productId = $product.id
      quantity = 2
    }
  )
} | ConvertTo-Json -Depth 5

$sale = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/sales" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $saleBody

$sale
```

O subtotal será `25.00`, o desconto será `2.00`, o total será `23.00` e o
estoque passará de dez para oito unidades.

### 6. Consultar o produto

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/api/products/$($product.id)" `
  -Headers $headers
```

### 7. Consultar as movimentações

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/api/inventory/movements?productId=$($product.id)" `
  -Headers $headers
```

O histórico terá uma entrada e uma saída gerada pela venda.

### 8. Cancelar a venda

```powershell
$cancelledSale = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/sales/$($sale.id)/cancel" `
  -Headers $headers

$cancelledSale
```

O status será `CANCELLED` e o estoque retornará para dez unidades. Repetir essa
mesma chamada não duplicará a devolução.

## Tipos aceitos

### Movimentação de estoque

| Tipo         | Comportamento                                           |
| ------------ | ------------------------------------------------------- |
| `ENTRY`      | Soma a quantidade ao estoque                            |
| `EXIT`       | Subtrai a quantidade, caso exista saldo                 |
| `ADJUSTMENT` | Define o estoque exatamente para a quantidade informada |

Movimentos `SALE` e `SALE_CANCELLATION` são gerados automaticamente pelo
sistema e não são aceitos no endpoint de movimentação manual.

### Forma de pagamento

- `CASH`
- `CREDIT_CARD`
- `DEBIT_CARD`
- `PIX`

### Status da venda

- `COMPLETED`
- `CANCELLED`

## Endpoints

Todos os endpoints, exceto saúde e login, exigem:

```http
Authorization: Bearer <accessToken>
```

| Método | Rota                       | Finalidade                    |
| ------ | -------------------------- | ----------------------------- |
| GET    | `/api/health`              | Verificar disponibilidade     |
| POST   | `/api/auth/login`          | Obter token JWT               |
| POST   | `/api/categories`          | Cadastrar categoria           |
| GET    | `/api/categories`          | Listar categorias             |
| GET    | `/api/categories/:id`      | Consultar categoria           |
| PATCH  | `/api/categories/:id`      | Alterar ou inativar categoria |
| POST   | `/api/products`            | Cadastrar produto             |
| GET    | `/api/products`            | Pesquisar e paginar produtos  |
| GET    | `/api/products/:id`        | Consultar produto             |
| PATCH  | `/api/products/:id`        | Alterar produto               |
| DELETE | `/api/products/:id`        | Inativar produto sem apagá-lo |
| POST   | `/api/inventory/movements` | Movimentar estoque            |
| GET    | `/api/inventory/movements` | Consultar histórico           |
| GET    | `/api/inventory/low-stock` | Consultar estoque mínimo      |
| POST   | `/api/sales`               | Realizar venda                |
| GET    | `/api/sales`               | Listar vendas                 |
| GET    | `/api/sales/:id`           | Consultar venda               |
| POST   | `/api/sales/:id/cancel`    | Cancelar venda                |

## Pesquisa e paginação

Produtos podem ser pesquisados por parte do nome, SKU ou código de barras:

```text
GET /api/products?search=suco
```

Para paginar:

```text
GET /api/products?page=1&limit=10
```

Para filtrar pelo estado:

```text
GET /api/products?active=true
```

Exemplo de resposta paginada:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "pages": 0
  }
}
```

Vendas aceitam paginação e filtro de status:

```text
GET /api/sales?page=1&limit=10&status=COMPLETED
```

## Respostas e códigos HTTP

| Código | Significado no projeto                                  |
| ------ | ------------------------------------------------------- |
| `200`  | Consulta ou login realizado                             |
| `201`  | Cadastro, movimentação, venda ou cancelamento realizado |
| `400`  | Payload inválido ou regra de negócio impedida           |
| `401`  | Token ausente, inválido ou credenciais incorretas       |
| `404`  | Recurso não encontrado                                  |
| `409`  | Categoria, SKU ou código de barras duplicado            |
| `500`  | Erro interno inesperado                                 |

Erros seguem este formato:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["name must be longer than or equal to 2 characters"],
  "path": "/api/categories",
  "timestamp": "2026-01-01T12:00:00.000Z"
}
```

## Regras de negócio para testar

- Nome de categoria, SKU e código de barras duplicados retornam `409`.
- Campos desconhecidos ou valores inválidos retornam `400`.
- Rotas protegidas sem JWT retornam `401`.
- Produto inativo não pode ser movimentado ou vendido.
- Saída ou venda acima do estoque retorna `400`.
- Uma venda não aceita o mesmo produto repetido no payload.
- O desconto não pode superar o subtotal.
- Uma venda com vários itens é processada em uma transação.
- Se qualquer item falhar, nenhuma baixa de estoque é confirmada.
- Cancelar uma venda devolve seus itens ao estoque.
- Repetir o cancelamento não devolve o estoque novamente.
- Exclusão de produto é lógica: o registro é apenas inativado.

## Testes automatizados

Antes de testar, confirme:

```powershell
docker compose up -d
npm run setup
```

O Playwright inicia a API automaticamente durante a execução.

### Todos os testes no terminal

```powershell
npm run test:api
```

### Interface visual do Playwright

```powershell
npm run test:api:ui
```

Na interface:

1. Localize os arquivos na lateral esquerda.
2. Abra um arquivo para ver seus cenários.
3. Clique no triângulo ao lado do teste.
4. Observe requisições, passos, duração e falhas.
5. Use `market-flow.spec.ts` para acompanhar o fluxo completo do negócio.

Como os testes são de API, não haverá uma página de navegador sendo
automatizada. As ações aparecem no painel do Playwright como chamadas HTTP.

### Executar somente um arquivo

```powershell
npx playwright test market-flow.spec.ts
```

### Executar pelo título

```powershell
npx playwright test -g "cadastra, abastece, vende e cancela"
```

### Listar os testes sem executar

```powershell
npm run test:api:list
```

### Abrir o relatório HTML

```powershell
npx playwright show-report
```

### Usar outra API

Para testar uma instância em outro endereço:

```powershell
$env:API_BASE_URL = "http://servidor:3000/api"
npm run test:api
```

## Cenários já implementados

| Arquivo               | Cobertura                                                   |
| --------------------- | ----------------------------------------------------------- |
| `health.spec.ts`      | Health check público                                        |
| `auth.spec.ts`        | Login válido, senha inválida e rota sem token               |
| `validation.spec.ts`  | Campo desconhecido e nome inválido                          |
| `market-flow.spec.ts` | Categoria, produto, conflito, estoque, venda e cancelamento |

Mais sugestões estão em
[docs/TEST-SCENARIOS.md](docs/TEST-SCENARIOS.md).

## Comandos disponíveis

| Comando                   | Finalidade                                |
| ------------------------- | ----------------------------------------- |
| `npm run start:dev`       | Iniciar API com recarga automática        |
| `npm run start`           | Iniciar API normalmente                   |
| `npm run build`           | Compilar o projeto                        |
| `npm run typecheck`       | Verificar tipos TypeScript                |
| `npm run lint`            | Verificar qualidade do código             |
| `npm run format`          | Formatar arquivos                         |
| `npm run prisma:generate` | Gerar cliente Prisma                      |
| `npm run db:push`         | Criar ou atualizar tabelas                |
| `npm run db:seed`         | Inserir dados iniciais                    |
| `npm run db:studio`       | Abrir interface visual do banco           |
| `npm run setup`           | Gerar Prisma, criar banco e executar seed |
| `npm run test:api`        | Executar testes Playwright                |
| `npm run test:api:ui`     | Abrir Playwright UI                       |
| `npm run test:api:list`   | Listar os testes                          |

## Prisma Studio

Para visualizar e editar dados do PostgreSQL:

```powershell
npm run db:studio
```

O terminal mostrará o endereço local do Prisma Studio. Use essa interface para
observar como produtos, vendas, itens e movimentações são gravados enquanto os
testes executam.

## Variáveis de ambiente

O arquivo `.env.example` documenta as configurações:

```dotenv
PORT=3000
DATABASE_URL=postgresql://market:market@localhost:5432/market?schema=public
JWT_SECRET=troque-esta-chave-em-ambientes-reais
JWT_EXPIRES_IN=1h
```

Para outro banco, altere `DATABASE_URL`. Para outra porta, altere `PORT` e
ajuste `API_BASE_URL` ao executar os testes.

## Parar o ambiente

Pare a API com `Ctrl+C`.

Pare o PostgreSQL sem apagar os dados:

```powershell
docker compose stop
```

Inicie-o novamente:

```powershell
docker compose start
```

Para remover o contêiner sem apagar o volume:

```powershell
docker compose down
```

> O comando abaixo apaga definitivamente o banco local e deve ser usado apenas
> quando você realmente quiser começar do zero.

```powershell
docker compose down -v
docker compose up -d
npm run setup
```

## Solução de problemas

### `docker` não é reconhecido

Instale e inicie o Docker Desktop. Depois feche e abra novamente o PowerShell e
execute `docker --version`.

### A porta 5432 já está em uso

Existe outro PostgreSQL usando a porta. Pare o serviço existente ou altere a
porta do `docker-compose.yml` e a `DATABASE_URL`.

### A API não conecta ao banco

Confira:

```powershell
docker compose ps
docker compose logs postgres
```

Depois execute:

```powershell
npm run setup
```

### Login retorna `401`

Confirme se o seed foi executado:

```powershell
npm run db:seed
```

No ambiente local, use `admin@market.local` e `admin123`. Em produção, use a
senha configurada em `ADMIN_PASSWORD` no Render.

### Testes não conseguem iniciar a API

Verifique se o banco está ativo e se as tabelas existem:

```powershell
docker compose up -d
npm run setup
npm run test:api
```

### Porta 3000 já está em uso

Encerre a aplicação que está usando a porta ou altere `PORT` no `.env`. Ao
alterá-la, defina também:

```powershell
$env:API_BASE_URL = "http://127.0.0.1:NOVA_PORTA/api"
```

## Próximas ideias para evolução

- Perfis e autorização por função: administrador, caixa e estoquista.
- Cadastro de fornecedores.
- Compras e contas a pagar.
- Clientes e programa de fidelidade.
- Cupons de desconto.
- Reserva de estoque.
- Testes de concorrência para a última unidade.
- Testes de carga.
- Pipeline de integração contínua.
- Banco isolado e limpeza automática entre testes.
- Relatórios de vendas e produtos mais vendidos.

## Publicação no Render

O arquivo `render.yaml` cria dois recursos na região de Ohio:

- `market-api`: serviço web Node.js no plano gratuito;
- `market-db`: banco PostgreSQL no plano gratuito.

No primeiro deploy, o Render solicitará `ADMIN_PASSWORD`. Use uma senha forte,
com pelo menos 8 caracteres. As demais variáveis são configuradas pelo
Blueprint, inclusive a conexão com o banco e o segredo JWT.

O comando de inicialização aplica as migrations, cria os dados iniciais e
inicia a API. A verificação de saúde fica disponível em `/api/health`.

O frontend principal é publicado separadamente pelo GitHub Actions em
<https://saneromachado.github.io/mercatto-market-web/>. A API autoriza essa
origem no CORS. Consulte [a documentação de integração](docs/INTEGRACAO.md) para
o fluxo completo e o checklist de publicação.

> O PostgreSQL gratuito do Render é indicado para testes e demonstrações.
> Consulte os limites atuais do plano antes de usar dados importantes.
