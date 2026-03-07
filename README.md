# ToolHub Desktop

Hệ thống công cụ dành cho Developer.

## Cách chạy môi trường Dev

```bash
bun install
bun run dev
```

## Các lệnh có sẵn

- Xây dựng bản chuẩn bị đóng gói: `bun run build`
- Lints code: `bun run lint` hoặc `bun run format`
- Đóng gói cho macOS (yêu cầu máy Mac): `bun run package:mac`
- Tăng version (patch/minor/major): `bun run version:patch`
- Tự động release lên GitHub: `bun run release:patch`
