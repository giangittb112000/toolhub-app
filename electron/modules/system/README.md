# System Module

## Overview

A critical Electron module responsible for application metadata and deployment lifecycle events.

## Features

- Provides the Application Version and Node.js Platform environments (`darwin`, `win32`, etc.) to the renderer.
- Automates the process of checking for application updates from GitHub Releases using `electron-updater`.
- Exposes IPC handles for the Renderer UI Layout header to prompt users towards a 1-click install (`system:perform-update`).

## Notes

- To test the updater in local development, it is stubbed by `app.isPackaged` constraints, and will always return the fallback `dev` value to prevent crash loops when no generic Provider is attached in Dev Server mode.
