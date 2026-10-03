import { atom } from "nanostores"
import { getActiveCustomer } from "@/lib/vendure/queries/customers"
import { logoutCustomer } from "@/lib/vendure/mutations/customers"
import type { GetActiveCustomerQuery } from "@/lib/vendure/generated/graphql"

export type ActiveCustomer = NonNullable<GetActiveCustomerQuery["activeCustomer"]>

export interface AuthState {
  customer: ActiveCustomer | null
  loading: boolean
  initialized: boolean
}

export const $currentUser = atom<AuthState>({
  customer: null,
  loading: true,
  initialized: false,
})

export async function fetchCurrentUser(): Promise<ActiveCustomer | null> {
  $currentUser.set({
    ...$currentUser.get(),
    loading: true,
  })

  try {
    const customer = await getActiveCustomer()
    $currentUser.set({
      customer: customer ?? null,
      loading: false,
      initialized: true,
    })
    return customer ?? null
  } catch (error) {
    console.error("Failed to fetch active customer:", error)
    $currentUser.set({
      customer: null,
      loading: false,
      initialized: true,
    })
    return null
  }
}

export async function signOut(): Promise<boolean> {
  try {
    await logoutCustomer()
  } catch (error) {
    console.error("Failed to log out from Vendure:", error)
  } finally {
    $currentUser.set({
      customer: null,
      loading: false,
      initialized: true,
    })
  }
  return true
}
