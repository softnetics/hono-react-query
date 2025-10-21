import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ClientRequestOptions, Hono } from 'hono'
import { type ClientRequest, hc } from 'hono/client'
import { useCallback } from 'hono/jsx'
import type { UnionToIntersection } from 'hono/utils/types'

import { HonoResponseError, isHonoResponseError } from './error'
import { createQueryKey } from './query-key'
import {
  type Client,
  type HonoMutationOptions,
  type HonoQueryOptions,
  type InferUseHonoQuery,
  type ReactQueryClient,
  type UseHonoGetQueryData,
  type UseHonoInvalidateQueries,
  type UseHonoMutation,
  type UseHonoOptimisticUpdateQuery,
  type UseHonoQuery,
  type UseHonoSetQueryData,
} from './types'

interface CreateReactQueryClientOptions extends ClientRequestOptions {
  baseUrl: string
}

function createReactQueryClient<T extends Hono>(
  options: CreateReactQueryClientOptions
): ReactQueryClient<
  UnionToIntersection<Client<T>> extends Record<string, any>
    ? UnionToIntersection<Client<T>>
    : never
> {
  const client = hc(options.baseUrl, options)

  return {
    useQuery: useQueryFactory(client),
    useMutation: useMutationFactory(client),
    queryOptions: queryOptionsFactory(client),
    mutationOptions: mutationOptionsFactory(client),
    useGetQueryData: useGetQueryDataFactory(),
    useSetQueryData: useSetQueryDataFactory(),
    useInvalidateQueries: useInvalidateQueriesFactory(),
    useOptimisticUpdateQuery: useOptimisticUpdateQueryFactory(),
  } as ReactQueryClient<
    UnionToIntersection<Client<T>> extends Record<string, any>
      ? UnionToIntersection<Client<T>>
      : never
  >
}

function getter(obj: object, paths: string[]): any {
  return paths.reduce((acc, path) => {
    return acc[path as keyof typeof acc]
  }, obj)
}

async function responseParser(response: Response): Promise<any> {
  let data: any
  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    data = await response.json()
  } else if (contentType?.includes('text/plain')) {
    data = await response.text()
  } else {
    data = await response.text()
  }

  const res = {
    data,
    status: response.status,
    format: contentType?.includes('application/json')
      ? 'json'
      : contentType?.includes('text/plain')
        ? 'text'
        : 'body',
  }

  if (response.ok) {
    return res
  } else {
    throw new HonoResponseError(res)
  }
}

function useQueryFactory<T extends Record<string, any>>(
  client: Record<string, ClientRequest<any>>
): UseHonoQuery<T> {
  return ((path, method, honoPayload, hookOptions) => {
    return useQuery(
      queryOptionsFactory(client)(path.toString(), method, honoPayload as any, hookOptions as any)
    )
  }) as UseHonoQuery<T>
}

function queryOptionsFactory<T extends Record<string, any>>(
  client: Record<string, ClientRequest<any>>
): HonoQueryOptions<T> {
  return (path, method, honoPayload, hookOptions) => {
    const paths = [...path.toString().split('/').filter(Boolean), method.toString()]
    const handler = getter(client, paths)
    const payload = (honoPayload as any)?.input ?? {}

    return queryOptions({
      queryKey: createQueryKey(
        method.toString(),
        path.toString(),
        Object.keys(payload).length > 0 ? payload : undefined
      ),
      queryFn: async () => {
        const response = await handler(payload, honoPayload.options)
        return responseParser(response)
      },
      ...hookOptions,
    })
  }
}

function useMutationFactory<T extends Record<string, any>>(
  client: Record<string, ClientRequest<any>>
): UseHonoMutation<T> {
  return ((path, method, honoOptions, hookOptions) => {
    return useMutation(
      mutationOptionsFactory(client)(path.toString(), method, honoOptions, hookOptions as any)
    )
  }) as UseHonoMutation<T>
}

function mutationOptionsFactory<T extends Record<string, any>>(
  client: Record<string, ClientRequest<any>>
): HonoMutationOptions<T> {
  return ((path, method, honoOptions, hookOptions) => {
    const paths = [...path.toString().split('/').filter(Boolean), method.toString()]
    const handler = getter(client, paths)
    return {
      mutationFn: async (payload) => {
        const result = await handler(payload, honoOptions)
        return responseParser(result)
      },
      ...hookOptions,
    }
  }) as HonoMutationOptions<T>
}

function useGetQueryDataFactory<T extends Record<string, any>>(): UseHonoGetQueryData<T> {
  return ((path, method, honoPayload) => {
    const paths = [...path.toString().split('/').filter(Boolean), method.toString()]
    const payload = (honoPayload as any)?.input ?? {}
    const queryClient = useQueryClient()
    return useCallback(
      () => queryClient.getQueryData(createQueryKey(method.toString(), path.toString(), payload)),
      [queryClient, paths, payload]
    )
  }) as UseHonoGetQueryData<T>
}

function useSetQueryDataFactory<T extends Record<string, any>>(): UseHonoSetQueryData<T> {
  return ((path, method, honoPayload) => {
    const payload = (honoPayload as any)?.input ?? {}
    const queryClient = useQueryClient()
    return useCallback(
      (data) =>
        queryClient.setQueryData(createQueryKey(method.toString(), path.toString(), payload), data),
      [queryClient]
    )
  }) as UseHonoSetQueryData<T>
}

function useInvalidateQueriesFactory<T extends Record<string, any>>() {
  return ((path, method, honoPayload, hookOptions) => {
    const paths = [...path.toString().split('/').filter(Boolean), method.toString()]
    const queryClient = useQueryClient()

    // If no payload is provided, invalidate all queries with this method and path
    const payload = (honoPayload as any)?.input ?? {}

    return useCallback(
      () =>
        queryClient.invalidateQueries({
          queryKey: createQueryKey(
            method.toString(),
            path.toString(),
            Object.keys(payload).length > 0 ? payload : undefined
          ),
          ...hookOptions,
        }),
      [queryClient, paths, payload]
    )
  }) as UseHonoInvalidateQueries<T>
}

function useOptimisticUpdateQueryFactory<T extends Record<string, any>>() {
  return ((path, method, honoPayload) => {
    const paths = [...path.toString().split('/').filter(Boolean), method.toString()]
    const payload = (honoPayload as any)?.input ?? {}
    const queryClient = useQueryClient()
    return useCallback(
      (updater) => {
        const key = createQueryKey(method.toString(), path.toString(), payload)
        const prev = queryClient.getQueryData(key)
        const updated = updater(prev as any)
        const revert = () => queryClient.setQueryData(key, prev)
        queryClient.setQueryData(key, updated)
        return { previous: prev, updated, revert }
      },
      [queryClient, paths, payload]
    )
  }) as UseHonoOptimisticUpdateQuery<T>
}

export {
  createQueryKey,
  createReactQueryClient,
  HonoResponseError,
  type InferUseHonoQuery,
  isHonoResponseError,
}
