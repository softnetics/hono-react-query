# Type-safe React Query integration for Hono applications <!-- omit in toc -->

A type-safe React Query integration for Hono applications that provides seamless data fetching, mutations, and caching with full TypeScript support.

- [Features](#features)
- [Installation](#installation)
  - [Peer Dependencies](#peer-dependencies)
- [Quick Start](#quick-start)
  - [1. Define your Hono app](#1-define-your-hono-app)
  - [2. Create the React Query client](#2-create-the-react-query-client)
  - [3. Use in your React components](#3-use-in-your-react-components)
- [API Reference](#api-reference)
  - [`createReactQueryClient<T>(options)`](#createreactqueryclienttoptions)
  - [Query Methods](#query-methods)
    - [`useQuery(path, method, payload, options?)`](#usequerypath-method-payload-options)
    - [`queryOptions(path, method, payload, options?)`](#queryoptionspath-method-payload-options)
  - [Mutation Methods](#mutation-methods)
    - [`useMutation(path, method, options?, mutationOptions?)`](#usemutationpath-method-options-mutationoptions)
    - [`mutationOptions(path, method, options?, mutationOptions?)`](#mutationoptionspath-method-options-mutationoptions)
  - [Cache Management](#cache-management)
    - [`useGetQueryData(path, method, payload)`](#usegetquerydatapath-method-payload)
    - [`useSetQueryData(path, method, payload)`](#usesetquerydatapath-method-payload)
    - [`useInvalidateQueries(path, method, payload?, options?)`](#useinvalidatequeriespath-method-payload-options)
    - [`useOptimisticUpdateQuery(path, method, payload)`](#useoptimisticupdatequerypath-method-payload)
- [Type Safety](#type-safety)
- [Error Handling](#error-handling)
- [Key Management](#key-management)
- [Limitation](#limitation)
- [License](#license)
- [Contributors](#contributors)
- [Contributing](#contributing)

## Features

- 🔒 **Type-safe**: Full TypeScript support with automatic type inference from your Hono routes
- ⚡ **React Query integration**: Built on top of TanStack Query for powerful caching and synchronization
- 🎯 **Hono-first**: Designed specifically for Hono applications with automatic client generation
- 🚀 **Zero configuration**: Works out of the box with your existing Hono setup
- 🔄 **Optimistic updates**: Built-in support for optimistic UI updates
- 📦 **Lightweight**: Minimal bundle size with no unnecessary dependencies

## Installation

```bash
pnpm add @softnetics/hono-react-query
bun add @softnetics/hono-react-query
yarn add @softnetics/hono-react-query
npm install @softnetics/hono-react-query
```

### Peer Dependencies

This package requires the following peer dependencies:

```bash
pnpm add @tanstack/react-query hono
bun add @tanstack/react-query hono
yarn add @tanstack/react-query hono
npm install @tanstack/react-query hono
```

## Quick Start

### 1. Define your Hono app

```typescript
// app.ts
import { Hono } from 'hono'
import { validator } from 'hono/validator'
import { z } from 'zod'

const app = new Hono()
  .get('/users', (c) => {
    return c.json({ users: [{ id: 'id', name: 'John Doe' }] }, 200)
  })
  .get('/users/:id', (c) => {
    if (!c.req.param('id')) {
      return c.json({ error: 'User ID is required' }, 400)
    }
    return c.json({ user: { id: 'id', name: 'John Doe' } }, 200)
  })
  .post('/users', validator('json', z.object({ name: z.string() })), async (c) => {
    const body = await c.req.valid('json')
    if (body.name === 'forbidden_word') {
      return c.json({ error: 'Name is required' }, 400)
    }
    return c.json({ user: { id: 'id', name: body.name } }, 201)
  })

export type AppType = typeof app
```

### 2. Create the React Query client

```tsx
// client.ts
import { createReactQueryClient } from '@softnetics/hono-react-query'
import type { App } from './app'

export const reactQueryClient = createReactQueryClient<App>({
  baseUrl: 'http://localhost:3000',
})
```

### 3. Use in your React components

```tsx
// components/UserList.tsx
import { reactQueryClient } from './client'
import { isHonoResponseError } from '@softnetics/hono-react-query'

export function UserList() {
  // Type-safe query with automatic inference
  const usersQuery = reactQueryClient.useQuery('/users', '$get', {})

  usersQuery.data // { data: { users: { id: string; name: string }[] }, status: 200, format: 'json' } | undefined
  usersQuery.error // Error | HonoResponseError<{ error: string }, 400, 'json'> | null

  // Type-safe mutation with automatic inference
  const createUserMutation = reactQueryClient.useMutation('/users', '$post', {
    onMutate: (data) => {
      return { toastId: toast.loading('Creating user...') }
    },
    onSuccess: (response, _, context) => {
      response.data // { user: { id: string; name: string } }
      response.status // 201
      response.format // 'json'
      toast.success('User created', { id: context.toastId })
    },
    onError: (error, _, context) => {
      error // Error | HonoResponseError<{ error: string }, 400, 'json'>
      if (isHonoResponseError(error)) {
        error.data // { error: string }
        error.status // 400
        error.format // 'json'
      }
      toast.error(error.data.error, { id: context?.toastId })
    },
  })
  
  createUserMutation.mutateAsync({ json: { name: 'John Doe' } })
}
```

## API Reference

### `createReactQueryClient<T>(options)`

Creates a type-safe React Query client for your Hono application. Under the hood, it uses the [hc](https://hono.dev/docs/guides/rpc) function to create a client for your Hono application.

**Parameters:**

- `options.baseUrl` - The base URL of your Hono application
- `options` - Additional Hono client options (headers, fetch options, etc.)

**Returns:** A client object with the following methods:

### Query Methods

#### `useQuery(path, method, payload, options?)`

Executes a GET request with React Query caching. Under the hood, it uses the [useQuery](https://tanstack.com/query/v5/docs/framework/react/guides/queries) function to execute the query.

```typescript
const { data, isLoading, error } = reactQueryClient.useQuery(
  '/users',
  '$get',
  { input: { query: { limit: 10 } } },
  { staleTime: 5 * 60 * 1000 } // 5 minutes
)
```

#### `queryOptions(path, method, payload, options?)`

Creates query options for use with `useQuery` or `useSuspenseQuery`. Under the hood, it uses the [queryOptions](https://tanstack.com/query/v5/docs/framework/react/guides/queries) function to create the query options.

```typescript
import { reactQueryClient } from './client'
import { useQuery } from '@tanstack/react-query'

const queryOptions = reactQueryClient.queryOptions('/users', '$get', {})
const { data } = useQuery(queryOptions) // automatically inferred type based on your Hono app
```

### Mutation Methods

#### `useMutation(path, method, options?, mutationOptions?)`

Mutates data on the server. Under the hood, it uses the [useMutation](https://tanstack.com/query/v5/docs/framework/react/guides/mutations) function to execute the mutation.

```typescript
const createUserMutation = reactQueryClient.useMutation('/users', '$post', {
  onMutate: (data) => {
    return { toastId: toast.loading('Creating user...') }
  },
  onSuccess: (response, _, context) => {
    response.data // { user: { id: string; name: string } }
    response.status // 201
    response.format // 'json'
    toast.success('User created', { id: context.toastId })
  },
  onError: (error, _, context) => {
    error // Error | HonoResponseError<{ error: string }, 400, 'json'>
    if (isHonoResponseError(error)) {
      error.data // { error: string }
      error.status // 400
      error.format // 'json'
    }
    toast.error(error?.data?.error, { id: context?.toastId })
  },
})
```

#### `mutationOptions(path, method, options?, mutationOptions?)`

Creates mutation options for use with `useMutation`. Under the hood, it uses the [mutationOptions](https://tanstack.com/query/v5/docs/framework/react/guides/mutations) function to create the mutation options.

```typescript
const mutationOptions = reactQueryClient.mutationOptions('/users', '$post')
const createUserMutation = useMutation(mutationOptions) // automatically inferred type based on your Hono app
```

### Cache Management

#### `useGetQueryData(path, method, payload)`

Gets cached type-safe query data without triggering a fetch. Under the hood, it uses the [getQueryData](https://tanstack.com/query/v5/docs/framework/react/guides/queries) function to get the cached data.

```typescript
const getQueryData = reactQueryClient.useGetQueryData('/users', '$get', {})
const cachedData = getQueryData()
// cachedData is typed as: { data: { users: { id: string; name: string }[] }, status: 200, format: 'json' } | undefined
```

#### `useSetQueryData(path, method, payload)`

Manually updates cached query data with a type-safe payload. Under the hood, it uses the [setQueryData](https://tanstack.com/query/v5/docs/framework/react/guides/queries) function to update the cached data.

```typescript
const setQueryData = reactQueryClient.useSetQueryData('/users', '$get', {})

function onSubmit(newData: { users: { id: string; name: string }[] }) {
  setQueryData(newData)
}
```

#### `useInvalidateQueries(path, method, payload?, options?)`

Invalidates cached queries to trigger refetching with a type-safe payload. Under the hood, it uses the [invalidateQueries](https://tanstack.com/query/v5/docs/framework/react/guides/queries) function to invalidate the cached data.

```typescript
// Exact key
const invalidateQueries = reactQueryClient.useInvalidateQueries('/users', '$get')
invalidateQueries() // Refetch all user queries

// Exact key
const invalidateQueries = reactQueryClient.useInvalidateQueries('/users/:id', '$get', {
  input: { param: { id: '1' } },
})
invalidateQueries() // Invalidate the user query with the id parameter

// Partial key
const invalidateQueries = reactQueryClient.useInvalidateQueries('/users/:id', '$get')
invalidateQueries() // Invalidate all queries starting with ["/users/:id", "$get"]
```

#### `useOptimisticUpdateQuery(path, method, payload)`

Performs optimistic updates with rollback capability. Under the hood, it uses the [getQueryData](https://tanstack.com/query/v5/docs/framework/react/guides/queries) and [setQueryData](https://tanstack.com/query/v5/docs/framework/react/guides/queries) functions to perform the optimistic update.

```typescript
const optimisticUpdate = reactQueryClient.useOptimisticUpdateQuery('/users', '$get', {})

// combine with useMutation
const { mutate } = reactQueryClient.useMutation('/users', '$post', {
  onMutate: (data) => {
    const updater = optimisticUpdate((prev) => ({
      ...prev,
      users: [...prev.users, data.json],
    }))
    return { updater }
  },
  onSuccess: (response, _, context) => {
    // handle success
  },
  onError: (error, _, context) => {
    // revert the optimistic update if the mutation fails
    context?.updater?.revert()
  },
})
```

## Type Safety

The library provides full type safety by inferring types from your Hono application:

```typescript
// Your Hono app types are automatically inferred
const { data } = reactQueryClient.useQuery('/users', '$get', {})
// data is typed as: "{ data: { users: User[] }, status: number, format: 'json' } | undefined"

const mutation = reactQueryClient.useMutation('/users', '$post')
mutation.mutate({ json: { name: 'John Doe' } }) // Expect type "{ json: { name: 'John Doe' } } | undefined" for payload
```

## Error Handling

The library includes a custom error class for handling Hono responses:

```typescript
import { HonoResponseError, isHonoResponseError } from '@softnetics/hono-react-query'

const { data, error } = reactQueryClient.useQuery('/users', '$get', {})

// Use "isHonoResponseError" to check if the error is a Hono response error and get the status, data, and format
if (error && isHonoResponseError(error)) {
  console.log('Status:', error.status)
  console.log('Data:', error.data)
  console.log('Format:', error.format)
}
```

## Key Management

The library automatically generates query keys based on the path, method, and payload. You can access the key generation function:

```typescript
const queryOptions = reactQueryClient.queryOptions('/users', '$get', { input: { query: { limit: 10 } } })
const queryKey = queryOptions.queryKey //  ["/users", "$get", { query: { limit: 10 } }]
```

## Limitation

Users must always specify the return status from the Hono app. If not specified, the library will not be able to infer the correct type.

```ts
const app = new Hono().get('/users', (c) => {
  return c.json({ users: [{ id: 'id', name: 'John Doe' }] }, 200) // "200" is required
})
```

## License

MIT

## Contributors

<a href="https://github.com/softnetics/hono-react-query/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=OWNER/REPO" />
</a>

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

