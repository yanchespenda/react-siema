# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

## [1.2.0] - 2026-03-01

### Changed

- Bumped package version from `1.1.1` to `1.2.0`.
- Upgraded development dependencies to modern versions, including:
  - `react` / `react-dom` `^19.2.4`
  - `@types/react` / `@types/react-dom` for React 19
  - `typescript` `^5.9.3`
  - updated ESLint + Prettier toolchain
- Updated peer dependency support to `react` and `react-dom` `^18.0.0 || ^19.0.0`.
- Updated TypeScript JSX setting to `react-jsx` and removed deprecated compiler options.
- Refactored `ReactSiema` internals for stricter typing and safer DOM/style handling while preserving the public API.
- Improved child slide style merging so existing child styles are preserved.
- Reworked `debounce` utility with stronger typing and cleaner timeout handling.

### Documentation

- Added React 18/19 compatibility section in the README.
