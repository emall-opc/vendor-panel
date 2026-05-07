import { FetchError } from "@medusajs/js-sdk"
import { HttpTypes } from "@medusajs/types"
import { UseMutationOptions, useMutation } from "@tanstack/react-query"
import { fetchQuery, sdk, selectedSellerStorageKey } from "../../lib/client"

type SellerMemberListResponse = {
  seller_members?: Array<{
    seller_id?: string
    seller?: {
      id?: string
    }
  }>
}

const syncDefaultSeller = async () => {
  const response = (await fetchQuery("/vendor/sellers", {
    method: "GET",
  })) as SellerMemberListResponse

  const sellerId =
    response.seller_members?.[0]?.seller_id ||
    response.seller_members?.[0]?.seller?.id

  if (!sellerId) {
    window.localStorage.removeItem(selectedSellerStorageKey)
    return
  }

  window.localStorage.setItem(selectedSellerStorageKey, sellerId)

  await fetchQuery("/vendor/sellers/select", {
    method: "POST",
    body: {
      seller_id: sellerId,
    },
  })
}

export const useSignInWithEmailPass = (
  options?: UseMutationOptions<
    | string
    | {
        location: string
      },
    FetchError,
    HttpTypes.AdminSignUpWithEmailPassword
  >
) => {
  return useMutation({
    ...options,
    mutationFn: (payload) => sdk.auth.login("member", "emailpass", payload),
    onSuccess: async (data, variables, context) => {
      await syncDefaultSeller()
      options?.onSuccess?.(data, variables, context)
    },
  })
}

export const useSignUpWithEmailPass = (
  options?: UseMutationOptions<
    string,
    FetchError,
    HttpTypes.AdminSignInWithEmailPassword & {
      confirmPassword: string
      name: string
    }
  >
) => {
  return useMutation({
    ...options,
    mutationFn: (payload) => sdk.auth.register("member", "emailpass", payload),
    onSuccess: async (data, variables, context) => {
      const seller = {
        name: variables.name,
        email: variables.email,
        member_email: variables.email,
        currency_code: "usd",
      }
      await fetchQuery("/vendor/sellers", {
        method: "POST",
        body: seller,
      })
      await syncDefaultSeller()
      options?.onSuccess?.(data, variables, context)
    },
  })
}

export const useSignUpForInvite = (
  options?: UseMutationOptions<
    string,
    FetchError,
    HttpTypes.AdminSignInWithEmailPassword
  >
) => {
  return useMutation({
    ...options,
    mutationFn: (payload) => sdk.auth.register("member", "emailpass", payload),
  })
}

export const useResetPasswordForEmailPass = (
  options?: UseMutationOptions<void, FetchError, { email: string }>
) => {
  return useMutation({
    ...options,
    mutationFn: (payload) =>
      sdk.auth.resetPassword("member", "emailpass", {
        identifier: payload.email,
      }),
    onSuccess: async (data, variables, context) => {
      options?.onSuccess?.(data, variables, context)
    },
  })
}

export const useLogout = (options?: UseMutationOptions<void, FetchError>) => {
  return useMutation({
    ...options,
    mutationFn: () => sdk.auth.logout(),
    onSuccess: async (data, variables, context) => {
      window.localStorage.removeItem(selectedSellerStorageKey)
      options?.onSuccess?.(data, variables, context)
    },
  })
}

export const useUpdateProviderForEmailPass = (
  token: string,
  options?: UseMutationOptions<void, FetchError, { password: string }>
) => {
  return useMutation({
    ...options,
    mutationFn: (payload) =>
      sdk.auth.updateProvider("member", "emailpass", payload, token),
    onSuccess: async (data, variables, context) => {
      options?.onSuccess?.(data, variables, context)
    },
  })
}
