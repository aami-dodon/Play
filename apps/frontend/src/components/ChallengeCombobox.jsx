import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const ALL_CHALLENGES_VALUE = "__all";
const ALL_CHALLENGES_LABEL = "All challenges";

export default function ChallengeCombobox({
  value,
  onValueChange,
  options = [],
  placeholder = "Search challenge...",
  triggerClassName,
}) {
  const [open, setOpen] = useState(false);

  const normalizedOptions = useMemo(
    () => options.map((option) => ({ label: option.label || option.value, value: option.value })),
    [options]
  );

  const selectedLabel = useMemo(() => {
    if (!value) return ALL_CHALLENGES_LABEL;
    const found = normalizedOptions.find((option) => option.value === value);
    return found ? found.label : value;
  }, [value, normalizedOptions]);

  const handleSelect = (currentValue) => {
    const normalizedValue = currentValue === ALL_CHALLENGES_VALUE ? "" : currentValue;
    onValueChange(normalizedValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          size="sm"
          className={cn("w-full justify-between rounded-full lg:w-64", triggerClassName)}
        >
          {selectedLabel}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No challenge found.</CommandEmpty>
            <CommandGroup heading="Challenges">
              <CommandItem
                value={ALL_CHALLENGES_VALUE}
                onSelect={handleSelect}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 size-4",
                    value === "" ? "opacity-100" : "opacity-0"
                  )}
                />
                {ALL_CHALLENGES_LABEL}
              </CommandItem>
              {normalizedOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
