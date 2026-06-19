# LokteModule

NestJS feature module for the Lokte integration.

Registers its configuration namespace with `ConfigRegistryModule` at bootstrap so
per-shop settings are available via the shared config API.

---

## Config namespace: `lokte`

| Dot-path | Field type | Default | Description |
|----------|------------|---------|-------------|
| `lokte.general.enable` | `toggle` | `0` | Enable / disable the integration per shop |
| `lokte.general.api_key` | `secret` | `""` | Lokte API key — encrypted at rest |
| `lokte.general.user_id` | `text` | `""` | Lokte user ID |

Follow-up question prompting is configured under its own `follow_up_questions`
namespace:

| Dot-path | Field type | Default | Description |
|----------|------------|---------|-------------|
| `follow_up_questions.general.count` | `number` | `3` | Number of per-reply follow-up questions to request and render, from `0` to `5` |

`secret` fields are stored encrypted (AES-256-GCM) and masked as `"****"` in API
responses. See [ConfigRegistryModule](../config-registry/README.md#secret-field-encryption)
for encryption setup.

---

## Reading config in a service

```ts
import { Injectable } from '@nestjs/common';
import { ConfigRegistryService } from '../config-registry/config-registry.service';

@Injectable()
export class LokteService {
  constructor(private readonly config: ConfigRegistryService) {}

  async isEnabled(shopId: string): Promise<boolean> {
    const val = await this.config.get(shopId, 'lokte.general.enable');
    return Boolean(val);
  }

  async getApiKey(shopId: string): Promise<string> {
    // getDecrypted returns the plaintext value — for internal use only
    return this.config.getDecrypted(shopId, 'lokte.general.api_key');
  }
}
```

---

## REST API (via ConfigRegistryModule)

Config values are read and written through the shared config endpoints.
All routes require a valid Shopify App Bridge JWT.

```http
# Read full lokte config for a shop (api_key masked)
GET /config/:shopId/lokte

# Read a single value
GET /config/:shopId/value?path=lokte.general.enable

# Persist a value
POST /config/:shopId
{ "path": "lokte.general.enable", "value": 1 }
```

See [ConfigRegistryModule REST API](../config-registry/README.md#rest-api) for full
endpoint reference.

---

## Follow-up question prompt decoration

When `follow_up_questions.general.count` is greater than `0`,
`LokteService` decorates the outgoing Lokte message with instructions to append a
marked follow-up block:

```text
<FOLLOW_UP_QUESTIONS>
- Question one?
- Question two?
</FOLLOW_UP_QUESTIONS>
```

The original user message is still saved to local chat history and FAQ question
pool. Only the message sent to Lokte is decorated. The frontend strips the marker
block from rendered markdown and converts the parsed questions into buttons.
