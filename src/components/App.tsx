import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Command } from "cmdk";
import "./App.scss";

type TrpcResponse<T> = {
    result: T;
};

type getHomeItemsResp = {
    result: {
        data: {
            vals: ValRef[];
        };
    };
};

type getValResp = TrpcResponse<{
    data: FullVal;
}>

type ValRef = {
    id: string;
    name: string;
};

type FullVal = {
    id: string;
    name: string;
    user: {
        handle: string;
    }
}

function fetchApi<D>(method: string, input: any) {
    return fetch(
        `https://www.val.town/api/trpc/${method}?input=${encodeURIComponent(
            JSON.stringify(input)
        )}`
    ).then((res) => res.json()) as Promise<D>;
}

const CommandPalette = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const { data } = useQuery({
        queryKey: ["homeItems"],
        queryFn: () => fetchApi<getHomeItemsResp>("getHomeItems", { folderId: null })
    });

    // toggle command palette on cmd+shift+k
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "k" && e.shiftKey && (e.metaKey || e.ctrlKey)) {
                setIsOpen(!isOpen);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    })

    return (
        <Command.Dialog open={isOpen} onOpenChange={setIsOpen}>
            <Command.Input onKeyDown={
                (e) => {
                    if (e.key === "Escape") {
                        setIsOpen(false);
                    }

                    // prevent default behavior of opening the pin view
                    if (e.key === "n" && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
                        e.stopPropagation();
                    }
                }
            } />
            <Command.List>
                <Command.Empty>No results found.</Command.Empty>
                {data?.result.data.vals.map((valRef) => (
                    <Command.Item key={valRef.id} onSelect={
                        async () => {
                            const res = await fetchApi<getValResp>("getVal", { valNameId: valRef.id });
                            const val = res.result.data;
                            window.location.href = `https://www.val.town/v/${val.user.handle}/${val.name}`;
                        }
                    }>{valRef.name}</Command.Item>
                ))}
            </Command.List>
        </Command.Dialog>
    );
};

const queryClient = new QueryClient();
const App = () => {
    return <QueryClientProvider client={queryClient}>
        <CommandPalette />
    </QueryClientProvider>
}

export default App;
