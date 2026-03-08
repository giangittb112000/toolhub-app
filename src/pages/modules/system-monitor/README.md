# System Monitor (Frontend Module)

A real-time analytics dashboard rendering live system performance and resource utilization metrics polled from the host system.

## Features

- **CPU Metrics**: Live CPU core usage visualization displaying detailed load distributions across multiple physical and logical cores. Responsive grids adapt perfectly for 4, 8, 16+ core configurations.
- **Memory Analytics**: High-quality visual ring charts created via `recharts` presenting system Total vs Used RAM allocation in real-time.
- **Disk Usage**: Overview statistics exposing OS drive metrics.
- **Connection Health**: Top bar visual indicator reflecting the connection loop health with the generic Electron polling routine.

## Architecture & Data Flow

This module is a continuous consumer of OS-level data packets:

- **Loop Sync**: Implements `useEffect` localized recursive loops polling the API across defined periodic intervals (e.g., typically `1000ms`).
- **Target Channels**: Uses `window.electron.invoke(IPC_CHANNELS.MONITOR.GET_STATS)` to fetch aggregated payload snapshots.
- **UI State**: Utilizes native React state arrays mapping to complex charting elements (`recharts` ResponsiveContainer, Tooltip, Pie/Cell definitions for smooth GPU-accelerated drawing).
