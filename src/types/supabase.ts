export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            menu_items: {
                Row: {
                    id: string
                    created_at: string
                    name: string
                    price: number
                    category: string
                    emoji: string
                    is_available: boolean
                }
                Insert: {
                    id?: string
                    created_at?: string
                    name: string
                    price: number
                    category: string
                    emoji: string
                    is_available?: boolean
                }
                Update: {
                    id?: string
                    created_at?: string
                    name?: string
                    price?: number
                    category?: string
                    emoji?: string
                    is_available?: boolean
                }
            }
            tabs: {
                Row: {
                    id: string
                    created_at: string
                    table_number: number | null
                    customer_name: string | null
                    total: number
                    status: 'open' | 'closed'
                    payment_method: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    table_number?: number | null
                    customer_name?: string | null
                    total?: number
                    status?: 'open' | 'closed'
                    payment_method?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    table_number?: number | null
                    customer_name?: string | null
                    total?: number
                    status?: 'open' | 'closed'
                    payment_method?: string | null
                }
            }
            tab_items: {
                Row: {
                    id: string
                    tab_id: string
                    menu_item_id: string
                    quantity: number
                    status: 'pending' | 'sent' | 'ready' | 'served'
                    created_at: string
                    notes: string | null
                    seat_number: number | null
                }
                Insert: {
                    id?: string
                    tab_id: string
                    menu_item_id: string
                    quantity: number
                    status?: 'pending' | 'sent' | 'ready' | 'served'
                    created_at?: string
                    notes?: string | null
                    seat_number?: number | null
                }
                Update: {
                    id?: string
                    tab_id?: string
                    menu_item_id?: string
                    quantity?: number
                    status?: 'pending' | 'sent' | 'ready' | 'served'
                    created_at?: string
                    notes?: string | null
                    seat_number?: number | null
                }
            }
        }
    }
}
