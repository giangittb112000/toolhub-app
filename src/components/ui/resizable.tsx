import { GripVertical } from "lucide-react";
import {
  Group,
  type GroupProps,
  Panel,
  Separator,
  type SeparatorProps,
} from "react-resizable-panels";

const ResizablePanelGroup = ({ className, ...props }: GroupProps) => (
  <Group
    className={`flex h-full w-full data-[panel-group-orientation=vertical]:flex-col ${className}`}
    {...props}
  />
);

const ResizablePanel = Panel;

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: SeparatorProps & {
  withHandle?: boolean;
}) => (
  <Separator
    className={`relative flex w-px items-center justify-center bg-white/5 after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-orientation=vertical]:h-px data-[panel-group-orientation=vertical]:w-full data-[panel-group-orientation=vertical]:after:left-0 data-[panel-group-orientation=vertical]:after:h-1 data-[panel-group-orientation=vertical]:after:w-full data-[panel-group-orientation=vertical]:after:-translate-y-1/2 data-[panel-group-orientation=vertical]:after:translate-x-0 [&[data-panel-group-orientation=vertical]>div]:rotate-90 hover:bg-white/20 transition-colors cursor-col-resize active:bg-blue-500/50 ${className}`}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-zinc-800 border-zinc-700 shadow-sm">
        <GripVertical className="h-2.5 w-2.5 text-zinc-400" />
      </div>
    )}
  </Separator>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
