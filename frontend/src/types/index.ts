export type Role = 'super_admin' | 'admin' | 'member'
export type MealPlanType = 'weekly' | 'monthly' | 'custom'

export interface User {
  id: number
  name: string
  username: string
  email: string | null
  phone: string | null
  role: Role
  role_label: string
  is_active: boolean
  joined_at: string | null
}

export interface MealPlanSummaryMember {
  user: Pick<User, 'id' | 'name' | 'username'>
  taken_lunches: number
  skipped_lunches: number
  taken_dinners: number
  skipped_dinners: number
  taken_meals: number
}

export interface MealPlanSummaryDay {
  date: string
  taken_lunches: number
  skipped_lunches: number
  taken_dinners: number
  skipped_dinners: number
}

export interface MealPlanSummary {
  member_count: number
  tracked_days: number
  totals: {
    taken_lunches: number
    skipped_lunches: number
    taken_dinners: number
    skipped_dinners: number
    taken_meals: number
  }
  members: MealPlanSummaryMember[]
  days: MealPlanSummaryDay[]
}

export interface MealPlan {
  id: number
  name: string
  type: MealPlanType
  type_label: string
  start_date: string
  end_date: string
  notes: string | null
  meal_statuses_count: number
  grocery_items_count: number
  created_by: {
    id: number
    name: string
    username: string
  } | null
  current_admin: {
    id: number
    name: string
    username: string
  } | null
  groceries: {
    total_spend: number
    item_count: number
    items: GroceryItem[]
  }
  summary?: MealPlanSummary | null
}

export interface GroceryItem {
  id: number
  meal_plan: {
    id: number
    name: string
    type: MealPlanType
    start_date: string
    end_date: string
  } | null
  member: {
    id: number
    name: string
    username: string
  } | null
  catalog_item: GroceryCatalogItem | null
  title: string
  category: string | null
  quantity: number
  unit: string | null
  price: number
  purchased_on: string
  notes: string | null
  added_by: {
    id: number
    name: string
    username: string
  } | null
}

export interface GroceryCatalogItem {
  id: number
  name: string
  category: string | null
  default_unit: string | null
  sort_order: number
  is_active: boolean
  created_by: {
    id: number
    name: string
    username: string
  } | null
}

export interface MealStatus {
  id: number
  meal_date: string
  skip_lunch: boolean
  skip_dinner: boolean
  lunch_status: 'taken' | 'skipped'
  dinner_status: 'taken' | 'skipped'
  can_edit: boolean
  can_edit_lunch: boolean
  can_edit_dinner: boolean
  meal_plan: {
    id: number
    name: string
    type: MealPlanType
  } | null
}

export interface MealStatusMeta {
  selected_user: {
    id: number
    name: string
    username: string
  }
  meal_plan: {
    id: number
    name: string
    type: MealPlanType
    start_date: string
    end_date: string
  } | null
}

export interface AdminDashboardData {
  counts: {
    members: number
    admins: number
    active_members: number
    meal_plans: number
  }
  today: {
    lunches: number
    dinners: number
    total_meals: number
  }
  current_admin: {
    id: number
    name: string
    username: string
  } | null
  groceries: {
    monthly_spend: number
    recent: Array<{
      id: number
      title: string
      price: number
      purchased_on: string
      added_by: string | null
    }>
  }
  active_plan: {
    id: number
    name: string
    type: MealPlanType
    start_date: string
    end_date: string
    grocery_total_spend: number
    grocery_items_count: number
    summary: MealPlanSummary
  } | null
}

export interface MemberDashboardData {
  active_plan: {
    id: number
    name: string
    type: MealPlanType
    start_date: string
    end_date: string
  } | null
  summary: {
    taken_lunches: number
    skipped_lunches: number
    taken_dinners: number
    skipped_dinners: number
    taken_meals: number
    meal_rate: number
    meal_cost: number
    upcoming_skips: number
  }
  upcoming: Array<{
    id: number
    meal_date: string
    skip_lunch: boolean
    skip_dinner: boolean
  }>
}

export interface MonthlyFinanceSummary {
  month: string
  period: {
    start_date: string
    end_date: string
  }
  totals: {
    total_gross: number
    total_members: number
    per_head_expense: number
    total_meals: number
    meal_rate: number
    total_paid: number
    total_due: number
  }
  members: Array<{
    user: Pick<User, 'id' | 'name' | 'username' | 'role' | 'role_label'>
    taken_lunches: number
    taken_dinners: number
    taken_meals: number
    paid_amount: number
    payable_amount: number
    due_amount: number
    advance_amount: number
    carried_advance_amount: number
    advance_used_amount: number
  }>
  groceries: Array<{
    id: number
    title: string
    category: string | null
    quantity: number
    unit: string | null
    price: number
    purchased_on: string
    notes: string | null
    member: Pick<User, 'id' | 'name' | 'username'> | null
    added_by: Pick<User, 'id' | 'name' | 'username'> | null
  }>
  payments: Array<{
    id: number
    amount: number
    paid_on: string
    notes: string | null
    user: Pick<User, 'id' | 'name' | 'username'> | null
    recorded_by: Pick<User, 'id' | 'name' | 'username'> | null
  }>
  eligible_members: Array<Pick<User, 'id' | 'name' | 'username' | 'role' | 'role_label'>>
}
