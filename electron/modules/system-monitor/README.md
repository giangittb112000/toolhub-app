# System Monitor Module

## Overview

This is a Core ToolHub Desktop module that runs entirely in the Electron Main process. It provides real-time OS-level telemetry data.

## Features

- **CPU Delta Calculation**: Accurately measures live CPU usage by sampling `os.cpus()` on a continuous differential basis.
- **Memory Stats**: Real-time snapshot of system total memory and current available memory via `os.totalmem()` and `os.freemem()`.
- **Uptime**: Reports both Machine OS uptime and Electron Application uptime.

## IPC Channels

- **`monitor:get-stats`**: Called synchronously. Responds with the `SystemStats` interface payload to be painted by the React dashboard.
