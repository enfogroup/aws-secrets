## Introduction

This package exposes functionality for getting parameters from SSM and SecretsManager and caching them.

## Installation

```bash
npm install @enfo/aws-secrets --save
```

The aws-sdk is a peer dependency and must be installed by you.

## Available caches

This package exposes wrappers for two AWS secrets services: SSMCache and SecretsManagerCache. Both are built for retrieving and caching a value. The caches have the same constructor parameters:

* region - region from which the values should be retrieved
* defaultTTL - optional default TTL to use on all requests. Defaults to 0 which means a value will be cached for as long as the node process lives

## SSMCache

SSMCache can retrieve and cache parameters from SSM. Parameters of type String and SecureString are supported. These are the configuration options on the getParameter method:

* name - name of parameter to retrieve
* region (optional) - region to fetch parameter from. Defaults to region set in constructor
* ttl (optional) - ttl to use when caching the parameter. Defaults to 0 (forever) or defaultTTL if specified in the constructor
* cacheKey (optional) - key used for caching. Default: value of name

### Examples

```typescript
import { SSMCache } from '@enfo/aws-secrets'

const ssmCache = new SSMCache({ region: 'eu-west-1' })

const foo = async () => {
   // retrieved and cached forever
  const myParameter = await ssmCache.getParameter({ name: 'my-parameter' })

  ssmCache.setDefaultTTL(10)
   // cached for 10 seconds
  const anotherParameter = await ssmCache.getParameter({ name: 'my-other-parameter' })

  // retrieved from 'us-east-2', cached for 20 seconds using the key 'coolKey'
  const thirdParameter = await ssmCache.getParameter({ name: 'third-parameter', ttl: 1200, region: 'us-east-2', cacheKey: 'coolKey'})

  // no request is made to SSM since this is cached
  await ssmCache.getParameter({ name: 'my-parameter'})
}
```

## SecretsManagerCache

SecretsManagerCache can retrieve and cache parameters from SecretsManager. Two methods for getting secrets are available:

* getSecretAsString - returns the secret value as string
* getSecretAsJson - returns the secret value as JSON. You can specify the interface as which the secret should be returned

These are the configuration options on the getSecretAsString and getSecretAsJson methods:

* id - id of secret
* versionId - version id of the secret
* versionStage - version stage of the secret
* region (optional) - region to fetch secret from. Defaults to region set in constructor
* ttl (optional) - ttl to use when caching the secret. Defaults to 0 (forever) or defaultTTL if specified in the constructor
* cacheKey (optional) - key used for caching. Default: value of name

### Examples

```typescript
import { SecretsManagerCache } from '@enfo/aws-secrets'

const secretsManagerCache = new SecretsManagerCache({ region: 'eu-west-1' })

const foo = async () => {
   // retrieved and cached forever
  const myValue = await secretsManagerCache.getSecretAsString({ id: 'my-secret' })

  secretsManagerCache.setDefaultTTL(10)
   // cached for 10 seconds
  const anotherValue = await secretsManagerCache.getSecretAsString({ id: 'my-other-secret' })

  // retrieved from 'us-east-2', cached for 20 seconds using the key 'coolKey'
  const thirdValue = await secretsManagerCache.getSecretAsString({ id: 'third-secret', ttl: 1200, region: 'us-east-2', cacheKey: 'coolKey'})

  // no request is made to SecretsManager since this is cached
  await secretsManagerCache.getSecretAsString({ id: 'my-secret'})

  interface MyData {
    a: number;
    b: string;
  }
  const jsonValue = await secretsManagerCache.getSecretAsJson<MyData>({ id: 'fourth-secret' })
}
```
