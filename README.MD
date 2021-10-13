## Introduction

This package exposes functionality for getting parameters from SSM and caching them.

## Installation

```bash
npm install @enfo/aws-secrets --save
```

## Features

### SSMCache

SSMCache can retrieve and cache parameters from SSM. Parameters of type String and SecureString are supported. Configuration options on the getParameter method:

* name - name of parameter to retrieve
* region (optional) - region to fetch parameter from. Defaults to region set in constructor
* ttl (optional) - ttl to use when caching the parameter. Defaults to 0 (forever) or defaultTTL if specified in the constructor
* cacheKey (optional) - key used for caching. Default: value of name

## Examples

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
