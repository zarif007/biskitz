import React, { Dispatch, SetStateAction } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ModelSelectorProps {
  setModelType: Dispatch<SetStateAction<'HIGH' | 'MID'>>
  disabled: boolean
  defaultValue: 'HIGH' | 'MID'
}

const ModelSelector = ({
  setModelType,
  disabled,
  defaultValue,
}: ModelSelectorProps) => {
  return (
    <div>
      <Select
        value={defaultValue.toLowerCase()}
        onValueChange={(value) => setModelType(value as 'HIGH' | 'MID')}
      >
        <SelectTrigger
          className="w-[100px] h-9 text-xs focus:ring-0 focus:ring-offset-0 outline-none ring-0 cursor-pointer border-0 font-bold bg-slate-100 dark:bg-black"
          disabled={disabled}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="high" className="text-xs flex items-center gap-2">
            <svg
              className="inline-block w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <rect x="3" y="14" width="3" height="7" fill="currentColor" />
              <rect x="8" y="11" width="3" height="10" fill="currentColor" />
              <rect x="13" y="8" width="3" height="13" fill="currentColor" />
            </svg>
            High
          </SelectItem>
          <SelectItem value="mid" className="text-xs flex items-center gap-2">
            <svg
              className="inline-block w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <rect
                x="3"
                y="14"
                width="3"
                height="7"
                fill="currentColor"
                opacity="currentColor"
              />
              <rect x="8" y="11" width="3" height="10" fill="currentColor" />
              <rect
                x="13"
                y="8"
                width="3"
                height="13"
                fill="currentColor"
                opacity="0.35"
              />
            </svg>
            Mid
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export default ModelSelector
