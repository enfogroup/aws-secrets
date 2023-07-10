## Introduction

This package exposes functionality for getting data from SSM, Secrets Manager and KMS. All values can be cached for further use.

## Installation

```bash
npm install @enfo/aws-secrets --save
```

The AWS SDK v3 clients for SSM, Secrets Manager and KMS are all peer dependencies and must be installed by you.

```bash
npm install @aws-sdk/client-ssm @aws-sdk/client-kms @aws-sdk/client-secrets-manager --save-dev
```

## Available caches

This package exposes wrappers for three AWS secrets services: SSMCache, SecretsManagerCache and KMSCache. All three are built for retrieving and caching a value. All retrieval methods use extensions of the underlying AWS SDK method. This is the cause for the weird mismatch of camelCase and PascalCase in the request bodies. The caches have the same constructor parameters:

* region - region from which the values should be retrieved
* defaultTTL - optional default TTL to use on all requests. Defaults to 0 which means a value will be cached for as long as the node process lives

## SSMCache

SSMCache can retrieve and cache parameters from SSM. Parameters of type String, SecureString and StringList are supported. Three methods for getting parameters are available:

* getParameter - Returns value for a specific parameter
* getStringListParameter - Returns value for a specific StringList parameter and splits on ","
* getParametersByPath - Returns parameters based on path. This method is overloaded and supports getting all parameters or responding with an AWS pagination response. The cacheKey on this method is questionable and should probably be set by the client making the request

These are the configuration options on the getParameter and getStringListParameter method:

* All parameters from SSM.GetParameterRequest except WithDecryption which is set to true
* region (optional) - region to fetch parameter from. Defaults to region set in constructor
* ttl (optional) - ttl to use when caching the parameter. Defaults to 0 (forever) or defaultTTL if specified in the constructor
* cacheKey (optional) - key used for caching. Default: Name

These are the configuration options on the getParametersByPath method when getting all parameters

* All parameters from SSM.GetParametersByPath except MaxResults, NextToken and WithDecryption which is set to true
* getAll - parameter indicating that all parameters should be returned. Must be set to true
* region (optional) - region to fetch parameter from. Defaults to region set in constructor
* ttl (optional) - ttl to use when caching the parameter. Defaults to 0 (forever) or defaultTTL if specified in the constructor
* cacheKey (optional) - key used for caching. Default: Path

These are the configuration options on the getParametersByPath method when getting a paginated response

* All parameters from SSM.GetParametersByPath except WithDecryption which is set to true
* region (optional) - region to fetch parameter from. Defaults to region set in constructor
* ttl (optional) - ttl to use when caching the parameter. Defaults to 0 (forever) or defaultTTL if specified in the constructor
* cacheKey (optional) - key used for caching. Default: Path + NextToken (if present) 

### Examples

```typescript
import { SSMCache } from '@enfo/aws-secrets'

const ssmCache = new SSMCache({ region: 'eu-west-1' })

const foo = async () => {
   // retrieved and cached forever
  const myParameter = await ssmCache.getParameter({ Name: 'my-parameter' })

  // @enfo/aws-secrets handles the splitting on ","
  const myListParameter = await ssmCache.getStringListParameter({ Name: 'my-list-parameter' })
  const allPathResponse = await ssmCache.getParametersByPath({ Path: '/a', getAll: true }) // responds with a list of strings
  const paginatedPathResponse = await ssmCache.getParametersByPath({ Path: '/b' }) // responds with a GetParametersByPathCommandOutput object

  ssmCache.setDefaultTTL(10)
   // cached for 10 seconds
  const anotherParameter = await ssmCache.getParameter({ Name: 'my-other-parameter' })

  // retrieved from 'us-east-2', cached for 20 minutes using the key 'coolKey'
  const thirdParameter = await ssmCache.getParameter({ Name: 'third-parameter', ttl: 1200, region: 'us-east-2', cacheKey: 'coolKey'})

  // no request is made to SSM since this is cached
  await ssmCache.getParameter({ Name: 'my-parameter'})
}
```

## SecretsManagerCache

SecretsManagerCache can retrieve and cache parameters from SecretsManager. Two methods for getting secrets are available:

* getSecretAsString - returns the secret value as string
* getSecretAsJSON - returns the secret value as JSON. You can specify the interface as which the secret should be returned

These are the configuration options on the getSecretAsString and getSecretAsJSON methods:

* All keys from SecretsManager.GetSecretValueRequest
* region (optional) - region to fetch secret from. Defaults to region set in constructor
* ttl (optional) - ttl to use when caching the secret. Defaults to 0 (forever) or defaultTTL if specified in the constructor
* cacheKey (optional) - key used for caching. Default: SecretId

### Examples

```typescript
import { SecretsManagerCache } from '@enfo/aws-secrets'

const secretsManagerCache = new SecretsManagerCache({ region: 'eu-west-1' })

const foo = async () => {
   // retrieved and cached forever
  const myValue = await secretsManagerCache.getSecretAsString({ SecretId: 'my-secret' })

  secretsManagerCache.setDefaultTTL(10)
   // cached for 10 seconds
  const anotherValue = await secretsManagerCache.getSecretAsString({ SecretId: 'my-other-secret' })

  // retrieved from 'us-east-2', cached for 20 minutes using the key 'coolKey'
  const thirdValue = await secretsManagerCache.getSecretAsString({ SecretId: 'third-secret', ttl: 1200, region: 'us-east-2', cacheKey: 'coolKey' })

  // no request is made to SecretsManager since this is cached
  await secretsManagerCache.getSecretAsString({ SecretId: 'my-secret'})

  interface MyData {
    a: number;
    b: string;
  }
  const jsonValue = await secretsManagerCache.getSecretAsJSON<MyData>({ SecretId: 'fourth-secret' })
}
```

## KMSCache

KMSCache can decrypt and cache cipher texts. Two method are available:

* decrypt - decrypts a cipher text and returns the value as string
* decryptAsJSON - decrypts a cipher text and returns it as JSON. You can specify the interface as which the value should be returned

These are the configuration options on the decrypt and decryptAsJSON methods:

* All keys from KMS.DecryptRequest
* region (optional) - region to fetch secret from. Defaults to region set in constructor
* ttl (optional) - ttl to use when caching the secret. Defaults to 0 (forever) or defaultTTL if specified in the constructor
* cacheKey (optional) - key used for caching. Default: CiphertextBlob

### Examples

The below examples do not use real CiphertextBlobs but just dummy values.

```typescript
import { KMSCache } from '@enfo/aws-secrets'

const kmsCache = new KMSCache({ region: 'eu-west-1' })

const foo = async () => {
   // retrieved and cached forever
  const myValue = await kmsCache.decrypt({ CiphertextBlob: Buffer.from('AQIa...==', 'base64') })

  kmsCache.setDefaultTTL(10)
   // cached for 10 seconds
  const anotherValue = await kmsCache.decrypt({ CiphertextBlob: Buffer.from('AQIb...==', 'base64') })

  // retrieved from 'us-east-2', cached for 20 minutes using the key 'thirdValue'
  const thirdValue = await kmsCache.decrypt({ Buffer.from('AQIc...==', 'base64'), ttl: 1200, region: 'us-east-2', cacheKey: 'thirdValue' })

  // no request is made to KMS since this is cached from the first request
  await kmsCache.decrypt({ CiphertextBlob: Buffer.from('AQIa...==', 'base64') })

  interface MyData {
    a: number;
    b: string;
  }
  const jsonValue = await kmsCache.decryptAsJSON<MyData>({ CiphertextBlob: Buffer.from('AQId...==', 'base64') })
}
```
