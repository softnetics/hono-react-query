import {
  type DefinedInitialDataOptions,
  type DefinedUseQueryResult,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { Hono } from 'hono'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { createReactQueryClient, HonoResponseError } from '.'

const basicHonoApp = new Hono()
  .get('/users', (c) => {
    return c.json({ users: [{ id: 'id', name: 'John Doe' }] }, 200)
  })
  .get('/users/:id', (c) => {
    if (!c.req.param('id')) {
      return c.json({ error: 'User ID is required' }, 400)
    }

    return c.json({ user: { id: 'id', name: 'John Doe' } }, 200)
  })
  .post('/users', async (c) => {
    const body = await c.req.json()
    if (body.name === undefined) {
      return c.json({ error: 'Name is required' }, 400)
    }
    return c.json({ user: { id: 'id', name: 'Hello' } }, 201)
  })

type BasicHonoApp = typeof basicHonoApp

describe('createReactQueryClient', () => {
  it('should create the query client with the correct methods', () => {
    const client = createReactQueryClient<BasicHonoApp>({
      baseUrl: 'http://localhost:3000',
    })

    expect(client.useQuery).toBeDefined()
    expect(client.useMutation).toBeDefined()
    expect(client.queryOptions).toBeDefined()
    expect(client.mutationOptions).toBeDefined()
    expect(client.useGetQueryData).toBeDefined()
    expect(client.useSetQueryData).toBeDefined()
    expect(client.useInvalidateQueries).toBeDefined()
    expect(client.useOptimisticUpdateQuery).toBeDefined()
  })

  it('should contain Error in Data when throwOnError is false', () => {
    const client = createReactQueryClient<BasicHonoApp>({
      baseUrl: 'http://localhost:3000',
    })

    const queryOptions = client.queryOptions('/users/:id', '$get', {
      input: {
        param: { id: 'none' },
      },
      options: {
        throwOnError: false,
      },
    })

    expectTypeOf<typeof queryOptions>().toEqualTypeOf<
      DefinedInitialDataOptions<
        | {
            data: {
              user: {
                id: string
                name: string
              }
            }
            status: 200
            format: 'json'
          }
        | {
            data: {
              error: string
            }
            status: 400
            format: 'json'
          },
        Error
      >
    >()

    const query = client.useQuery('/users/:id', '$get', {
      input: {
        param: { id: 'none' },
      },
      options: {
        throwOnError: false,
      },
    })

    expectTypeOf<typeof query>().toEqualTypeOf<
      DefinedUseQueryResult<
        | {
            data: {
              user: {
                id: string
                name: string
              }
            }
            status: 200
            format: 'json'
          }
        | {
            data: {
              error: string
            }
            status: 400
            format: 'json'
          },
        Error
      >
    >()
  })

  it('should not contain Error in Data when throwOnError is true', () => {
    const client = createReactQueryClient<BasicHonoApp>({
      baseUrl: 'http://localhost:3000',
    })

    const queryOptions = client.queryOptions('/users/:id', '$get', {
      input: {
        param: { id: 'none' },
      },
    })

    expectTypeOf<typeof queryOptions>().toEqualTypeOf<
      DefinedInitialDataOptions<
        {
          data: {
            user: {
              id: string
              name: string
            }
          }
          status: 200
          format: 'json'
        },
        Error | HonoResponseError<{ error: string }, 400, 'json'>
      >
    >()

    const query = client.useQuery('/users/:id', '$get', {
      input: {
        param: { id: 'none' },
      },
      options: {
        throwOnError: true,
      },
    })

    expectTypeOf<typeof query>().toEqualTypeOf<
      DefinedUseQueryResult<
        {
          data: {
            user: {
              id: string
              name: string
            }
          }
          status: 200
          format: 'json'
        },
        | Error
        | HonoResponseError<
            {
              error: string
            },
            400,
            'json'
          >
      >
    >()
  })

  it('should create the query client with the correct types', () => {
    const client = createReactQueryClient<BasicHonoApp>({
      baseUrl: 'http://localhost:3000',
    })

    // /users routes
    expectTypeOf<ReturnType<typeof client.useQuery<'/users', '$get'>>>().toMatchTypeOf<
      UseQueryResult<
        { data: { users: { id: string; name: string }[] }; status: 200; format: 'json' },
        Error | HonoResponseError<{ error: string }, 400, 'json'>
      >
    >()

    expectTypeOf<ReturnType<typeof client.useMutation<'/users', '$post'>>>().toMatchTypeOf<
      UseMutationResult<
        { data: { user: { id: string; name: string } }; status: 201; format: 'json' },
        Error | HonoResponseError<{ error: string }, 400, 'json'>,
        {} | undefined
      >
    >()

    expectTypeOf<ReturnType<typeof client.useGetQueryData<'/users', '$get'>>>().toMatchTypeOf<
      () => { data: { users: { id: string; name: string }[] }; status: 200; format: 'json' }
    >()

    expectTypeOf<ReturnType<typeof client.useSetQueryData<'/users', '$post'>>>().toMatchTypeOf<
      (data: { data: { user: { id: string; name: string } }; status: 201; format: 'json' }) => {
        data: { user: { id: string; name: string } }
        status: 201
        format: 'json'
      }
    >()

    expectTypeOf<ReturnType<typeof client.useInvalidateQueries<'/users', '$get'>>>().toMatchTypeOf<
      () => void
    >()

    // /users/:id routes

    expectTypeOf<ReturnType<typeof client.useQuery<'/users/:id', '$get'>>>().toMatchTypeOf<
      UseQueryResult<
        { data: { user: { id: string; name: string } }; status: 200; format: 'json' },
        Error | HonoResponseError<{ error: string }, 400, 'json'>
      >
    >()

    expectTypeOf<ReturnType<typeof client.useGetQueryData<'/users/:id', '$get'>>>().toMatchTypeOf<
      () => { data: { user: { id: string; name: string } }; status: 200; format: 'json' }
    >()

    expectTypeOf<
      ReturnType<typeof client.useInvalidateQueries<'/users/:id', '$get'>>
    >().toMatchTypeOf<() => void>()
  })
})
