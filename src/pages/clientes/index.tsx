import { useEffect, useMemo, useState } from "react"

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"

import { ArrowUpDown, History } from "lucide-react"

import { AppLayout } from "@/components/AppLayout"
import { CustomerHistorySheet } from "@/components/CustomerHistorySheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { listCustomers } from "@/services/customers"
import { formatDate, showApiError } from "@/lib/utils-api"
import { useTenant } from "@/contexts/TenantContext"
import type { Customer } from "@/types"

export function ClientesPage() {
  const { tenant } = useTenant()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ])
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    listCustomers()
      .then((response) => {
        setCustomers(response.data)
      })
      .catch((error) => {
        showApiError(error, "Erro ao carregar clientes")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return customers
    }

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.phone.includes(query)
    )
  }, [customers, search])

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 flex"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Nome
            <ArrowUpDown className="size-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.name}
          </span>
        ),
      },

      {
        accessorKey: "phone",
        header: "Telefone",
        cell: ({ row }) => (
          <a
            href={`tel:${row.original.phone}`}
            className="hover:underline"
          >
            {row.original.phone}
          </a>
        ),
      },

      {
        accessorKey: "appointmentsCount",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 flex"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Agendamentos
            <ArrowUpDown className="size-3.5" />
          </Button>
        ),
      },

      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 flex"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Cliente desde
            <ArrowUpDown className="size-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },

      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setHistoryCustomer(row.original)
                setHistoryOpen(true)
              }}
            >
              <History className="size-3.5" />
              Histórico
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: filtered,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  })

  const rows = table.getRowModel().rows

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Clientes
          </h1>

          <p className="text-sm text-muted-foreground">
            Quem já agendou na sua barbearia.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:w-72"
            />

            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>

                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center text-sm text-muted-foreground"
                      >
                        Nenhum cliente encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Página {table.getState().pagination.pageIndex + 1} de{" "}
                {Math.max(table.getPageCount(), 1)} ({filtered.length}{" "}
                cliente(s))
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Anterior
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <CustomerHistorySheet
        customer={historyCustomer}
        timezone={tenant?.timezone ?? "America/Sao_Paulo"}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </AppLayout>
  )
}