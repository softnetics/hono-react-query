import type {
  DefaultError,
  DefinedInitialDataOptions,
  DefinedUseQueryResult,
  InvalidateQueryFilters,
  UndefinedInitialDataOptions,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query'
import type { Schema } from 'hono'
import type { ClientRequest, ClientRequestOptions, ClientResponse } from 'hono/client'
import type { HonoBase } from 'hono/hono-base'
import type {
  ClientErrorStatusCode,
  ServerErrorStatusCode,
  SuccessStatusCode,
} from 'hono/utils/http-status'
import type { PartialDeep } from 'type-fest'

import type { HonoResponseError } from './error'

export type Client<T> =
  T extends HonoBase<any, infer TSchema, any>
    ? TSchema extends Record<infer TPath, Schema>
      ? TPath extends string
        ? { [K in TPath]: ClientRequest<TSchema[TPath]> }
        : never
      : never
    : never

type InferFunctionInput<T> = T extends (args: infer TArgs, ...rest: any[]) => any
  ? NoInfer<TArgs>
  : never
type InferFunctionReturn<T> = T extends (...rest: any[]) => infer TReturn ? Awaited<TReturn> : never

type ClientResponseParser<T> =
  T extends ClientResponse<infer TData, infer TStatus, infer TFormat>
    ? { data: TData; status: TStatus; format: TFormat }
    : never

type SuccessResponse<T> =
  T extends Extract<T, ClientResponse<any, SuccessStatusCode, any>>
    ? ClientResponseParser<T>
    : never

type ErrorResponse<T> =
  T extends Extract<T, { status: ClientErrorStatusCode | ServerErrorStatusCode }>
    ? HonoResponseError<
        ClientResponseParser<T>['data'],
        ClientResponseParser<T>['status'],
        ClientResponseParser<T>['format']
      >
    : never

type HonoPayloadOptions = ClientRequestOptions & { throwOnError?: boolean }
export type HonoPayload<
  TInput,
  TOptions extends HonoPayloadOptions | undefined = HonoPayloadOptions | undefined,
> = undefined extends TInput ? { options?: TOptions } : { input: TInput; options?: TOptions }

export type UseHonoQuery<TApp extends Record<string, any>> = <
  TPath extends keyof TApp,
  TMethod extends keyof TApp[TPath],
  TQueryOptions extends Omit<
    UseQueryOptions<
      SuccessResponse<InferFunctionReturn<TApp[TPath][TMethod]>>,
      ErrorResponse<InferFunctionReturn<TApp[TPath][TMethod]>> | Error
    >,
    'queryKey' | 'queryFn'
  > = Omit<
    UseQueryOptions<
      SuccessResponse<InferFunctionReturn<TApp[TPath][TMethod]>>,
      ErrorResponse<InferFunctionReturn<TApp[TPath][TMethod]>> | Error
    >,
    'queryKey' | 'queryFn'
  >,
>(
  path: TPath,
  method: TMethod,
  honoPayload: HonoPayload<InferFunctionInput<TApp[TPath][TMethod]>>,
  queryOptions?: TQueryOptions
) => 'initialData' extends keyof TQueryOptions
  ? DefinedUseQueryResult<
      SuccessResponse<InferFunctionReturn<TApp[TPath][TMethod]>>,
      ErrorResponse<InferFunctionReturn<TApp[TPath][TMethod]>> | Error
    >
  : UseQueryResult<
      SuccessResponse<InferFunctionReturn<TApp[TPath][TMethod]>>,
      ErrorResponse<InferFunctionReturn<TApp[TPath][TMethod]>> | Error
    >

export type UseHonoMutation<TApp extends Record<string, any>> = <
  TPath extends keyof TApp,
  TMethod extends keyof TApp[TPath],
  TContext = unknown,
>(
  path: TPath,
  method: TMethod,
  honoOptions?: ClientRequestOptions,
  mutationOptions?: Omit<
    UseMutationOptions<
      SuccessResponse<InferFunctionReturn<TApp[TPath][TMethod]>>,
      ErrorResponse<InferFunctionReturn<TApp[TPath][TMethod]>> | Error,
      InferFunctionInput<TApp[TPath][TMethod]>,
      TContext
    >,
    'mutationFn'
  >
) => UseMutationResult<
  SuccessResponse<InferFunctionReturn<TApp[TPath][TMethod]>>,
  ErrorResponse<InferFunctionReturn<TApp[TPath][TMethod]>> | Error,
  InferFunctionInput<TApp[TPath][TMethod]>,
  TContext
>

export type HonoQueryOptions<TApp extends Record<string, any>> = <
  TPath extends keyof TApp,
  TMethod extends keyof TApp[TPath],
  TQueryOptions extends Omit<
    UndefinedInitialDataOptions<
      SuccessResponse<InferFunctionReturn<TApp[TPath][TMethod]>>,
      ErrorResponse<InferFunctionReturn<TApp[TPath][TMethod]>> | Error
    >,
    'queryKey' | 'queryFn'
  > = Omit<
    UndefinedInitialDataOptions<
      SuccessResponse<InferFunctionReturn<TApp[TPath][TMethod]>>,
      ErrorResponse<InferFunctionReturn<TApp[TPath][TMethod]>> | Error
    >,
    'queryKey' | 'queryFn'
  >,
  TOptions extends HonoPayloadOptions | undefined = HonoPayloadOptions | undefined,
>(
  path: TPath,
  method: TMethod,
  honoPayload: HonoPayload<InferFunctionInput<TApp[TPath][TMethod]>, TOptions>,
  queryOptions?: TQueryOptions
) => 'initialData' extends keyof TQueryOptions
  ? TOptions extends { throwOnError: false }
    ? DefinedInitialDataOptions<
        ClientResponseParser<InferFunctionReturn<TApp[TPath][TMethod]>>,
        DefaultError
      >
    : DefinedInitialDataOptions<
        SuccessResponse<InferFunctionReturn<TApp[TPath][TMethod]>>,
        ErrorResponse<InferFunctionReturn<TApp[TPath][TMethod]>> | Error
      >
  : TOptions extends { throwOnError: false }
    ? UndefinedInitialDataOptions<
        ClientResponseParser<InferFunctionReturn<TApp[TPath][TMethod]>>,
        DefaultError
      >
    : UndefinedInitialDataOptions<
        SuccessResponse<InferFunctionReturn<TApp[TPath][TMethod]>>,
        ErrorResponse<InferFunctionReturn<TApp[TPath][TMethod]>> | Error
      >

export type HonoMutationOptions<TApp extends Record<string, any>> = <
  TPath extends keyof TApp,
  TMethod extends keyof TApp[TPath],
  TContext = unknown,
>(
  path: TPath,
  method: TMethod,
  honoOptions?: ClientRequestOptions,
  mutationOptions?: Omit<
    UseMutationOptions<
      SuccessResponse<InferFunctionReturn<TApp[TPath][TMethod]>>,
      ErrorResponse<InferFunctionReturn<TApp[TPath][TMethod]>> | Error,
      InferFunctionInput<TApp[TPath][TMethod]>,
      TContext
    >,
    'mutationFn'
  >
) => UseMutationOptions<
  SuccessResponse<InferFunctionReturn<TApp[TPath][TMethod]>>,
  ErrorResponse<InferFunctionReturn<TApp[TPath][TMethod]>> | Error,
  InferFunctionInput<TApp[TPath][TMethod]>,
  TContext
>

export type UseHonoGetQueryData<TApp extends Record<string, any>> = <
  TPath extends keyof TApp,
  TMethod extends keyof TApp[TPath],
>(
  path: TPath,
  method: TMethod,
  honoPayload: HonoPayload<InferFunctionInput<TApp[TPath][TMethod]>>
) => () => SuccessResponse<InferFunctionReturn<TApp[TPath][TMethod]>>

export type UseHonoSetQueryData<TApp extends Record<string, any>> = <
  TPath extends keyof TApp,
  TMethod extends keyof TApp[TPath],
>(
  path: TPath,
  method: TMethod,
  honoPayload: HonoPayload<InferFunctionInput<TApp[TPath][TMethod]>>
) => (
  data: SuccessResponse<InferFunctionReturn<TApp[TPath][TMethod]>>
) => SuccessResponse<InferFunctionReturn<TApp[TPath][TMethod]>>

export type UseHonoInvalidateQueries<TApp extends Record<string, any>> = <
  TPath extends keyof TApp,
  TMethod extends keyof TApp[TPath],
>(
  path: TPath,
  method: TMethod,
  honoPayload?: HonoPayload<PartialDeep<InferFunctionInput<TApp[TPath][TMethod]>>>,
  hookOptions?: Omit<InvalidateQueryFilters<any>, 'queryKey'>
) => () => void

export type UseHonoOptimisticUpdateQuery<TApp extends Record<string, any>> = <
  TPath extends keyof TApp,
  TMethod extends keyof TApp[TPath],
>(
  path: TPath,
  method: TMethod,
  honoPayload: HonoPayload<InferFunctionInput<TApp[TPath][TMethod]>>
) => (
  updater: (
    prev: SuccessResponse<InferFunctionReturn<TApp[TPath][TMethod]>> | undefined
  ) => SuccessResponse<InferFunctionReturn<TApp[TPath][TMethod]>>
) =>
  | {
      previous: SuccessResponse<InferFunctionReturn<TApp[TPath][TMethod]>> | undefined
      updated: SuccessResponse<InferFunctionReturn<TApp[TPath][TMethod]>> | undefined
      revert: () => void
    }
  | undefined

export type ReactQueryClient<TApp extends Record<string, any>> = {
  useQuery: UseHonoQuery<TApp>
  useMutation: UseHonoMutation<TApp>
  queryOptions: HonoQueryOptions<TApp>
  mutationOptions: HonoMutationOptions<TApp>
  useGetQueryData: UseHonoGetQueryData<TApp>
  useSetQueryData: UseHonoSetQueryData<TApp>
  useInvalidateQueries: UseHonoInvalidateQueries<TApp>
  useOptimisticUpdateQuery: UseHonoOptimisticUpdateQuery<TApp>
}

export type InferUseHonoQuery<TQuery extends UseQueryResult<any, any>> =
  TQuery extends UseQueryResult<infer TData, any> ? TData : never
