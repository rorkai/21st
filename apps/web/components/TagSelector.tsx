"use client"

import React, { useState } from "react"

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

interface TagSelectorProps<T> {
  availableTags: T[]
  selectedTags: T[]
  onChange: (tags: T[]) => void
  getValue: (tag: T) => string
  getLabel: (tag: T) => string
  createTag: (inputValue: string) => T
  className?: string
}

export function TagSelector<T>({
  availableTags,
  selectedTags,
  onChange,
  getValue,
  getLabel,
  createTag,
  className,
}: TagSelectorProps<T>) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")

  const filteredTags = availableTags.filter(
    (tag) =>
      getLabel(tag).toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedTags.some((selected) => getValue(selected) === getValue(tag)),
  )

  const handleSelect = (value: string) => {
    const existingTag = availableTags.find((tag) => getValue(tag) === value)
    if (existingTag) {
      onChange([...selectedTags, existingTag])
    }
    setInputValue("")
  }

  const handleCreate = () => {
    const newTag = createTag(inputValue)
    onChange([...selectedTags, newTag])
    setInputValue("")
  }

  const handleRemove = (value: string) => {
    onChange(selectedTags.filter((tag) => getValue(tag) !== value))
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "flex flex-wrap gap-[2px] mt-1 py-[2px] pl-[2px] pr-3 h-auto w-full text-left items-center justify-start min-h-9",
            className,
            selectedTags.length > 0 && "hover:bg-background",
          )}
        >
          {selectedTags.map((tag) => (
            <span
              key={getValue(tag)}
              className="flex items-center gap-1 rounded bg-secondary px-2 py-1 text-sm break-words"
            >
              {getLabel(tag)}
              <button
                type="button"
                className="cursor-pointer hover:bg-red-400/40 p-0.5 rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove(getValue(tag))
                }}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <span className="flex-grow" />
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Enter tag..."
            value={inputValue}
            onValueChange={(value) => setInputValue(value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && inputValue.trim() !== "") {
                handleCreate()
              }
            }}
          />
          <CommandList>
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup heading="Tags">
              {filteredTags.map((tag) => (
                <CommandItem
                  key={getValue(tag)}
                  value={getValue(tag)}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedTags.some(
                        (selected) => getValue(selected) === getValue(tag),
                      )
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {getLabel(tag)}
                </CommandItem>
              ))}
            </CommandGroup>
            {inputValue.trim() !== "" &&
              !availableTags.some(
                (tag) =>
                  getLabel(tag).toLowerCase() === inputValue.toLowerCase(),
              ) && (
                <CommandGroup heading="Create Tag">
                  <CommandItem value={inputValue} onSelect={handleCreate}>
                    <Check className="mr-2 h-4 w-4 opacity-100" />
                    Create "{inputValue}"
                  </CommandItem>
                </CommandGroup>
              )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
