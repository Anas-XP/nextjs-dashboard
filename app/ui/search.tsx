"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useDebouncer } from "@tanstack/react-pacer";
import clsx from "clsx";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function Search({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  // ---
  const searcher = useDebouncer(
    (term: string) => {
      const params = new URLSearchParams(searchParams);
      console.log(term);

      params.set("page", "1");

      if (!term) params.delete("query");

      if (term) params.set("query", term);

      router.replace(`${pathname}?${params.toString()}`);
    },
    {
      wait: 500,
    },
    (state) => ({ isPending: state.isPending }),
  );

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className={clsx(
          "peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500",
          {
            "!border-yellow-400 !outline-yellow-400 focus:!border-yellow-400 focus:!outline-yellow-400":
              searcher.state.isPending,
          },
        )}
        placeholder={placeholder}
        // ---
        defaultValue={searchParams.get("query")?.toString()}
        onChange={(e) => {
          searcher.maybeExecute(e.target.value);
        }}
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}
