# Providers

A API usa provedores externos por trás de interfaces estáveis. Não há banco de dados de CNPJ/CEP neste projeto.

```text
Controller → Service → Provider Interface → ProviderManager → Upstreams
```

## Resiliência

`ProviderManager` adiciona:

- prioridade fixa de provedores;
- failover apenas para erros de upstream/timeout;
- circuit breaker por provedor;
- cooldown configurável;
- contagem de sucesso, erro, falha e latência média;
- execução segura para requisições concorrentes.

Configuração:

```env
PROVIDER_FAILURE_THRESHOLD=3
PROVIDER_COOLDOWN_MS=30000
```

A configuração atual de CNPJ é `BrasilAPI → OpenCNPJ`. Isso melhora disponibilidade, mas **não representa garantia de SLA nem licença de revenda**.

## Provedores atuais

| Dado | Provider | Estado | Observação |
|---|---|---|---|
| CNPJ | BrasilAPI | ativo | upstream gratuito; revisar termos antes de uso comercial |
| CNPJ | OpenCNPJ | fallback | dados públicos processados; revisar termos/licença antes de revenda |
| CEP | ViaCEP | ativo | gratuito; uso em massa pode ser bloqueado |
| CEP | Correios | planejado | requer contrato/SIGEP Web |
| CNPJ | Receita Federal | planejado | requer credenciais OAuth2/gov.br/conecta |

**Importante:** gratuito não significa automaticamente autorizado para revenda comercial. Para planos pagos, prefira um fornecedor com contrato/termos explícitos de uso comercial, SLA e redistribuição.

## Produto comercial

O projeto agora separa duas preocupações:

1. **Resiliência:** provedores externos e failover.
2. **Monetização:** planos, limite de requisições e medição de consumo.

Os limites são configuráveis por ambiente e, nesta fase, a medição é em memória. Isso evita banco de dados e funciona bem para uma única instância. Em múltiplas instâncias, o contador não é compartilhado; nesse cenário, um store externo (por exemplo Redis) pode ser adicionado posteriormente.

### Planos iniciais

| Plano | Quota mensal | Rate limit | Chaves |
|---|---:|---:|---:|
| Free | 3.000 | 5/min | 1 |
| Pro | 100.000 | 120/min | 10 |

Os valores são defaults técnicos e devem ser ajustados conforme custos e contratos dos upstreams.

### Headers de uso

Rotas `/api/v1/*` autenticadas retornam:

- `X-Plan`
- `X-Usage-Limit`
- `X-Usage-Used`
- `X-Usage-Remaining`
- `X-Usage-Reset`

Quando a quota mensal é excedida, a API responde `429` com código `PLAN_LIMIT`.

A cobrança recorrente/usage-based pode ser conectada posteriormente a um gateway como Stripe, sem mudar os serviços de negócio.
