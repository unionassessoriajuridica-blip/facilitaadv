import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface FinanceiroFiltroClienteProps {
    clientes: { nome: string }[]
    value: string
    onChange: (value: string) => void
}

export function FinanceiroFiltroCliente({
    clientes,
    value,
    onChange,
}: FinanceiroFiltroClienteProps) {
    const [open, setOpen] = React.useState(false)

    const selectedCliente = clientes.find((c) => c.nome === value)

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Cliente:</label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between font-normal"
                    >
                        {value === "TODOS" ? "Todos os Clientes" : value}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Pesquisar cliente..." />
                        <CommandList>
                            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                    value="TODOS"
                                    onSelect={() => {
                                        onChange("TODOS")
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === "TODOS" ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    Todos os Clientes
                                </CommandItem>
                                {clientes.map((cliente) => (
                                    <CommandItem
                                        key={cliente.nome}
                                        value={cliente.nome}
                                        onSelect={(currentValue) => {
                                            // O cmdk passa o valor em lowercase por padrão no onSelect se não for mapeado
                                            // Mas aqui estamos usando o nome original. 
                                            // Para garantir o valor correto, usamos o nome do objeto cliente.
                                            onChange(cliente.nome)
                                            setOpen(false)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === cliente.nome ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {cliente.nome}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}
